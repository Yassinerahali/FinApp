import { useEffect, useMemo, useState } from "react";
import { formatAmount } from "../lib/format";
import { useLanguage } from "../lib/i18n/LanguageContext";

function lastNMonthKeys(n) {
  const keys = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

function monthLabel(key, locale) {
  const [year, month] = key.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString(locale, { month: "short", numberingSystem: "latn" });
}

export default function TrendsChart({ transactions, months = 6 }) {
  const { t, locale } = useLanguage();
  const [grown, setGrown] = useState(false);

  const data = useMemo(() => {
    const keys = lastNMonthKeys(months);
    const byMonth = Object.fromEntries(keys.map((k) => [k, { income: 0, expense: 0 }]));

    for (const tx of transactions) {
      const key = tx.date.slice(0, 7);
      if (byMonth[key]) {
        byMonth[key][tx.type] += tx.amount;
      }
    }

    return keys.map((k) => ({ key: k, label: monthLabel(k, locale), ...byMonth[k] }));
  }, [transactions, months, locale]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, [data]);

  const max = Math.max(1, ...data.map((d) => Math.max(d.income, d.expense)));
  const chartHeight = 140;

  return (
    <div className="border border-(--color-rule) bg-(--color-paper) p-5 sm:p-6 animate-fade-in-up">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="font-serif text-lg font-semibold tracking-tight">
          {t("lastNMonths", { n: months })}
        </h2>
        <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-wide text-(--color-ink-soft)">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 inline-block bg-(--color-credit)" /> {t("income")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 inline-block bg-(--color-debit)" /> {t("expenses")}
          </span>
        </div>
      </div>

      <div className="flex items-end gap-4 sm:gap-6" style={{ height: chartHeight }}>
        {data.map((d, index) => (
          <div key={d.key} className="flex-1 flex flex-col items-center justify-end h-full">
            <div className="flex items-end gap-1 h-full w-full justify-center">
              <div
                className="w-1/3 max-w-5 bg-(--color-credit) transition-all ease-out hover:opacity-75"
                style={{
                  height: grown ? `${(d.income / max) * 100}%` : "0%",
                  minHeight: grown && d.income > 0 ? 2 : 0,
                  transitionDuration: "600ms",
                  transitionDelay: `${index * 60}ms`,
                }}
                title={`${t("income")}: ${formatAmount(d.income)}`}
              />
              <div
                className="w-1/3 max-w-5 bg-(--color-debit) transition-all ease-out hover:opacity-75"
                style={{
                  height: grown ? `${(d.expense / max) * 100}%` : "0%",
                  minHeight: grown && d.expense > 0 ? 2 : 0,
                  transitionDuration: "600ms",
                  transitionDelay: `${index * 60 + 30}ms`,
                }}
                title={`${t("expenses")}: ${formatAmount(d.expense)}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 sm:gap-6 mt-2 border-t border-(--color-rule) pt-2">
        {data.map((d) => (
          <div key={d.key} className="flex-1 text-center">
            <span className="text-xs font-mono text-(--color-ink-soft)">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
