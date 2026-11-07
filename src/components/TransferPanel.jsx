import { useMemo, useState } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { formatAmount, formatDate, todayISO } from "../lib/format";
import { accountBalances, round2 } from "../lib/balances";

const HISTORY_LIMIT = 15;

export default function TransferPanel({ accounts, transactions, transfers, addTransfer, deleteTransfer }) {
  const { t, locale } = useLanguage();
  const [fromSel, setFromSel] = useState("");
  const [toSel, setToSel] = useState("");
  const [amount, setAmount] = useState("");
  const [received, setReceived] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const byId = useMemo(() => Object.fromEntries(accounts.map((a) => [a.id, a])), [accounts]);
  const balances = useMemo(
    () => accountBalances(accounts, transactions, transfers),
    [accounts, transactions, transfers]
  );

  // Selections fall back to sensible defaults (first account, then the
  // first *other* account) so there's no effect syncing needed when
  // accounts load or one is deleted.
  const fromId = byId[fromSel] ? fromSel : accounts[0]?.id || "";
  const toId =
    byId[toSel] && toSel !== fromId ? toSel : accounts.find((a) => a.id !== fromId)?.id || "";
  const from = byId[fromId];
  const to = byId[toId];

  const fromCurrency = from?.currency || "MAD";
  const toCurrency = to?.currency || "MAD";
  const crossCurrency = Boolean(from && to) && fromCurrency !== toCurrency;

  const sentValue = round2(parseFloat(amount) || 0);
  const receivedValue = crossCurrency ? round2(parseFloat(received) || 0) : sentValue;

  const fromAfter = from ? round2((balances.get(fromId) || 0) - sentValue) : 0;
  const toAfter = to ? round2((balances.get(toId) || 0) + receivedValue) : 0;
  const showPreview = from && to && sentValue > 0 && receivedValue > 0;

  function swap() {
    setFromSel(toId);
    setToSel(fromId);
    setReceived("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!from || !to || fromId === toId) {
      setError(t("transferSameAccount"));
      return;
    }
    if (!(sentValue > 0) || !(receivedValue > 0)) {
      setError(t("transferInvalidAmount"));
      return;
    }
    if (!date) return;
    setSaving(true);
    const { error: saveError } = await addTransfer({
      from_account_id: fromId,
      to_account_id: toId,
      amount: sentValue,
      to_amount: receivedValue,
      date,
      note: note.trim(),
    });
    setSaving(false);
    if (saveError) {
      setError(saveError.message || t("transferErrorGeneric"));
      return;
    }
    setAmount("");
    setReceived("");
    setNote("");
  }

  async function handleDelete(id) {
    if (window.confirm(t("transferDeleteConfirm"))) {
      await deleteTransfer(id);
    }
  }

  if (accounts.length < 2) {
    return (
      <div className="border border-(--color-rule) bg-(--color-paper) p-5 sm:p-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-lg font-semibold tracking-tight">{t("transferTitle")}</h2>
          <span className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft)">
            {t("transferSubtitle")}
          </span>
        </div>
        <p className="text-sm text-(--color-ink-soft)">{t("transferNeedTwoAccounts")}</p>
      </div>
    );
  }

  const visibleTransfers = showAll ? transfers : transfers.slice(0, HISTORY_LIMIT);
  const selectClass =
    "w-full border-b border-(--color-ink) bg-transparent py-1.5 text-sm outline-none";
  const labelClass = "block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5";

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="border border-(--color-rule) bg-(--color-paper) p-5 sm:p-6">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-serif text-lg font-semibold tracking-tight">{t("transferTitle")}</h2>
          <span className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft)">
            {t("transferSubtitle")}
          </span>
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1 min-w-0">
            <label htmlFor="transfer-from" className={labelClass}>
              {t("transferFrom")}
            </label>
            <select
              id="transfer-from"
              value={fromId}
              onChange={(e) => {
                setFromSel(e.target.value);
                setReceived("");
              }}
              className={selectClass}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency || "MAD"})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={swap}
            aria-label={t("transferSwapAria")}
            className="pb-1.5 text-lg leading-none text-(--color-ink-soft) hover:text-(--color-brass-dark) transition-colors"
          >
            ⇄
          </button>

          <div className="flex-1 min-w-0">
            <label htmlFor="transfer-to" className={labelClass}>
              {t("transferTo")}
            </label>
            <select
              id="transfer-to"
              value={toId}
              onChange={(e) => {
                setToSel(e.target.value);
                setReceived("");
              }}
              className={selectClass}
            >
              {accounts
                .filter((a) => a.id !== fromId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency || "MAD"})
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="transfer-amount" className={labelClass}>
              {t("transferAmount")}
            </label>
            <div className="flex items-center border-b border-(--color-ink)">
              <input
                id="transfer-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent py-1.5 font-mono text-sm tabular outline-none placeholder:text-(--color-rule)"
              />
              <span className="font-mono text-xs text-(--color-ink-soft) ps-1">{fromCurrency}</span>
            </div>
          </div>

          {crossCurrency && (
            <div className="flex-1">
              <label htmlFor="transfer-received" className={labelClass}>
                {t("transferReceived")}
              </label>
              <div className="flex items-center border-b border-(--color-ink)">
                <input
                  id="transfer-received"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={received}
                  onChange={(e) => setReceived(e.target.value)}
                  className="w-full bg-transparent py-1.5 font-mono text-sm tabular outline-none placeholder:text-(--color-rule)"
                />
                <span className="font-mono text-xs text-(--color-ink-soft) ps-1">{toCurrency}</span>
              </div>
            </div>
          )}

          <div className="flex-1">
            <label htmlFor="transfer-date" className={labelClass}>
              {t("transferDate")}
            </label>
            <input
              id="transfer-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border-b border-(--color-ink) bg-transparent py-1.5 text-sm outline-none"
            />
          </div>
        </div>

        {crossCurrency && (
          <p className="mt-2 text-xs text-(--color-ink-soft)">{t("transferCrossCurrencyHint")}</p>
        )}

        <div className="mt-4">
          <label htmlFor="transfer-note" className={labelClass}>
            {t("transferNote")}
          </label>
          <input
            id="transfer-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border-b border-(--color-ink) bg-transparent py-1.5 text-sm outline-none"
          />
        </div>

        {showPreview && (
          <dl className="mt-5 space-y-1.5 border border-(--color-rule) px-3 py-2.5">
            <dt className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft)">
              {t("transferAfter")}
            </dt>
            {[
              { account: from, value: fromAfter },
              { account: to, value: toAfter },
            ].map(({ account, value }) => (
              <dd key={account.id} className="flex items-baseline justify-between text-sm">
                <span className="text-(--color-ink-soft)">{account.name}</span>
                <span
                  className={`font-mono tabular ${value < 0 ? "text-(--color-debit)" : ""}`}
                >
                  {value < 0 ? "−" : ""}
                  {formatAmount(value, account.currency)}
                </span>
              </dd>
            ))}
            {fromAfter < 0 && (
              <p className="pt-1 text-xs text-(--color-debit)">
                {t("transferLowBalance", { name: from.name })}
              </p>
            )}
          </dl>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-5 w-full bg-(--color-ink) text-(--color-paper) py-3 font-mono text-sm uppercase tracking-widest hover:bg-(--color-brass-dark) transition-colors disabled:opacity-60"
        >
          {t("transferSubmit")}
        </button>
        {error && <p className="mt-3 text-sm text-(--color-debit) font-medium">{error}</p>}
      </form>

      <div className="border border-(--color-rule) bg-(--color-paper)">
        <div className="flex items-baseline justify-between px-4 sm:px-5 py-3 border-b border-(--color-rule)">
          <h3 className="font-serif font-semibold tracking-tight">{t("transferHistory")}</h3>
        </div>
        {transfers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-(--color-ink-soft)">{t("transferNone")}</p>
          </div>
        ) : (
          <ul>
            {visibleTransfers.map((tr, index) => {
              const src = byId[tr.from_account_id];
              const dst = byId[tr.to_account_id];
              const sentCurrency = src?.currency || "MAD";
              const gotCurrency = dst?.currency || "MAD";
              const cross = src && dst && sentCurrency !== gotCurrency;
              return (
                <li
                  key={tr.id}
                  className="stagger-row flex items-center justify-between gap-3 border-b border-(--color-rule) last:border-b-0 px-4 sm:px-5 py-3"
                  style={{ "--i": Math.min(index, 14) }}
                >
                  <div className="min-w-0">
                    <p className="text-sm truncate">
                      {src ? src.name : t("transferDeletedAccount")}
                      <span aria-hidden="true" className="mx-1.5 text-(--color-ink-soft)">→</span>
                      {dst ? dst.name : t("transferDeletedAccount")}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-(--color-ink-soft) truncate">
                      {formatDate(tr.date, locale)}
                      {tr.note ? ` · ${tr.note}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-end font-mono tabular text-sm">
                      <div>{formatAmount(tr.amount, sentCurrency)}</div>
                      {cross && (
                        <div className="text-xs text-(--color-ink-soft)">
                          → {formatAmount(tr.to_amount, gotCurrency)}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(tr.id)}
                      aria-label={t("deleteTransferAria")}
                      className="text-(--color-ink-soft) hover:text-(--color-debit) text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {transfers.length > HISTORY_LIMIT && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="w-full border-t border-(--color-rule) py-2.5 font-mono text-xs uppercase tracking-widest text-(--color-ink-soft) hover:text-(--color-brass-dark) transition-colors"
          >
            {showAll ? t("transferShowLess") : t("transferShowAll", { count: transfers.length })}
          </button>
        )}
      </div>
    </div>
  );
}
