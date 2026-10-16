import { useMemo } from "react";
import { formatAmount } from "../lib/format";
import { useLanguage } from "../lib/i18n/LanguageContext";

const DAY_MS = 24 * 60 * 60 * 1000;
const CURRENCIES = [
  ["MAD", "balance_mad"],
  ["EUR", "balance_eur"],
  ["USD", "balance_usd"],
];

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

// Overview of the whole user base (not affected by the table's search box).
export default function AdminOverview({ users }) {
  const { t } = useLanguage();

  const stats = useMemo(() => {
    const now = Date.now();
    const within = (iso, days) => iso && now - new Date(iso).getTime() <= days * DAY_MS;
    const total = users.length;
    const newWeek = users.filter((u) => within(u.created_at, 7)).length;
    const newMonth = users.filter((u) => within(u.created_at, 30)).length;
    const active = users.filter((u) => within(u.last_sign_in_at, 30)).length;
    const money = CURRENCIES.map(([currency, key]) => ({
      currency,
      value: users.reduce((sum, u) => sum + (Number(u[key]) || 0), 0),
    })).filter(({ currency, value }) => currency === "MAD" || value !== 0);
    return { total, newWeek, newMonth, active, money };
  }, [users]);

  const activePct = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;
  const [mainMoney, ...otherMoney] = stats.money;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card label={t("adminOvTotalUsers")}>
        <div className="font-mono tabular text-xl sm:text-2xl font-semibold">{stats.total}</div>
        <p className="mt-2 text-xs text-(--color-ink-soft)">
          {t("adminOvNew", { week: stats.newWeek, month: stats.newMonth })}
        </p>
      </Card>

      <Card label={t("adminOvActive")}>
        <div className="font-mono tabular text-xl sm:text-2xl font-semibold">{stats.active}</div>
        <div className="mt-3 h-1.5 w-full bg-(--color-rule) overflow-hidden">
          <div className="h-full bg-(--color-credit)" style={{ width: `${activePct}%` }} />
        </div>
        <p className="mt-2 text-xs text-(--color-ink-soft)">{t("adminOvActiveSub", { pct: activePct })}</p>
      </Card>

      <Card label={t("adminOvMoney")}>
        <div
          className={`font-mono tabular text-xl sm:text-2xl font-semibold truncate ${
            mainMoney.value < 0 ? "text-(--color-debit)" : "text-(--color-ink)"
          }`}
        >
          {mainMoney.value < 0 ? "−" : ""}
          {formatAmount(mainMoney.value, mainMoney.currency)}
        </div>
        {otherMoney.length > 0 ? (
          <div className="mt-2 space-y-0.5">
            {otherMoney.map(({ currency, value }) => (
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
          <p className="mt-2 text-xs text-(--color-ink-soft)">{t("adminOvMoneySub")}</p>
        )}
      </Card>
    </section>
  );
}
