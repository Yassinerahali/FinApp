import { formatAmount, formatDate } from "../lib/format";
import { useLanguage } from "../lib/i18n/LanguageContext";

export default function LedgerTable({ transactions, onDelete, onEdit, accountsById = {}, filtersActive = false }) {
  const { t, catLabel, locale } = useLanguage();

  if (transactions.length === 0) {
    return (
      <div className="border border-(--color-rule) bg-(--color-paper) p-10 text-center">
        {filtersActive ? (
          <p className="text-sm text-(--color-ink-soft)">{t("noMatchingEntries")}</p>
        ) : (
          <>
            <p className="font-serif text-lg mb-1">{t("emptyLedgerTitle")}</p>
            <p className="text-sm text-(--color-ink-soft)">{t("emptyLedgerBody")}</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="border border-(--color-rule) bg-(--color-paper)">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-(--color-ink) text-xs uppercase tracking-wide text-(--color-ink-soft)">
            <th className="text-start font-medium py-3 px-4 sm:px-5">{t("colDate")}</th>
            <th className="text-start font-medium py-3 px-4 sm:px-5 hidden sm:table-cell">{t("colCategory")}</th>
            <th className="text-start font-medium py-3 px-4 sm:px-5">{t("colDescription")}</th>
            <th className="text-end font-medium py-3 px-4 sm:px-5">{t("colAmount")}</th>
            <th className="w-20"></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr
              key={tx.id}
              className="border-b border-(--color-rule) last:border-b-0 group hover:bg-(--color-paper-bar)/50 transition-colors"
            >
              <td className="py-3 px-4 sm:px-5 font-mono text-xs tabular text-(--color-ink-soft) whitespace-nowrap">
                {formatDate(tx.date, locale)}
              </td>
              <td className="py-3 px-4 sm:px-5 hidden sm:table-cell text-(--color-ink-soft)">
                {catLabel(tx.category)}
                {tx.account_id && accountsById[tx.account_id] && (
                  <span className="text-(--color-rule)"> · {accountsById[tx.account_id]}</span>
                )}
              </td>
              <td className="py-3 px-4 sm:px-5">
                <span className="sm:hidden text-xs text-(--color-ink-soft) block">
                  {catLabel(tx.category)}
                  {tx.account_id && accountsById[tx.account_id] && ` · ${accountsById[tx.account_id]}`}
                </span>
                {tx.note || <span className="text-(--color-rule)">—</span>}
              </td>
              <td
                className={`py-3 px-4 sm:px-5 text-end font-mono tabular whitespace-nowrap ${
                  tx.type === "income" ? "text-(--color-credit)" : "text-(--color-debit)"
                }`}
              >
                {tx.type === "income" ? "+" : "−"}{formatAmount(tx.amount)}
              </td>
              <td className="pe-3">
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(tx)}
                    aria-label={t("editEntryAria")}
                    className="text-(--color-ink-soft) hover:text-(--color-brass-dark) text-xs px-1"
                  >
                    {t("edit")}
                  </button>
                  <button
                    onClick={() => onDelete(tx.id)}
                    aria-label={t("deleteEntryAria")}
                    className="text-(--color-ink-soft) hover:text-(--color-debit) text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
