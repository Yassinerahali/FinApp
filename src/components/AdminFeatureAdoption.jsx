import { useMemo } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";

// adoption: the row from admin_feature_adoption(), or null if it failed.
// "Multiple accounts" is derived from the user list, so it always works.
export default function AdminFeatureAdoption({ users, adoption, error }) {
  const { t } = useLanguage();
  const total = users.length;

  const rows = useMemo(() => {
    if (!adoption) return [];
    const list = [
      { key: "budgets", label: t("adminFeatBudgets"), count: Number(adoption.with_budgets) || 0 },
      { key: "recurring", label: t("adminFeatRecurring"), count: Number(adoption.with_recurring) || 0 },
      { key: "goals", label: t("adminFeatGoals"), count: Number(adoption.with_goals) || 0 },
      { key: "loans", label: t("adminFeatLoans"), count: Number(adoption.with_loans) || 0 },
      {
        key: "categories",
        label: t("adminFeatCategories"),
        count: Number(adoption.with_custom_categories) || 0,
      },
      {
        key: "accounts",
        label: t("adminFeatAccounts"),
        count: users.filter((u) => (Number(u.account_count) || 0) >= 2).length,
      },
      { key: "push", label: t("adminFeatPush"), count: Number(adoption.with_push) || 0 },
    ];
    return list.sort((a, b) => b.count - a.count);
  }, [adoption, users, t]);

  return (
    <div className="border border-(--color-rule) bg-(--color-paper) p-5 sm:p-6 animate-fade-in-up">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
        <h2 className="font-serif text-lg font-semibold tracking-tight">{t("adminFeatTitle")}</h2>
        <span className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft)">
          {t("adminFeatSub")}
        </span>
      </div>

      {error ? (
        <p className="text-sm text-(--color-debit)">{t("adminFeatError")} ({error})</p>
      ) : (
        <>
          <ul className="space-y-3">
            {rows.map((r) => {
              const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
              return (
                <li key={r.key} title={`${r.label}: ${r.count} / ${total}`}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span>{r.label}</span>
                    <span className="font-mono tabular text-xs text-(--color-ink-soft) whitespace-nowrap">
                      {t("adminFeatOf", { count: r.count, total, pct })}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full bg-(--color-rule) overflow-hidden">
                    <div
                      className="h-full bg-(--color-brass) transition-all duration-500 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs text-(--color-ink-soft)">{t("adminFeatAiNote")}</p>
        </>
      )}
    </div>
  );
}
