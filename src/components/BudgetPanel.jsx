import { useEffect, useState } from "react";
import { formatAmount } from "../lib/format";
import { useLanguage } from "../lib/i18n/LanguageContext";

export default function BudgetPanel({ budgets, setBudget, monthTransactions, categories }) {
  const { t, catLabel } = useLanguage();
  const expenseCategories = categories.filter((c) => c.type === "expense");
  const spentByCategory = {};
  for (const tx of monthTransactions) {
    if (tx.type !== "expense") continue;
    spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + tx.amount;
  }

  return (
    <div className="border border-(--color-rule) bg-(--color-paper) p-5 sm:p-6 animate-fade-in-up">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="font-serif text-lg font-semibold tracking-tight">{t("monthlyBudgets")}</h2>
        <span className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft)">
          {t("perCategory")}
        </span>
      </div>

      <ul className="space-y-5">
        {expenseCategories.map((c, index) => (
          <BudgetRow
            key={c.id}
            index={index}
            name={catLabel(c.id)}
            limit={budgets[c.id]}
            spent={spentByCategory[c.id] || 0}
            onChange={(value) => setBudget(c.id, value)}
            t={t}
          />
        ))}
      </ul>
    </div>
  );
}

function BudgetRow({ index, name, limit, spent, onChange, t }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(limit ? String(limit) : "");
  const [barWidth, setBarWidth] = useState(0);

  function commit() {
    const numeric = parseFloat(draft);
    onChange(Number.isNaN(numeric) ? 0 : numeric);
    setEditing(false);
  }

  const hasLimit = typeof limit === "number" && limit > 0;
  const pct = hasLimit ? Math.min((spent / limit) * 100, 100) : 0;
  const over = hasLimit && spent > limit;

  useEffect(() => {
    const id = requestAnimationFrame(() => setBarWidth(hasLimit ? Math.max(pct, 2) : 0));
    return () => cancelAnimationFrame(id);
  }, [pct, hasLimit]);

  return (
    <li className="stagger-row" style={{ "--i": Math.min(index, 14) }}>
      <div className="flex items-baseline justify-between mb-1 text-sm">
        <span>{name}</span>
        {editing ? (
          <input
            autoFocus
            type="number"
            min="0"
            step="0.01"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            placeholder={t("amount")}
            className="w-24 border-b border-(--color-ink) bg-transparent text-end font-mono text-sm tabular outline-none"
          />
        ) : (
          <button
            onClick={() => {
              setDraft(limit ? String(limit) : "");
              setEditing(true);
            }}
            className="font-mono tabular text-(--color-ink-soft) hover:text-(--color-brass-dark) transition-colors"
          >
            {formatAmount(spent)} {hasLimit ? `/ ${formatAmount(limit)}` : `· ${t("setLimit")}`}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-(--color-paper-bar) overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${over ? "bg-(--color-debit)" : "bg-(--color-brass)"}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        {over && (
          <span role="img" aria-label={t("overBudget")} className="text-sm leading-none shrink-0 animate-pop-in">
            😔
          </span>
        )}
      </div>
      {over && (
        <p className="text-xs text-(--color-debit) mt-1">
          {formatAmount(spent - limit)} {t("overBudget")}
        </p>
      )}
    </li>
  );
}
