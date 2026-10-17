import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";

function lastNMonths(n) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      date: d,
    });
  }
  return out;
}

// New signups per month: one series, so one color and no legend; the
// title names it. The latest month and the busiest month carry a value
// label; every bar has a hover tooltip, and a hidden table mirrors the
// numbers for screen readers.
export default function AdminSignupsChart({ users, months = 6 }) {
  const { t, locale } = useLanguage();
  const [grown, setGrown] = useState(false);

  const data = useMemo(() => {
    const buckets = lastNMonths(months).map(({ key, date }) => ({
      key,
      count: 0,
      label: date.toLocaleDateString(locale, { month: "short", numberingSystem: "latn" }),
      full: date.toLocaleDateString(locale, {
        month: "long",
        year: "numeric",
        numberingSystem: "latn",
      }),
    }));
    const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));
    for (const u of users) {
      if (!u.created_at) continue;
      const d = new Date(u.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (byKey[key]) byKey[key].count += 1;
    }
    return buckets;
  }, [users, months, locale]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, [data]);

  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const peakIndex = data.findIndex((d) => d.count === max && d.count > 0);
  const lastIndex = data.length - 1;
  const chartHeight = 140;

  return (
    <div className="border border-(--color-rule) bg-(--color-paper) p-5 sm:p-6 animate-fade-in-up">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
        <h2 className="font-serif text-lg font-semibold tracking-tight">{t("adminChartTitle")}</h2>
        <span className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft)">
          {t("adminChartLast", { n: months })}
        </span>
      </div>

      <div role="img" aria-label={`${t("adminChartTitle")}: ${data.map((d) => `${d.full} ${d.count}`).join(", ")}`}>
        <div className="relative" style={{ height: chartHeight }}>
          {/* Recessive top guide labelled with the scale maximum */}
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-(--color-rule)" />
          <span className="absolute top-0 start-0 -translate-y-full pb-0.5 font-mono tabular text-[10px] text-(--color-ink-soft)">
            {max}
          </span>

          <div className="relative flex items-end gap-3 sm:gap-6 h-full">
            {data.map((d, index) => {
              const showLabel = d.count > 0 && (index === lastIndex || index === peakIndex);
              return (
                <div
                  key={d.key}
                  className="group flex-1 h-full flex flex-col items-center justify-end"
                  title={t("adminChartTip", { month: d.full, count: d.count })}
                >
                  <span
                    className={`mb-1 font-mono tabular text-xs text-(--color-ink) ${
                      showLabel ? "" : "invisible group-hover:visible"
                    }`}
                  >
                    {d.count}
                  </span>
                  <div
                    className="w-full max-w-10 bg-(--color-brass) transition-all ease-out group-hover:opacity-75"
                    style={{
                      height: grown ? `calc(${(d.count / max) * 100}% - 1.25rem)` : "0%",
                      minHeight: grown && d.count > 0 ? 2 : 0,
                      transitionDuration: "600ms",
                      transitionDelay: `${index * 60}ms`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 sm:gap-6 mt-2 border-t border-(--color-rule) pt-2">
          {data.map((d) => (
            <div key={d.key} className="flex-1 text-center">
              <span className="text-xs font-mono text-(--color-ink-soft)">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {total === 0 && (
        <p className="mt-3 text-xs text-(--color-ink-soft)">{t("adminChartNone")}</p>
      )}

      <table className="sr-only">
        <caption>{t("adminChartTitle")}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <th scope="row">{d.full}</th>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
