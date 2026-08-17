import { useState } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { formatAmount, formatDate } from "../lib/format";
import {
  parseSpreadsheetFile,
  guessMapping,
  buildImportedTransactions,
} from "../lib/importParser";
import { suggestCategories } from "../lib/aiClient";

export default function ImportWizard({ categories, accounts, bulkAddTransactions, onClose }) {
  const { t, catLabel, locale } = useLanguage();
  const [step, setStep] = useState("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState(null);
  const [parsed, setParsed] = useState([]);
  const [error, setError] = useState("");
  const [aiNotice, setAiNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const { headers: h, rows: r } = await parseSpreadsheetFile(file);
      if (r.length === 0) {
        setError(t("importNoRows"));
        setBusy(false);
        return;
      }
      const guessed = guessMapping(h);
      setFileName(file.name);
      setHeaders(h);
      setRows(r);
      setMapping({
        ...guessed,
        defaultExpenseCategory: expenseCategories[0]?.id || "",
        defaultIncomeCategory: incomeCategories[0]?.id || "",
        accountId: accounts[0]?.id || "",
        autoCategorize: false,
      });
      setStep("map");
    } catch (err) {
      setError(err.message || t("importParseError"));
    } finally {
      setBusy(false);
    }
  }

  function updateMapping(patch) {
    setMapping((prev) => ({ ...prev, ...patch }));
  }

  async function handlePreview() {
    const built = buildImportedTransactions(rows, mapping);
    if (built.length === 0) {
      setError(t("importNoValidRows"));
      return;
    }
    setError("");
    setAiNotice("");

    if (mapping.autoCategorize) {
      setCategorizing(true);
      try {
        await categorizeInPlace(built, "expense", expenseCategories);
        await categorizeInPlace(built, "income", incomeCategories);
      } catch (err) {
        setAiNotice(err.message || t("suggestError"));
      } finally {
        setCategorizing(false);
      }
    }

    setParsed(built);
    setStep("preview");
  }

  async function categorizeInPlace(built, txType, typeCategories) {
    const indices = built.map((tx, i) => (tx.type === txType ? i : -1)).filter((i) => i !== -1);
    if (indices.length === 0 || typeCategories.length === 0) return;
    const notes = indices.map((i) => built[i].note);
    const results = await suggestCategories(notes, typeCategories);
    indices.forEach((rowIndex, j) => {
      if (results[j]) built[rowIndex].category = results[j];
    });
  }

  async function handleConfirmImport() {
    setBusy(true);
    setError("");
    const { error: importError } = await bulkAddTransactions(parsed);
    setBusy(false);
    if (importError) {
      setError(importError.message || t("somethingWentWrong"));
      return;
    }
    setImportedCount(parsed.length);
    setStep("done");
  }

  const skippedCount = rows.length - parsed.length;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-(--color-ink)/40 animate-fade-in">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto border border-(--color-rule) bg-(--color-paper) p-6 animate-scale-in">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-serif text-lg font-semibold tracking-tight">{t("importTitle")}</h2>
          <button
            onClick={onClose}
            aria-label={t("importCancel")}
            className="text-(--color-ink-soft) hover:text-(--color-ink) text-sm"
          >
            ✕
          </button>
        </div>

        {step === "upload" && (
          <div key="upload" className="animate-fade-in-up">
            <p className="text-sm text-(--color-ink-soft) mb-5">{t("importUploadPrompt")}</p>
            <label className="block border border-dashed border-(--color-rule) hover:border-(--color-brass) transition-colors p-8 text-center cursor-pointer">
              <span className="font-mono text-xs uppercase tracking-widest text-(--color-ink-soft)">
                {busy ? t("pleaseWait") : t("importChooseFile")}
              </span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFile}
                disabled={busy}
                className="hidden"
              />
            </label>
            {error && <p className="mt-4 text-sm text-(--color-debit) font-medium">{error}</p>}
          </div>
        )}

        {step === "map" && mapping && (
          <div key="map" className="space-y-4 animate-fade-in-up">
            <p className="font-mono text-xs text-(--color-ink-soft) truncate" dir="ltr">
              {fileName}
            </p>
            <p className="text-sm text-(--color-ink-soft)">
              {t("importRowsFound", { count: rows.length })}
            </p>

            <FieldSelect
              label={t("importDateColumn")}
              value={mapping.dateCol}
              onChange={(v) => updateMapping({ dateCol: Number(v) })}
              options={headers.map((h, i) => [i, h])}
            />
            <FieldSelect
              label={t("importDateFormat")}
              value={mapping.dateFormat}
              onChange={(v) => updateMapping({ dateFormat: v })}
              options={[
                ["DMY", t("importDMY")],
                ["MDY", t("importMDY")],
              ]}
            />
            <FieldSelect
              label={t("importNoteColumn")}
              value={mapping.noteCol}
              onChange={(v) => updateMapping({ noteCol: v === "" ? "" : Number(v) })}
              options={[["", t("importNoneOption")], ...headers.map((h, i) => [i, h])]}
            />

            <div>
              <label className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
                {t("importAmountMode")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateMapping({ amountMode: "separate" })}
                  className={`py-2 font-mono text-xs uppercase tracking-wide border transition-colors ${
                    mapping.amountMode === "separate"
                      ? "bg-(--color-ink) border-(--color-ink) text-(--color-paper)"
                      : "border-(--color-rule) text-(--color-ink-soft) hover:border-(--color-ink)"
                  }`}
                >
                  {t("importSeparateColumns")}
                </button>
                <button
                  type="button"
                  onClick={() => updateMapping({ amountMode: "single" })}
                  className={`py-2 font-mono text-xs uppercase tracking-wide border transition-colors ${
                    mapping.amountMode === "single"
                      ? "bg-(--color-ink) border-(--color-ink) text-(--color-paper)"
                      : "border-(--color-rule) text-(--color-ink-soft) hover:border-(--color-ink)"
                  }`}
                >
                  {t("importSingleColumn")}
                </button>
              </div>
            </div>

            {mapping.amountMode === "separate" ? (
              <div className="grid grid-cols-2 gap-4">
                <FieldSelect
                  label={t("importDebitColumn")}
                  value={mapping.debitCol}
                  onChange={(v) => updateMapping({ debitCol: Number(v) })}
                  options={headers.map((h, i) => [i, h])}
                />
                <FieldSelect
                  label={t("importCreditColumn")}
                  value={mapping.creditCol}
                  onChange={(v) => updateMapping({ creditCol: Number(v) })}
                  options={headers.map((h, i) => [i, h])}
                />
              </div>
            ) : (
              <>
                <FieldSelect
                  label={t("importAmountColumn")}
                  value={mapping.amountCol}
                  onChange={(v) => updateMapping({ amountCol: Number(v) })}
                  options={headers.map((h, i) => [i, h])}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={mapping.negativeIsExpense}
                    onChange={(e) => updateMapping({ negativeIsExpense: e.target.checked })}
                  />
                  {t("importNegativeIsExpense")}
                </label>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FieldSelect
                label={t("importDefaultExpenseCategory")}
                value={mapping.defaultExpenseCategory}
                onChange={(v) => updateMapping({ defaultExpenseCategory: v })}
                options={expenseCategories.map((c) => [c.id, catLabel(c.id)])}
              />
              <FieldSelect
                label={t("importDefaultIncomeCategory")}
                value={mapping.defaultIncomeCategory}
                onChange={(v) => updateMapping({ defaultIncomeCategory: v })}
                options={incomeCategories.map((c) => [c.id, catLabel(c.id)])}
              />
            </div>

            <FieldSelect
              label={t("importTargetAccount")}
              value={mapping.accountId}
              onChange={(v) => updateMapping({ accountId: v })}
              options={[["", t("importDontAssign")], ...accounts.map((a) => [a.id, a.name])]}
            />

            <label className="flex items-start gap-2 text-sm border-t border-(--color-rule) pt-4">
              <input
                type="checkbox"
                checked={mapping.autoCategorize}
                onChange={(e) => updateMapping({ autoCategorize: e.target.checked })}
                className="mt-0.5"
              />
              <span>
                ✨ {t("importAutoCategorize")}
                <span className="block text-xs text-(--color-ink-soft) mt-0.5">
                  {t("importAutoCategorizeHint")}
                </span>
              </span>
            </label>

            {error && <p className="text-sm text-(--color-debit) font-medium">{error}</p>}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep("upload")}
                disabled={categorizing}
                className="flex-1 border border-(--color-rule) text-(--color-ink-soft) py-3 font-mono text-sm uppercase tracking-widest hover:border-(--color-ink) hover:text-(--color-ink) transition-colors disabled:opacity-60"
              >
                {t("importBack")}
              </button>
              <button
                onClick={handlePreview}
                disabled={categorizing}
                className="flex-1 bg-(--color-ink) text-(--color-paper) py-3 font-mono text-sm uppercase tracking-widest hover:bg-(--color-brass-dark) transition-colors disabled:opacity-60"
              >
                {categorizing ? t("importCategorizing") : t("importPreviewButton")}
              </button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div key="preview" className="space-y-4 animate-fade-in-up">
            <p className="text-sm text-(--color-ink-soft)">
              {t("importPreviewSummary", { count: parsed.length })}
              {skippedCount > 0 ? ` ${t("importSkippedRows", { count: skippedCount })}` : ""}
            </p>
            {aiNotice && <p className="text-xs text-(--color-debit)">{aiNotice}</p>}
            <div className="border border-(--color-rule) max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <tbody>
                  {parsed.slice(0, 10).map((tx, i) => (
                    <tr
                      key={i}
                      className="stagger-row border-b border-(--color-rule) last:border-b-0"
                      style={{ "--i": i }}
                    >
                      <td className="p-2 font-mono tabular whitespace-nowrap">
                        {formatDate(tx.date, locale)}
                      </td>
                      <td className="p-2 truncate max-w-[9rem]">{catLabel(tx.category)}</td>
                      <td className="p-2 truncate max-w-[10rem] text-(--color-ink-soft)">{tx.note}</td>
                      <td
                        className={`p-2 text-end font-mono tabular whitespace-nowrap ${
                          tx.type === "income" ? "text-(--color-credit)" : "text-(--color-debit)"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "−"}
                        {formatAmount(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsed.length > 10 && (
              <p className="text-xs text-(--color-ink-soft)">
                {t("importPreviewMore", { count: parsed.length - 10 })}
              </p>
            )}

            {error && <p className="text-sm text-(--color-debit) font-medium">{error}</p>}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep("map")}
                disabled={busy}
                className="flex-1 border border-(--color-rule) text-(--color-ink-soft) py-3 font-mono text-sm uppercase tracking-widest hover:border-(--color-ink) hover:text-(--color-ink) transition-colors disabled:opacity-60"
              >
                {t("importBack")}
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={busy}
                className="flex-1 bg-(--color-ink) text-(--color-paper) py-3 font-mono text-sm uppercase tracking-widest hover:bg-(--color-brass-dark) transition-colors disabled:opacity-60"
              >
                {busy ? t("pleaseWait") : t("importConfirmButton", { count: parsed.length })}
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

function FieldSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-b border-(--color-ink) bg-transparent py-1.5 text-sm outline-none"
      >
        {options.map(([val, label]) => (
          <option key={val} value={val}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
