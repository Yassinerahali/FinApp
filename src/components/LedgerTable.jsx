import { formatAmount, formatDate } from "../lib/format";
import { useLanguage } from "../lib/i18n/LanguageContext";

export default function LedgerTable({ transactions, onDelete, onEdit, accountsById = {}, filtersActive = false }) {
  const { t, catLabel, locale } = useLanguage();

  if (transactions.length === 0) {
    return (
      <div className="border border-(--color-rule) bg-(--color-paper) p-10 text-center animate-fade-in-up">
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
    <div className="border border-(--color-rule) bg-(--color-paper) animate-fade-in-up">
      {/* Mobile: stacked rows, plain flow — guaranteed to fit the screen
          width like every other card, no table-layout overflow risk. */}
      <div className="sm:hidden divide-y divide-(--color-rule)">
        {transactions.map((tx, index) => (
          <div key={tx.id} className="stagger-row p-4" style={{ "--i": Math.min(index, 14) }}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-xs tabular text-(--color-ink-soft)">
                {formatDate(tx.date, locale)}
              </span>
              <span
                className={`font-mono tabular text-sm shrink-0 ${
                  tx.type === "income" ? "text-(--color-credit)" : "text-(--color-debit)"
                }`}
              >
                {tx.type === "income" ? "+" : "−"}{formatAmount(tx.amount)}
              </span>
            </div>
            <div className="flex items-end justify-between gap-3 mt-1.5">
              <div className="min-w-0">
                <p className="text-xs text-(--color-ink-soft) truncate">
                  {catLabel(tx.category)}
                  {tx.account_id && accountsById[tx.account_id] && ` · ${accountsById[tx.account_id]}`}
                </p>
                <p className="text-sm truncate">
                  {tx.note || <span className="text-(--color-rule)">—</span>}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => onEdit(tx)}
                  aria-label={t("editEntryAria")}
                  className="text-(--color-ink-soft) hover:text-(--color-brass-dark) text-xs"
                >
                  {t("edit")}
                </button>
                <button
                  onClick={() => onDelete(tx.id)}
                  aria-label={t("deleteEntryAria")}
                  className="text-(--color-ink-soft) hover:text-(--color-debit) text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: the full table, unchanged. overflow-x-auto is just a
          safety net — at sm+ widths there's normally room for every
          column, but if a very long description ever pushed it wider,
          it scrolls within the card instead of shifting the page. */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-(--color-ink) text-xs uppercase tracking-wide text-(--color-ink-soft)">
              <th className="text-start font-medium py-3 px-5">{t("colDate")}</th>
              <th className="text-start font-medium py-3 px-5">{t("colCategory")}</th>
              <th className="text-start font-medium py-3 px-5">{t("colDescription")}</th>
              <th className="text-end font-medium py-3 px-5">{t("colAmount")}</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, index) => (
              <tr
                key={tx.id}
                className="stagger-row border-b border-(--color-rule) last:border-b-0 group hover:bg-(--color-paper-bar)/50"
                style={{ "--i": Math.min(index, 14) }}
              >
                <td className="py-3 px-5 font-mono text-xs tabular text-(--color-ink-soft) whitespace-nowrap">
                  {formatDate(tx.date, locale)}
                </td>
                <td className="py-3 px-5 text-(--color-ink-soft)">
                  {catLabel(tx.category)}
                  {tx.account_id && accountsById[tx.account_id] && (
                    <span className="text-(--color-rule)"> · {accountsById[tx.account_id]}</span>
                  )}
                </td>
                <td className="py-3 px-5">
                  {tx.note || <span className="text-(--color-rule)">—</span>}
                </td>
                <td
                  className={`py-3 px-5 text-end font-mono tabular whitespace-nowrap ${
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
    </div>
  );
}
