import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { getSpendingInsight } from "../lib/aiClient";
import { formatAmount } from "../lib/format";

function lastNMonthKeys(n) {
  const keys = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

function buildSummary(transactions, months, catLabel) {
  const keys = lastNMonthKeys(months);
  const byMonth = Object.fromEntries(keys.map((k) => [k, { income: 0, expense: 0 }]));
  const byCategory = {};

  for (const tx of transactions) {
    const key = tx.date.slice(0, 7);
    if (byMonth[key]) {
      byMonth[key][tx.type] += tx.amount;
    }
    if (tx.type === "expense" && keys.includes(key)) {
      byCategory[tx.category] = (byCategory[tx.category] || 0) + tx.amount;
    }
  }

  const monthsData = keys.map((k) => ({ month: k, ...byMonth[k] }));
  const topCategories = Object.entries(byCategory)
    .map(([id, amount]) => ({ category: catLabel(id), amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return { months: monthsData, topCategories };
}

export default function SpendingInsight({ transactions, months = 6 }) {
  const { t, lang, catLabel } = useLanguage();
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [barsGrown, setBarsGrown] = useState(false);

  const summary = useMemo(
    () => buildSummary(transactions, months, catLabel),
    [transactions, months, catLabel]
  );
  const hasData = summary.months.some((m) => m.income > 0 || m.expense > 0);
  const maxCategoryAmount = Math.max(1, ...summary.topCategories.map((c) => c.amount));

  useEffect(() => {
    const id = requestAnimationFrame(() => setBarsGrown(true));
    return () => cancelAnimationFrame(id);
  }, [summary.topCategories.length]);

  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      if (!hasData) {
        setError(t("insightNoData"));
        return;
      }
      const text = await getSpendingInsight(summary, lang);
      setInsight(text);
    } catch (err) {
      setError(err.message || t("suggestError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-(--color-rule) bg-(--color-paper) p-5 sm:p-6 animate-fade-in-up">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-serif text-lg font-semibold tracking-tight">✨ {t("insightTitle")}</h2>
        {insight && !loading && (
          <button
            onClick={handleGenerate}
            className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft) hover:text-(--color-ink) underline decoration-(--color-rule) underline-offset-4"
          >
            {t("insightRegenerate")}
          </button>
        )}
      </div>

      {hasData && summary.topCategories.length > 0 && (
        <div className="mb-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft) mb-3">
            {t("insightTopCategories", { n: months })}
          </p>
          <ul className="space-y-2.5">
            {summary.topCategories.map((c, index) => (
              <li key={c.category}>
                <div className="flex items-baseline justify-between mb-1 text-sm">
                  <span>{c.category}</span>
                  <span className="font-mono tabular text-(--color-ink-soft)">{formatAmount(c.amount)}</span>
                </div>
                <div className="h-1.5 bg-(--color-paper-bar) overflow-hidden">
                  <div
                    className="h-full bg-(--color-brass) transition-all duration-500 ease-out"
                    style={{
                      width: barsGrown ? `${Math.max((c.amount / maxCategoryAmount) * 100, 2)}%` : "0%",
                      transitionDelay: `${index * 60}ms`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!insight && !loading && (
        <div className={hasData && summary.topCategories.length > 0 ? "border-t border-(--color-rule) pt-4" : ""}>
          <p className="text-sm text-(--color-ink-soft) mb-4">{t("insightPrompt")}</p>
          <button
            onClick={handleGenerate}
            className="bg-(--color-ink) text-(--color-paper) px-5 py-2.5 font-mono text-sm uppercase tracking-widest hover:bg-(--color-brass-dark) hover:-translate-y-0.5 hover:shadow-md transition-all"
          >
            {t("insightGenerate")}
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-(--color-ink-soft) border-t border-(--color-rule) pt-4">
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-(--color-brass) animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-(--color-brass) animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-(--color-brass) animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
          {t("insightThinking")}
        </div>
      )}

      {insight && !loading && (
        <p className="text-sm leading-relaxed animate-fade-in-up border-t border-(--color-rule) pt-4">{insight}</p>
      )}

      {error && <p className="mt-3 text-sm text-(--color-debit) font-medium">{error}</p>}
    </div>
  );
}
