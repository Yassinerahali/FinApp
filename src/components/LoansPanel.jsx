import { useEffect, useState } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { formatAmount, formatDate, todayISO } from "../lib/format";

export default function LoansPanel({ loans, addLoan, recordPayment, deleteLoan }) {
  const { t } = useLanguage();
  const [type, setType] = useState("lent");
  const [counterpartyName, setCounterpartyName] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [showSettled, setShowSettled] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const numeric = parseFloat(principalAmount);
    if (!counterpartyName.trim()) {
      setError(t("loanErrorName"));
      return;
    }
    if (!principalAmount || Number.isNaN(numeric) || numeric <= 0) {
      setError(t("loanErrorAmount"));
      return;
    }
    const { error: addError } = await addLoan({
      type,
      counterparty_name: counterpartyName.trim(),
      principal_amount: numeric,
      due_date: dueDate || null,
      note: note.trim(),
    });
    if (addError) {
      setError(addError.message || t("loanErrorGeneric"));
      return;
    }
    setCounterpartyName("");
    setPrincipalAmount("");
    setDueDate("");
    setNote("");
    setError("");
  }

  const active = loans.filter((l) => l.remaining_amount > 0);
  const settled = loans.filter((l) => l.remaining_amount <= 0);
  const lent = active.filter((l) => l.type === "lent");
  const borrowed = active.filter((l) => l.type === "borrowed");

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="border border-(--color-rule) bg-(--color-paper) p-5 sm:p-6">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-serif text-lg font-semibold tracking-tight">{t("newLoan")}</h2>
          <span className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft)">
            {t("loansSubtitle")}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-5">
          <button
            type="button"
            onClick={() => setType("lent")}
            className={`py-2.5 font-mono text-sm uppercase tracking-wide border transition-colors ${
              type === "lent"
                ? "bg-(--color-credit) border-(--color-credit) text-(--color-paper)"
                : "border-(--color-rule) text-(--color-ink-soft) hover:border-(--color-credit)"
            }`}
          >
            {t("iLent")}
          </button>
          <button
            type="button"
            onClick={() => setType("borrowed")}
            className={`py-2.5 font-mono text-sm uppercase tracking-wide border transition-colors ${
              type === "borrowed"
                ? "bg-(--color-debit) border-(--color-debit) text-(--color-paper)"
                : "border-(--color-rule) text-(--color-ink-soft) hover:border-(--color-debit)"
            }`}
          >
            {t("iBorrowed")}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="loan-name" className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
              {t("counterpartyName")}
            </label>
            <input
              id="loan-name"
              type="text"
              value={counterpartyName}
              onChange={(e) => setCounterpartyName(e.target.value)}
              placeholder={t("counterpartyNamePlaceholder")}
              className="w-full border-b border-(--color-ink) bg-transparent py-1.5 text-sm outline-none placeholder:text-(--color-rule)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="loan-amount" className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
                {t("principalAmount")}
              </label>
              <div className="flex items-center border-b border-(--color-ink)">
                <input
                  id="loan-amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={principalAmount}
                  onChange={(e) => setPrincipalAmount(e.target.value)}
                  className="w-full bg-transparent py-1.5 font-mono text-lg tabular outline-none placeholder:text-(--color-rule)"
                />
                <span className="font-mono text-xs text-(--color-ink-soft) ps-1">MAD</span>
              </div>
            </div>
            <div>
              <label htmlFor="loan-date" className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
                {t("dueDateOptional")}
              </label>
              <input
                id="loan-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border-b border-(--color-ink) bg-transparent py-1.5 font-mono text-sm tabular outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="loan-note" className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
              {t("note")} <span className="normal-case text-(--color-rule)">({t("optional")})</span>
            </label>
            <input
              id="loan-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border-b border-(--color-ink) bg-transparent py-1.5 text-sm outline-none"
            />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-(--color-debit) font-medium">{error}</p>}

        <button
          type="submit"
          className="mt-6 w-full bg-(--color-ink) text-(--color-paper) py-3 font-mono text-sm uppercase tracking-widest hover:bg-(--color-brass-dark) hover:-translate-y-0.5 hover:shadow-md transition-all"
        >
          {t("addLoan")}
        </button>
      </form>

      {active.length === 0 && settled.length === 0 ? (
        <div className="border border-(--color-rule) bg-(--color-paper) p-8 text-center">
          <p className="text-sm text-(--color-ink-soft)">{t("noLoansYet")}</p>
        </div>
      ) : (
        <>
          {lent.length > 0 && (
            <LoanGroup title={t("youAreOwed")} loans={lent} onPay={recordPayment} onDelete={deleteLoan} />
          )}
          {borrowed.length > 0 && (
            <LoanGroup title={t("youOwe")} loans={borrowed} onPay={recordPayment} onDelete={deleteLoan} />
          )}
          {settled.length > 0 && (
            <div>
              <button
                onClick={() => setShowSettled((v) => !v)}
                className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft) hover:text-(--color-ink) underline decoration-(--color-rule) underline-offset-4 mb-3"
              >
                {showSettled ? t("hideSettled") : t("showSettled", { count: settled.length })}
              </button>
              {showSettled && (
                <div className="space-y-3">
                  {settled.map((l) => (
                    <div
                      key={l.id}
                      className="border border-(--color-rule) bg-(--color-paper) p-4 flex items-center justify-between gap-3 opacity-70 animate-fade-in-up"
                    >
                      <div className="min-w-0">
                        <p className="text-sm truncate">{l.counterparty_name}</p>
                        <p className="text-xs text-(--color-credit) font-mono">{t("loanSettled")}</p>
                      </div>
                      <button
                        onClick={() => deleteLoan(l.id)}
                        aria-label={t("deleteLoanAria")}
                        className="text-(--color-ink-soft) hover:text-(--color-debit) text-xs shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LoanGroup({ title, loans, onPay, onDelete }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft) mb-3">{title}</p>
      <div className="space-y-4">
        {loans.map((l) => (
          <LoanCard key={l.id} loan={l} onPay={onPay} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

function LoanCard({ loan, onPay, onDelete }) {
  const { t, locale } = useLanguage();
  const [amount, setAmount] = useState("");
  const [barWidth, setBarWidth] = useState(0);

  const paid = loan.principal_amount - loan.remaining_amount;
  const pct = Math.min((paid / loan.principal_amount) * 100, 100);
  const isOverdue = loan.due_date && loan.due_date < todayISO();

  useEffect(() => {
    const id = requestAnimationFrame(() => setBarWidth(Math.max(pct, 2)));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  async function handlePay(e) {
    e.preventDefault();
    const numeric = parseFloat(amount);
    if (!amount || Number.isNaN(numeric) || numeric <= 0) return;
    await onPay(loan.id, numeric);
    setAmount("");
  }

  return (
    <div className="border border-(--color-rule) bg-(--color-paper) p-5 sm:p-6 animate-fade-in-up">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-serif text-lg font-semibold tracking-tight">{loan.counterparty_name}</h3>
        <button
          onClick={() => onDelete(loan.id)}
          aria-label={t("deleteLoanAria")}
          className="text-(--color-ink-soft) hover:text-(--color-debit) text-xs shrink-0"
        >
          ✕
        </button>
      </div>

      {loan.note && <p className="text-sm text-(--color-ink-soft) mb-2">{loan.note}</p>}

      <p className="font-mono tabular text-sm text-(--color-ink-soft) mb-1">
        {t("remainingOfPrincipal", {
          remaining: formatAmount(loan.remaining_amount),
          principal: formatAmount(loan.principal_amount),
        })}
      </p>

      {loan.due_date && (
        <p className={`text-xs font-mono mb-2 ${isOverdue ? "text-(--color-debit)" : "text-(--color-ink-soft)"}`}>
          {isOverdue ? t("overdueSince", { date: formatDate(loan.due_date, locale) }) : t("dueOn", { date: formatDate(loan.due_date, locale) })}
        </p>
      )}

      <div className="h-1.5 bg-(--color-paper-bar) overflow-hidden mb-4">
        <div
          className="h-full bg-(--color-brass) transition-all duration-500 ease-out"
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <form onSubmit={handlePay} className="flex gap-2">
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t("paymentAmountPlaceholder")}
          className="flex-1 border-b border-(--color-ink) bg-transparent py-1.5 font-mono text-sm tabular outline-none placeholder:text-(--color-rule)"
        />
        <button
          type="submit"
          className="shrink-0 border border-(--color-rule) px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-(--color-ink-soft) hover:border-(--color-ink) hover:text-(--color-ink) transition-colors"
        >
          {t("recordPayment")}
        </button>
      </form>
    </div>
  );
}
