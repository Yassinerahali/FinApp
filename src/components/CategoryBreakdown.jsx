import { formatAmount } from "../lib/format";
import { useLanguage } from "../lib/i18n/LanguageContext";

export default function CategoryBreakdown({ transactions }) {
  const { t, catLabel } = useLanguage();
  const expenseByCategory = {};
  let total = 0;

  for (const tx of transactions) {
    if (tx.type !== "expense") continue;
    expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + tx.amount;
    total += tx.amount;
  }

  const rows = Object.entries(expenseByCategory)
    .map(([id, amount]) => ({
      id,
      name: catLabel(id),
      amount,
      pct: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  if (rows.length === 0) {
    return (
      <div className="border border-(--color-rule) bg-(--color-paper) p-5 sm:p-6">
        <h2 className="font-serif text-lg font-semibold tracking-tight mb-2">{t("byCategory")}</h2>
        <p className="text-sm text-(--color-ink-soft)">{t("noExpensesThisMonth")}</p>
      </div>
    );
  }

  return (
    <div className="border border-(--color-rule) bg-(--color-paper) p-5 sm:p-6">
      <h2 className="font-serif text-lg font-semibold tracking-tight mb-5">{t("byCategory")}</h2>
      <ul className="space-y-3.5">
        {rows.map((r) => (
          <li key={r.id}>
            <div className="flex items-baseline justify-between mb-1 text-sm">
              <span>{r.name}</span>
              <span className="font-mono tabular text-(--color-ink-soft)">{formatAmount(r.amount)}</span>
            </div>
            <div className="h-1.5 bg-(--color-paper-bar) overflow-hidden">
              <div
                className="h-full bg-(--color-brass)"
                style={{ width: `${Math.max(r.pct, 2)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
