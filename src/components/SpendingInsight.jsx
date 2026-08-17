import { useState } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { getSpendingInsight } from "../lib/aiClient";

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

  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      const summary = buildSummary(transactions, months, catLabel);
      if (summary.months.every((m) => m.income === 0 && m.expense === 0)) {
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
      <div className="flex items-baseline justify-between mb-3">
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

      {!insight && !loading && (
        <div>
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
        <div className="flex items-center gap-2 text-sm text-(--color-ink-soft)">
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-(--color-brass) animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-(--color-brass) animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-(--color-brass) animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
          {t("insightThinking")}
        </div>
      )}

      {insight && !loading && (
        <p className="text-sm leading-relaxed animate-fade-in-up">{insight}</p>
      )}

      {error && <p className="mt-3 text-sm text-(--color-debit) font-medium">{error}</p>}
    </div>
  );
}
