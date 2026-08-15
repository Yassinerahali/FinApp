import { useLanguage } from "../lib/i18n/LanguageContext";

export default function TransactionFilters({ filters, setFilters, accounts, showAccountFilter, categories }) {
  const { t, catLabel } = useLanguage();

  function update(patch) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  const hasActiveFilters =
    filters.search || filters.type !== "all" || filters.category !== "all" || filters.from || filters.to || (showAccountFilter && filters.accountId !== "all");

  function clear() {
    setFilters({
      search: "",
      type: "all",
      category: "all",
      from: "",
      to: "",
      accountId: "all",
    });
  }

  return (
    <div className="border border-(--color-rule) bg-(--color-paper) p-4 mb-4 space-y-3">
      <input
        type="text"
        value={filters.search}
        onChange={(e) => update({ search: e.target.value })}
        placeholder={t("searchPlaceholder")}
        className="w-full border-b border-(--color-ink) bg-transparent py-1.5 text-sm outline-none placeholder:text-(--color-rule)"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[10px] uppercase tracking-wide text-(--color-ink-soft) mb-1">
            {t("filterType")}
          </label>
          <select
            value={filters.type}
            onChange={(e) => update({ type: e.target.value })}
            className="w-full border-b border-(--color-rule) bg-transparent py-1 text-xs outline-none"
          >
            <option value="all">{t("filterAllTypes")}</option>
            <option value="income">{t("credit")}</option>
            <option value="expense">{t("debit")}</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wide text-(--color-ink-soft) mb-1">
            {t("filterCategory")}
          </label>
          <select
            value={filters.category}
            onChange={(e) => update({ category: e.target.value })}
            className="w-full border-b border-(--color-rule) bg-transparent py-1 text-xs outline-none"
          >
            <option value="all">{t("filterAllCategories")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {catLabel(c.id)}
              </option>
            ))}
          </select>
        </div>

        {showAccountFilter && (
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-(--color-ink-soft) mb-1">
              {t("account")}
            </label>
            <select
              value={filters.accountId}
              onChange={(e) => update({ accountId: e.target.value })}
              className="w-full border-b border-(--color-rule) bg-transparent py-1 text-xs outline-none"
            >
              <option value="all">{t("allAccounts")}</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-[10px] uppercase tracking-wide text-(--color-ink-soft) mb-1">
            {t("filterFrom")}
          </label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => update({ from: e.target.value })}
            className="w-full border-b border-(--color-rule) bg-transparent py-1 font-mono text-xs tabular outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wide text-(--color-ink-soft) mb-1">
            {t("filterTo")}
          </label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => update({ to: e.target.value })}
            className="w-full border-b border-(--color-rule) bg-transparent py-1 font-mono text-xs tabular outline-none"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clear}
          className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft) hover:text-(--color-ink) underline decoration-(--color-rule) underline-offset-4"
        >
          {t("clearFilters")}
        </button>
      )}
    </div>
  );
}
