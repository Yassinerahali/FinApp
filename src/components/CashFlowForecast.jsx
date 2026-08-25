import { useMemo, useState } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { formatAmount, formatDate, todayISO } from "../lib/format";
import { projectFutureOccurrences } from "../lib/recurring";
import { useCountUp } from "../hooks/useCountUp";

const PERIODS = [30, 60, 90];
const MAX_EVENTS_SHOWN = 20;

function addDays(iso, days) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function buildForecast({ transactions, accounts, rules, loans, catLabel, days }) {
  const today = todayISO();
  const endISO = addDays(today, days);

  const currentBalance =
    accounts.reduce((sum, a) => sum + (a.opening_balance || 0), 0) +
    transactions.reduce((sum, tx) => sum + (tx.type === "income" ? tx.amount : -tx.amount), 0);

  const events = [];

  for (const rule of rules) {
    const dates = projectFutureOccurrences(
      { dayOfMonth: rule.dayOfMonth ?? rule.day_of_month },
      today,
      endISO
    );
    const label = rule.note || catLabel(rule.category);
    const signed = rule.type === "income" ? rule.amount : -rule.amount;
    for (const date of dates) {
      events.push({ date, label, amount: signed, key: `r-${rule.id}-${date}` });
    }
  }

  for (const loan of loans) {
    if (!loan.due_date || loan.remaining_amount <= 0) continue;
    if (loan.due_date < today || loan.due_date > endISO) continue;
    const signed = loan.type === "lent" ? loan.remaining_amount : -loan.remaining_amount;
    events.push({
      date: loan.due_date,
      label: loan.counterparty_name,
      amount: signed,
      key: `l-${loan.id}`,
    });
  }

  events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  let running = currentBalance;
  let dipDate = null;
  const withRunning = events.map((e) => {
    running += e.amount;
    if (running < 0 && dipDate === null) dipDate = e.date;
    return { ...e, runningBalance: running };
  });

  return {
    currentBalance,
    projectedBalance: running,
    events: withRunning,
    dipDate,
  };
}

export default function CashFlowForecast({ transactions, accounts, rules, loans, catLabel }) {
  const { t, locale } = useLanguage();
  const [days, setDays] = useState(30);

  const forecast = useMemo(
    () => buildForecast({ transactions, accounts, rules, loans, catLabel, days }),
    [transactions, accounts, rules, loans, catLabel, days]
  );

  const animatedProjected = useCountUp(forecast.projectedBalance);
  const isNegative = forecast.projectedBalance < 0;
  const visibleEvents = forecast.events.slice(0, MAX_EVENTS_SHOWN);
  const hiddenCount = forecast.events.length - visibleEvents.length;

  return (
    <div className="border border-(--color-rule) bg-(--color-paper) p-5 sm:p-6 animate-fade-in-up">
      <div className="flex items-baseline justify-between mb-5 flex-wrap gap-2">
        <h2 className="font-serif text-lg font-semibold tracking-tight">{t("forecastTitle")}</h2>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setDays(p)}
              className={`px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest border transition-colors ${
                days === p
                  ? "bg-(--color-ink) border-(--color-ink) text-(--color-paper)"
                  : "border-(--color-rule) text-(--color-ink-soft) hover:border-(--color-ink)"
              }`}
            >
              {t("forecastDays", { n: p })}
            </button>
          ))}
        </div>
      </div>

      <dl className="space-y-2.5 mb-4">
        <div className="flex items-baseline justify-between">
          <dt className="text-sm text-(--color-ink-soft)">{t("forecastCurrentBalance")}</dt>
          <dd className="font-mono tabular text-sm">{formatAmount(forecast.currentBalance)}</dd>
        </div>
      </dl>

      <div className="pt-3" style={{ borderTop: "3px double var(--color-ink)" }}>
        <div className="flex items-baseline justify-between">
          <dt className="font-serif font-semibold">{t("forecastProjectedBalance", { n: days })}</dt>
          <dd
            className={`font-mono tabular text-xl font-semibold ${
              isNegative ? "text-(--color-debit)" : "text-(--color-ink)"
            }`}
          >
            {isNegative ? "−" : ""}
            {formatAmount(animatedProjected)}
          </dd>
        </div>
      </div>

      {forecast.dipDate && (
        <p className="mt-3 text-xs text-(--color-debit) font-medium">
          {t("forecastMayDipNegative", { date: formatDate(forecast.dipDate, locale) })}
        </p>
      )}

      {visibleEvents.length === 0 ? (
        <p className="mt-5 text-sm text-(--color-ink-soft)">{t("forecastNoEvents")}</p>
      ) : (
        <ul className="mt-5 divide-y divide-(--color-rule) border-t border-(--color-rule)">
          {visibleEvents.map((e, index) => (
            <li
              key={e.key}
              className="stagger-row flex items-center justify-between gap-3 py-2.5 text-sm"
              style={{ "--i": Math.min(index, 14) }}
            >
              <div className="min-w-0 flex items-baseline gap-2">
                <span className="font-mono text-xs text-(--color-ink-soft) tabular shrink-0">
                  {formatDate(e.date, locale)}
                </span>
                <span className="truncate">{e.label}</span>
              </div>
              <div className="flex items-baseline gap-3 shrink-0">
                <span
                  className={`font-mono tabular ${
                    e.amount > 0 ? "text-(--color-credit)" : "text-(--color-debit)"
                  }`}
                >
                  {e.amount > 0 ? "+" : "−"}{formatAmount(Math.abs(e.amount))}
                </span>
                <span
                  className={`font-mono tabular text-xs w-20 text-end ${
                    e.runningBalance < 0 ? "text-(--color-debit)" : "text-(--color-ink-soft)"
                  }`}
                >
                  {formatAmount(e.runningBalance)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {hiddenCount > 0 && (
        <p className="mt-2 text-xs text-(--color-ink-soft)">{t("forecastMore", { count: hiddenCount })}</p>
      )}
    </div>
  );
}
