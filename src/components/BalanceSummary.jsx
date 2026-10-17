import { useMemo, useState } from "react";
import { formatAmount } from "../lib/format";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { useCountUp } from "../hooks/useCountUp";

export default function BalanceSummary({ transactions, accounts = [] }) {
  const { t } = useLanguage();
  const [accountId, setAccountId] = useState("all");

  // If the selected account was deleted, quietly fall back to "all".
  const selected = accounts.find((a) => a.id === accountId);
  const activeId = selected ? accountId : "all";
  const showFilter = accounts.length > 1;

  const { income, expense } = useMemo(() => {
    return transactions.reduce(
      (acc, tx) => {
        if (activeId !== "all" && tx.account_id !== activeId) return acc;
        if (tx.type === "income") acc.income += tx.amount;
        else acc.expense += tx.amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [transactions, activeId]);

  // "All accounts" keeps the original behaviour (MAD). A single account
  // shows its own currency.
  const currency = selected ? selected.currency || "MAD" : "MAD";

  const balance = income - expense;
  const isNegative = balance < 0;
  const animatedIncome = useCountUp(income);
  const animatedExpense = useCountUp(expense);
  const animatedBalance = useCountUp(balance);

  return (
    <div className="border border-(--color-rule) bg-(--color-paper) p-5 sm:p-6 animate-fade-in-up">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="font-serif text-lg font-semibold tracking-tight">{t("thisMonth")}</h2>

        {showFilter && (
          // Native <select> laid over a styled pill: looks like a button,
          // but opens the OS picker (great on mobile) and needs no popover code.
          <label
            className={`relative inline-flex items-center gap-1.5 max-w-[55%] rounded-full border px-3 py-1 text-xs transition-colors focus-within:border-(--color-brass) hover:border-(--color-brass) ${
              selected
                ? "border-(--color-brass) text-(--color-ink)"
                : "border-(--color-rule) text-(--color-ink-soft)"
            }`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M2 3h12l-4.5 5.5V13l-3-1.5V8.5L2 3z" />
            </svg>
            <span className="truncate">{selected ? selected.name : t("allAccounts")}</span>
            <span aria-hidden="true" className="text-[9px] leading-none">▾</span>
            <select
              value={activeId}
              onChange={(e) => setAccountId(e.target.value)}
              aria-label={t("account")}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
              <option value="all">{t("allAccounts")}</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <dl className="space-y-2.5 mb-4">
        <div className="flex items-baseline justify-between">
          <dt className="text-sm text-(--color-ink-soft)">{t("income")}</dt>
          <dd className="font-mono tabular text-(--color-credit)">+{formatAmount(animatedIncome, currency)}</dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="text-sm text-(--color-ink-soft)">{t("expenses")}</dt>
          <dd className="font-mono tabular text-(--color-debit)">−{formatAmount(animatedExpense, currency)}</dd>
        </div>
      </dl>

      <div className="pt-3" style={{ borderTop: "3px double var(--color-ink)" }}>
        <div className="flex items-baseline justify-between">
          <dt className="font-serif font-semibold">{t("balance")}</dt>
          <dd
            className={`font-mono tabular text-xl font-semibold ${
              isNegative ? "text-(--color-debit)" : "text-(--color-ink)"
            }`}
          >
            {isNegative ? "−" : ""}{formatAmount(animatedBalance, currency)}
          </dd>
        </div>
      </div>
    </div>
  );
}
