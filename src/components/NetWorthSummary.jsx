import { useMemo } from "react";
import { formatAmount } from "../lib/format";
import { useLanguage } from "../lib/i18n/LanguageContext";

export default function NetWorthSummary({ transactions, accounts }) {
  const { t } = useLanguage();

  const { total, byAccount, unassigned } = useMemo(() => {
    const byAccount = new Map(accounts.map((a) => [a.id, 0]));
    let unassigned = 0;
    let total = 0;

    for (const tx of transactions) {
      const signed = tx.type === "income" ? tx.amount : -tx.amount;
      total += signed;
      if (tx.account_id && byAccount.has(tx.account_id)) {
        byAccount.set(tx.account_id, byAccount.get(tx.account_id) + signed);
      } else {
        unassigned += signed;
      }
    }

    return { total, byAccount, unassigned };
  }, [transactions, accounts]);

  const isNegative = total < 0;

  return (
    <div className="border border-(--color-rule) bg-(--color-paper) p-5 sm:p-6">
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
                  {balance < 0 ? "−" : ""}{formatAmount(balance)}
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

      <div className="pt-3" style={{ borderTop: "3px double var(--color-ink)" }}>
        <div className="flex items-baseline justify-between">
          <dt className="font-serif font-semibold">{t("total")}</dt>
          <dd
            className={`font-mono tabular text-xl font-semibold ${
              isNegative ? "text-(--color-debit)" : "text-(--color-ink)"
            }`}
          >
            {isNegative ? "−" : ""}{formatAmount(total)}
          </dd>
        </div>
      </div>
    </div>
  );
}
