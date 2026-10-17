import { useMemo, useState } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { formatAmount, todayISO } from "../lib/format";
import { extractTransactionsFromImage } from "../lib/aiClient";
import { compressImageToDataUrl } from "../lib/imageUtils";
import { markDuplicates, toReviewRows, toTransactionInserts } from "../lib/screenshotImport";

const MAX_IMAGES = 5;

export default function ScreenshotImportWizard({
  categories,
  accounts,
  transactions,
  bulkAddTransactions,
  onClose,
}) {
  const { t, catLabel } = useLanguage();
  const [step, setStep] = useState("upload");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [progress, setProgress] = useState(null);
  const [busy, setBusy] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const account = accounts.find((a) => a.id === accountId);
  const currency = account?.currency || "MAD";

  const selectedRows = useMemo(
    () => rows.filter((r) => r.selected && r.date && Number(r.amount) > 0),
    [rows]
  );
  const selectedIncome = selectedRows
    .filter((r) => r.type === "income")
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const selectedExpense = selectedRows
    .filter((r) => r.type === "expense")
    .reduce((sum, r) => sum + Number(r.amount), 0);

  function defaultCategoryFor(type) {
    return (
      categories.find((c) => c.type === type && c.id === `other-${type}`)?.id ||
      categories.find((c) => c.type === type)?.id ||
      ""
    );
  }

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    setError("");
    setNotice("");
    if (files.length > MAX_IMAGES) {
      setError(t("scanTooMany", { count: MAX_IMAGES }));
      return;
    }
    if (files.some((f) => !f.type.startsWith("image/"))) {
      setError(t("scanNotImage"));
      return;
    }

    setBusy(true);
    const collected = [];
    let firstFailure = "";
    let droppedTotal = 0;

    for (let i = 0; i < files.length; i++) {
      setProgress({ current: i + 1, total: files.length });
      try {
        const dataUrl = await compressImageToDataUrl(files[i]);
        const { rows: extracted, dropped } = await extractTransactionsFromImage(
          dataUrl,
          categories,
          todayISO()
        );
        droppedTotal += dropped || 0;

        // Compare against the ledger and against earlier screenshots in this
        // batch, so overlapping screenshots don't import the same row twice.
        const pool = [...transactions, ...collected.map((r) => ({ ...r, account_id: accountId || null }))];
        const marked = markDuplicates(extracted, pool, accountId);
        collected.push(...toReviewRows(marked, categories, collected.length));
      } catch (err) {
        const message =
          err.message === "decode-failed" || err.message === "too-large"
            ? t("scanReadError")
            : err.message || t("somethingWentWrong");
        if (!firstFailure) firstFailure = message;
      }
    }

    setBusy(false);
    setProgress(null);

    if (collected.length === 0) {
      setError(firstFailure || t("scanNothingFound"));
      return;
    }

    const notes = [];
    if (firstFailure) notes.push(t("scanPartialFailure", { message: firstFailure }));
    if (droppedTotal > 0) notes.push(t("scanDroppedRows", { count: droppedTotal }));
    setNotice(notes.join(" "));
    setRows(collected);
    setStep("review");
  }

  function updateRow(id, patch) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function toggleType(row) {
    const nextType = row.type === "income" ? "expense" : "income";
    updateRow(row.id, { type: nextType, category: defaultCategoryFor(nextType) });
  }

  function setAllSelected(selected) {
    setRows((prev) => prev.map((r) => ({ ...r, selected: selected && Boolean(r.date) })));
  }

  async function handleConfirm() {
    const inserts = toTransactionInserts(rows, accountId);
    if (inserts.length === 0) return;
    setBusy(true);
    setError("");
    const { error: importError } = await bulkAddTransactions(inserts);
    setBusy(false);
    if (importError) {
      setError(importError.message || t("somethingWentWrong"));
      return;
    }
    setImportedCount(inserts.length);
    setStep("done");
  }

  const missingDateCount = rows.filter((r) => !r.date).length;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-(--color-ink)/40 animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-(--color-rule) bg-(--color-paper) p-6 animate-scale-in">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-serif text-lg font-semibold tracking-tight">{t("scanTitle")}</h2>
          <button
            onClick={onClose}
            aria-label={t("importCancel")}
            className="text-(--color-ink-soft) hover:text-(--color-ink) text-sm"
          >
            ✕
          </button>
        </div>

        {step === "upload" && (
          <div key="upload" className="space-y-4 animate-fade-in-up">
            <p className="text-sm text-(--color-ink-soft)">{t("scanUploadPrompt")}</p>

            <div>
              <label className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
                {t("importTargetAccount")}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                disabled={busy}
                className="w-full border-b border-(--color-ink) bg-transparent py-1.5 text-sm outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="block border border-dashed border-(--color-rule) hover:border-(--color-brass) transition-colors p-8 text-center cursor-pointer">
              <span className="font-mono text-xs uppercase tracking-widest text-(--color-ink-soft)">
                {busy && progress
                  ? t("scanScanning", { current: progress.current, total: progress.total })
                  : t("scanChooseImages")}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                disabled={busy || !accountId}
                className="hidden"
              />
            </label>

            <p className="text-xs text-(--color-ink-soft)">🔒 {t("scanPrivacy")}</p>
            {error && <p className="text-sm text-(--color-debit) font-medium">{error}</p>}
          </div>
        )}

        {step === "review" && (
          <div key="review" className="space-y-4 animate-fade-in-up">
            <p className="text-sm text-(--color-ink-soft)">
              {t("scanReviewSummary", { count: rows.length })}
            </p>
            <p className="text-xs text-(--color-ink-soft)">{t("scanVerifyHint")}</p>
            {notice && <p className="text-xs text-(--color-debit)">{notice}</p>}
            {missingDateCount > 0 && (
              <p className="text-xs text-(--color-debit)">
                {t("scanMissingDates", { count: missingDateCount })}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-wide">
              <button
                type="button"
                onClick={() => setAllSelected(true)}
                className="text-(--color-ink-soft) hover:text-(--color-ink) underline underline-offset-2"
              >
                {t("scanSelectAll")}
              </button>
              <button
                type="button"
                onClick={() => setAllSelected(false)}
                className="text-(--color-ink-soft) hover:text-(--color-ink) underline underline-offset-2"
              >
                {t("scanSelectNone")}
              </button>
            </div>

            <ul className="space-y-2">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className={`border p-3 space-y-2 ${
                    row.selected ? "border-(--color-ink)" : "border-(--color-rule) opacity-70"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="checkbox"
                      checked={row.selected}
                      disabled={!row.date}
                      onChange={(e) => updateRow(row.id, { selected: e.target.checked })}
                      aria-label={t("scanIncludeAria")}
                    />
                    <input
                      type="date"
                      dir="ltr"
                      value={row.date || ""}
                      onChange={(e) =>
                        updateRow(row.id, {
                          date: e.target.value || null,
                          selected: e.target.value ? row.selected || !row.duplicate : false,
                        })
                      }
                      aria-label={t("scanDateAria")}
                      className={`border-b bg-transparent py-1 text-sm outline-none font-mono ${
                        row.date ? "border-(--color-rule)" : "border-(--color-debit)"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => toggleType(row)}
                      aria-label={t("scanTypeAria")}
                      className={`px-2 py-1 font-mono text-xs border transition-colors ${
                        row.type === "income"
                          ? "border-(--color-credit) text-(--color-credit)"
                          : "border-(--color-debit) text-(--color-debit)"
                      }`}
                    >
                      {row.type === "income" ? t("scanIncome") : t("scanExpense")}
                    </button>
                    {row.duplicate && (
                      <span className="text-xs font-mono uppercase tracking-wide text-(--color-brass-dark)">
                        {t("scanDuplicateBadge")}
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    value={row.note}
                    onChange={(e) => updateRow(row.id, { note: e.target.value })}
                    aria-label={t("scanNoteAria")}
                    className="w-full border-b border-(--color-rule) bg-transparent py-1 text-sm outline-none"
                  />

                  <div className="flex gap-3">
                    <select
                      value={row.category}
                      onChange={(e) => updateRow(row.id, { category: e.target.value })}
                      aria-label={t("scanCategoryAria")}
                      className="flex-1 min-w-0 border-b border-(--color-rule) bg-transparent py-1 text-sm outline-none"
                    >
                      {categories
                        .filter((c) => c.type === row.type)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {catLabel(c.id)}
                          </option>
                        ))}
                    </select>
                    <input
                      type="number"
                      dir="ltr"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={row.amount}
                      onChange={(e) => updateRow(row.id, { amount: e.target.value })}
                      aria-label={t("scanAmountAria")}
                      className="w-32 border-b border-(--color-rule) bg-transparent py-1 text-sm text-end font-mono outline-none"
                    />
                  </div>
                </li>
              ))}
            </ul>

            <p className="text-xs text-(--color-ink-soft) font-mono tabular" dir="ltr">
              + {formatAmount(selectedIncome, currency)} · − {formatAmount(selectedExpense, currency)}
            </p>

            {error && <p className="text-sm text-(--color-debit) font-medium">{error}</p>}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setStep("upload");
                  setRows([]);
                  setError("");
                }}
                disabled={busy}
                className="flex-1 border border-(--color-rule) text-(--color-ink-soft) py-3 font-mono text-sm uppercase tracking-widest hover:border-(--color-ink) hover:text-(--color-ink) transition-colors disabled:opacity-60"
              >
                {t("importBack")}
              </button>
              <button
                onClick={handleConfirm}
                disabled={busy || selectedRows.length === 0}
                className="flex-1 bg-(--color-ink) text-(--color-paper) py-3 font-mono text-sm uppercase tracking-widest hover:bg-(--color-brass-dark) transition-colors disabled:opacity-60"
              >
                {busy ? t("pleaseWait") : t("importConfirmButton", { count: selectedRows.length })}
              </button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div key="done" className="text-center py-6 animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-(--color-credit)/15 flex items-center justify-center mx-auto mb-4 animate-pop-in">
              <span className="text-(--color-credit) text-xl leading-none">✓</span>
            </div>
            <p className="font-serif text-lg mb-2">{t("importSuccessTitle", { count: importedCount })}</p>
            <button
              onClick={onClose}
              className="mt-4 bg-(--color-ink) text-(--color-paper) px-6 py-3 font-mono text-sm uppercase tracking-widest hover:bg-(--color-brass-dark) hover:-translate-y-0.5 hover:shadow-md transition-all"
            >
              {t("importClose")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
