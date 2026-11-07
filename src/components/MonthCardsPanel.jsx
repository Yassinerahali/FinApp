import { useState } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { formatAmount } from "../lib/format";
import { currentMonthKey, monthLabel, monthStatus, planTotals } from "../lib/monthPlans";
import MonthCard from "./MonthCard";

const FILTERS = ["all", "past", "current", "upcoming"];
const FILTER_KEYS = { all: "mcAll", past: "mcPast", current: "mcCurrent", upcoming: "mcUpcoming" };

function Overview({ plans }) {
  const { t, locale } = useLanguage();
  const currentKey = currentMonthKey();
  const rows = plans.map((p) => ({ plan: p, totals: planTotals(p) }));
  const max = Math.max(1, ...rows.map((r) => Math.max(r.plan.salary, r.totals.total)));

  return (
    <section
      aria-labelledby="mc-overview-title"
      className="border border-(--color-rule) bg-(--color-paper) p-5 sm:p-6"
    >
      <h3 id="mc-overview-title" className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft) mb-3">
        {t("mcChartTitle")}
      </h3>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--color-ink-soft) mb-4">
        <span className="flex items-center gap-1.5">
          <i className="inline-block size-3 border-2 border-(--color-ink-soft)" />
          {t("mcLegendSalary")}
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block size-3 bg-(--color-credit)" />
          {t("mcLegendWithin")}
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block size-3 bg-(--color-debit)" />
          {t("mcLegendOver")}
        </span>
      </div>
      <div className="flex items-end gap-2 overflow-x-auto pb-1">
        {rows.map(({ plan, totals }) => {
          const over = totals.total > plan.salary;
          const { name, year } = monthLabel(plan.month, locale);
          const isCurrent = plan.month === currentKey;
          return (
            <div key={plan.month} className="flex-1 min-w-16 flex flex-col items-center gap-1.5">
              <div
                className="h-32 w-full flex items-end justify-center gap-1 border-b border-(--color-rule)"
                role="img"
                aria-label={`${name} ${year}: ${t("mcLegendSalary")} ${formatAmount(plan.salary)}, ${t("mcExpenses")} ${formatAmount(totals.total)}`}
              >
                <div
                  className="w-5 border-2 border-b-0 border-(--color-ink-soft)"
                  style={{ height: `${Math.max(2, (plan.salary / max) * 100)}%`, transition: "height 500ms ease-out" }}
                />
                <div
                  className={`w-5 ${over ? "bg-(--color-debit)" : "bg-(--color-credit)"}`}
                  style={{ height: `${Math.max(2, (totals.total / max) * 100)}%`, transition: "height 500ms ease-out" }}
                />
              </div>
              <span
                className={`text-xs font-semibold px-1.5 ${
                  isCurrent ? "bg-(--color-brass) text-(--color-paper)" : ""
                }`}
              >
                {name.slice(0, 3)} {String(year).slice(2)}
              </span>
              <span className="font-mono text-[11px] tabular text-(--color-ink-soft)">
                {Math.round(totals.total).toLocaleString("en-US")}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function MonthCardsPanel({ plans, loading, saveError, updatePlan, addMonth, deleteMonth }) {
  const { t, locale } = useLanguage();
  const [filter, setFilter] = useState("all");
  const [justAdded, setJustAdded] = useState(null);
  const currentKey = currentMonthKey();

  async function handleAdd() {
    const month = await addMonth();
    setFilter("all");
    setJustAdded(month);
  }

  const visible = plans.filter((p) => filter === "all" || monthStatus(p.month, currentKey) === filter);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-semibold tracking-tight">{t("mcTitle")}</h2>
          <p className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft)">{t("mcSubtitle")}</p>
        </div>
        {plans.length > 0 && (
          <button
            type="button"
            onClick={handleAdd}
            className="bg-(--color-ink) text-(--color-paper) px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-(--color-brass-dark)"
          >
            {t("mcAddNextMonth")}
          </button>
        )}
      </div>

      {saveError && (
        <p role="alert" className="text-sm text-(--color-debit) font-medium">
          {t("mcSaveError")}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-(--color-ink-soft)">{t("mcLoading")}</p>
      ) : plans.length === 0 ? (
        <div className="border border-dashed border-(--color-rule) bg-(--color-paper) p-8 text-center space-y-4">
          <p className="text-sm text-(--color-ink-soft)">{t("mcEmpty")}</p>
          <button
            type="button"
            onClick={handleAdd}
            className="bg-(--color-ink) text-(--color-paper) px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-(--color-brass-dark)"
          >
            {t("mcStartMonth", { month: monthLabel(currentKey, locale).name })}
          </button>
        </div>
      ) : (
        <>
          <Overview plans={plans} />

          <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("mcTitle")}>
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={`px-3.5 py-1.5 font-mono text-xs uppercase tracking-widest border ${
                  filter === f
                    ? "bg-(--color-ink) border-(--color-ink) text-(--color-paper)"
                    : "border-(--color-rule) text-(--color-ink-soft) hover:border-(--color-ink)"
                }`}
              >
                {t(FILTER_KEYS[f])}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
            {visible.map((plan) => (
              <MonthCard
                key={plan.month}
                plan={plan}
                phase={monthStatus(plan.month, currentKey)}
                defaultOpen={plan.month === justAdded}
                onChange={(updater) => updatePlan(plan.month, updater)}
                onDelete={() => deleteMonth(plan.month)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
