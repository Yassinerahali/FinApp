import { useMemo } from "react";
import { formatAmount } from "../lib/format";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { useCountUp } from "../hooks/useCountUp";

const CURRENCY_ORDER = ["MAD", "EUR", "USD"];

function monthKeyOf(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function pct(value) {
  return Math.abs(value).toLocaleString("en-US", {
    maximumFractionDigits: 1,
    numberingSystem: "latn",
  });
}

function Card({ label, children }) {
  return (
    <div className="border border-(--color-rule) bg-(--color-paper) p-4 sm:p-5 animate-fade-in-up min-w-0">
      <h3 className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft) mb-3">
        {label}
      </h3>
      {children}
    </div>
  );
}

export default function KpiRow({ transactions, accounts, income, expense }) {
  const { t } = useLanguage();

  // Total balance: opening balances + every transaction, per currency
  // (same rules as NetWorthSummary; unassigned transactions fold into MAD).
  const totals = useMemo(() => {
    const result = { MAD: 0, EUR: 0, USD: 0 };
    const accountCurrency = new Map(accounts.map((a) => [a.id, a.currency || "MAD"]));
    for (const a of accounts) {
      const c = a.currency || "MAD";
      result[c] = (result[c] || 0) + (a.opening_balance || 0);
    }
    for (const tx of transactions) {
      const signed = tx.type === "income" ? tx.amount : -tx.amount;
      const c = (tx.account_id && accountCurrency.get(tx.account_id)) || "MAD";
      result[c] = (result[c] || 0) + signed;
    }
    // MAD is always shown; EUR/USD only when an account uses them.
    const present = new Set(["MAD", ...accounts.map((a) => a.currency || "MAD")]);
    return CURRENCY_ORDER.filter((c) => present.has(c)).map((c) => ({
      currency: c,
      value: result[c] || 0,
    }));
  }, [transactions, accounts]);

  // Spending: this month so far vs. the same days of last month, so the
  // comparison stays fair early in the month.
  const { prevExpense } = useMemo(() => {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevKey = monthKeyOf(prev);
    const daysInPrev = new Date(prev.getFullYear(), prev.getMonth() + 1, 0).getDate();
    const cutoffDay = Math.min(now.getDate(), daysInPrev);
    let prevExpense = 0;
    for (const tx of transactions) {
      if (tx.type !== "expense" || !tx.date.startsWith(prevKey)) continue;
      if (Number(tx.date.slice(8, 10)) <= cutoffDay) prevExpense += tx.amount;
    }
    return { prevExpense };
  }, [transactions]);

  const net = income - expense;
  const savingsRate = income > 0 ? (net / income) * 100 : null;
  const change = prevExpense > 0 ? ((expense - prevExpense) / prevExpense) * 100 : null;
  const barTotal = income + expense;
  const incomeShare = barTotal > 0 ? (income / barTotal) * 100 : 0;

  const mainTotal = totals[0] || { currency: "MAD", value: 0 };
  const otherTotals = totals.slice(1);
  const animatedBalance = useCountUp(mainTotal.value);
  const animatedIncome = useCountUp(income);
  const animatedExpense = useCountUp(expense);
  const animatedNet = useCountUp(net);

  const rateClamped = savingsRate === null ? 0 : Math.max(0, Math.min(100, savingsRate));
  const rateNegative = savingsRate !== null && savingsRate < 0;

  // For spending, up is bad and down is good.
  const spendingUp = change !== null && change > 0;
  const changeColor = change === null || change === 0
    ? "text-(--color-ink-soft)"
    : spendingUp
      ? "text-(--color-debit)"
      : "text-(--color-credit)";

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card label={t("kpiTotalBalance")}>
        <div
          className={`font-mono tabular text-xl sm:text-2xl font-semibold truncate ${
            mainTotal.value < 0 ? "text-(--color-debit)" : "text-(--color-ink)"
          }`}
        >
          {mainTotal.value < 0 ? "−" : ""}
          {formatAmount(animatedBalance, mainTotal.currency)}
        </div>
        {otherTotals.length > 0 ? (
          <div className="mt-2 space-y-0.5">
            {otherTotals.map(({ currency, value }) => (
              <div
                key={currency}
                className={`font-mono tabular text-xs ${
                  value < 0 ? "text-(--color-debit)" : "text-(--color-ink-soft)"
                }`}
              >
                {value < 0 ? "−" : ""}
                {formatAmount(value, currency)}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-(--color-ink-soft)">{t("kpiAllAccounts")}</p>
        )}
      </Card>

      <Card label={t("kpiIncomeVsExpenses")}>
        <dl className="space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-xs text-(--color-ink-soft)">{t("income")}</dt>
            <dd className="font-mono tabular text-sm text-(--color-credit)">
              +{formatAmount(animatedIncome)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-xs text-(--color-ink-soft)">{t("expenses")}</dt>
            <dd className="font-mono tabular text-sm text-(--color-debit)">
              −{formatAmount(animatedExpense)}
            </dd>
          </div>
        </dl>
        <div
          className="mt-3 h-1.5 w-full flex overflow-hidden bg-(--color-rule)"
          role="img"
          aria-label={`${t("income")} ${formatAmount(income)} / ${t("expenses")} ${formatAmount(expense)}`}
        >
          <div className="bg-(--color-credit)" style={{ width: `${incomeShare}%` }} />
          <div className="bg-(--color-debit) flex-1" style={{ opacity: barTotal > 0 ? 1 : 0 }} />
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <span className="text-xs text-(--color-ink-soft)">{t("kpiNetThisMonth")}</span>
          <span
            className={`font-mono tabular text-sm font-semibold ${
              net < 0 ? "text-(--color-debit)" : "text-(--color-ink)"
            }`}
          >
            {net < 0 ? "−" : ""}
            {formatAmount(animatedNet)}
          </span>
        </div>
      </Card>

      <Card label={t("kpiSavingsRate")}>
        {savingsRate === null ? (
          <>
            <div className="font-mono tabular text-xl sm:text-2xl font-semibold text-(--color-ink-soft)">—</div>
            <p className="mt-2 text-xs text-(--color-ink-soft)">{t("kpiSavingsRateNoIncome")}</p>
          </>
        ) : (
          <>
            <div
              className={`font-mono tabular text-xl sm:text-2xl font-semibold ${
                rateNegative ? "text-(--color-debit)" : "text-(--color-ink)"
              }`}
            >
              {rateNegative ? "−" : ""}
              {pct(savingsRate)}%
            </div>
            <div className="mt-3 h-1.5 w-full bg-(--color-rule) overflow-hidden">
              <div
                className={rateNegative ? "bg-(--color-debit)" : "bg-(--color-credit)"}
                style={{ width: `${rateNegative ? 100 : rateClamped}%`, opacity: rateNegative ? 0.35 : 1 }}
              />
            </div>
            <p className="mt-2 text-xs text-(--color-ink-soft)">
              {rateNegative ? t("kpiSavingsRateOverspent") : t("kpiSavingsRateOf")}
            </p>
          </>
        )}
      </Card>

      <Card label={t("kpiMonthChange")}>
        {change === null ? (
          <>
            <div className="font-mono tabular text-xl sm:text-2xl font-semibold text-(--color-ink-soft)">—</div>
            <p className="mt-2 text-xs text-(--color-ink-soft)">{t("kpiMonthChangeNoPrev")}</p>
          </>
        ) : (
          <>
            <div className={`font-mono tabular text-xl sm:text-2xl font-semibold ${changeColor}`}>
              <span aria-hidden="true">{change === 0 ? "" : spendingUp ? "▲ " : "▼ "}</span>
              {pct(change)}%
            </div>
            <p className="mt-2 text-xs text-(--color-ink-soft)">
              {t("kpiMonthChangeSub", { prev: formatAmount(prevExpense) })}
            </p>
          </>
        )}
      </Card>
    </section>
  );
}
