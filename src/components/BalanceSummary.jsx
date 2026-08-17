import { formatAmount } from "../lib/format";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { useCountUp } from "../hooks/useCountUp";

export default function BalanceSummary({ income, expense }) {
  const { t } = useLanguage();
  const balance = income - expense;
  const isNegative = balance < 0;
  const animatedIncome = useCountUp(income);
  const animatedExpense = useCountUp(expense);
  const animatedBalance = useCountUp(balance);

  return (
    <div className="border border-(--color-rule) bg-(--color-paper) p-5 sm:p-6 animate-fade-in-up">
      <h2 className="font-serif text-lg font-semibold tracking-tight mb-5">{t("thisMonth")}</h2>

      <dl className="space-y-2.5 mb-4">
        <div className="flex items-baseline justify-between">
          <dt className="text-sm text-(--color-ink-soft)">{t("income")}</dt>
          <dd className="font-mono tabular text-(--color-credit)">+{formatAmount(animatedIncome)}</dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="text-sm text-(--color-ink-soft)">{t("expenses")}</dt>
          <dd className="font-mono tabular text-(--color-debit)">−{formatAmount(animatedExpense)}</dd>
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
            {isNegative ? "−" : ""}{formatAmount(animatedBalance)}
          </dd>
        </div>
      </div>
    </div>
  );
}
