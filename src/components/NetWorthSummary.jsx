import { useMemo } from "react";
import { formatAmount } from "../lib/format";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { useCountUp } from "../hooks/useCountUp";

const CURRENCY_ORDER = ["MAD", "EUR", "USD"];

export default function NetWorthSummary({ transactions, accounts }) {
  const { t } = useLanguage();

  const { totalsByCurrency, byAccount, unassigned, activeCurrencies } = useMemo(() => {
    const byAccount = new Map(accounts.map((a) => [a.id, a.opening_balance || 0]));
    const accountCurrency = new Map(accounts.map((a) => [a.id, a.currency || "MAD"]));
    const totalsByCurrency = { MAD: 0, EUR: 0, USD: 0 };
    let unassigned = 0;

    for (const a of accounts) {
      const curr = a.currency || "MAD";
      totalsByCurrency[curr] = (totalsByCurrency[curr] || 0) + (a.opening_balance || 0);
    }

    for (const tx of transactions) {
      const signed = tx.type === "income" ? tx.amount : -tx.amount;
      if (tx.account_id && byAccount.has(tx.account_id)) {
        byAccount.set(tx.account_id, byAccount.get(tx.account_id) + signed);
        const curr = accountCurrency.get(tx.account_id) || "MAD";
        totalsByCurrency[curr] = (totalsByCurrency[curr] || 0) + signed;
      } else {
        // Unassigned transactions have no account/currency of their own —
        // they fold into MAD, matching how the app behaved before
        // multi-currency existed.
        unassigned += signed;
        totalsByCurrency.MAD = (totalsByCurrency.MAD || 0) + signed;
      }
    }

    const present = new Set(accounts.map((a) => a.currency || "MAD"));
    if (unassigned !== 0) present.add("MAD");
    const activeCurrencies = CURRENCY_ORDER.filter((c) => present.has(c));
    if (activeCurrencies.length === 0) activeCurrencies.push("MAD");

    return { totalsByCurrency, byAccount, unassigned, activeCurrencies };
  }, [transactions, accounts]);

  // Fixed number of hook calls regardless of how many currencies are
  // actually in play — animate all three, only render the active ones.
  const animatedMAD = useCountUp(totalsByCurrency.MAD || 0);
  const animatedEUR = useCountUp(totalsByCurrency.EUR || 0);
  const animatedUSD = useCountUp(totalsByCurrency.USD || 0);
  const animatedByCurrency = { MAD: animatedMAD, EUR: animatedEUR, USD: animatedUSD };

  return (
    <div className="border border-(--color-rule) bg-(--color-paper) p-5 sm:p-6 animate-fade-in-up">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="font-serif text-lg font-semibold tracking-tight">{t("netWorth")}</h2>
        <span className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft)">
          {t("allTime")}
        </span>
      </div>

      {accounts.length > 0 && (
        <dl className="space-y-2.5 mb-4">
          {accounts.map((a) => {
            const balance = byAccount.get(a.id) || 0;
            return (
              <div key={a.id} className="flex items-baseline justify-between">
                <dt className="text-sm text-(--color-ink-soft)">{a.name}</dt>
                <dd
                  className={`font-mono tabular text-sm ${
                    balance < 0 ? "text-(--color-debit)" : "text-(--color-ink-soft)"
                  }`}
                >
                  {balance < 0 ? "−" : ""}{formatAmount(balance, a.currency)}
                </dd>
              </div>
            );
          })}
          {Math.abs(unassigned) > 0.004 && (
            <div className="flex items-baseline justify-between">
              <dt className="text-sm text-(--color-ink-soft)">{t("unassigned")}</dt>
              <dd
                className={`font-mono tabular text-sm ${
                  unassigned < 0 ? "text-(--color-debit)" : "text-(--color-ink-soft)"
                }`}
              >
                {unassigned < 0 ? "−" : ""}{formatAmount(unassigned)}
              </dd>
            </div>
          )}
        </dl>
      )}

      <div className="pt-3 space-y-1.5" style={{ borderTop: "3px double var(--color-ink)" }}>
        {activeCurrencies.map((currency) => {
          const value = totalsByCurrency[currency] || 0;
          const isNegative = value < 0;
          return (
            <div key={currency} className="flex items-baseline justify-between">
              <dt className="font-serif font-semibold">
                {activeCurrencies.length > 1 ? `${t("total")} (${currency})` : t("total")}
              </dt>
              <dd
                className={`font-mono tabular text-xl font-semibold ${
                  isNegative ? "text-(--color-debit)" : "text-(--color-ink)"
                }`}
              >
                {isNegative ? "−" : ""}
                {formatAmount(animatedByCurrency[currency], currency)}
              </dd>
            </div>
          );
        })}
      </div>
    </div>
  );
}
