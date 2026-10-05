import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { formatAmount, formatDate } from "../lib/format";
import { useLanguage } from "../lib/i18n/LanguageContext";

const CURRENCIES = [
  ["MAD", "balance_mad"],
  ["EUR", "balance_eur"],
  ["USD", "balance_usd"],
];

function BalanceCell({ user }) {
  // Show every currency the user actually holds; always show MAD.
  const lines = CURRENCIES.filter(([c, key]) => c === "MAD" || Number(user[key]) !== 0);
  return (
    <div className="space-y-0.5">
      {lines.map(([currency, key]) => {
        const value = Number(user[key]) || 0;
        return (
          <div
            key={currency}
            className={`font-mono tabular text-sm ${
              value < 0 ? "text-(--color-debit)" : "text-(--color-ink)"
            }`}
          >
            {value < 0 ? "−" : ""}
            {formatAmount(value, currency)}
          </div>
        );
      })}
    </div>
  );
}

const SORT_VALUE = {
  name: (u) => [u.first_name, u.last_name].filter(Boolean).join(" ").toLowerCase(),
  email: (u) => (u.email || "").toLowerCase(),
  created_at: (u) => u.created_at || "",
  last_sign_in_at: (u) => u.last_sign_in_at || "",
  balance: (u) => Number(u.balance_mad) || 0,
  tx_count: (u) => Number(u.tx_count) || 0,
  account_count: (u) => Number(u.account_count) || 0,
};

function SortHeader({ label, sortKey, sort, onSort, align = "start", className = "" }) {
  const active = sort.key === sortKey;
  const ariaSort = active ? (sort.dir === "asc" ? "ascending" : "descending") : "none";
  return (
    <th
      aria-sort={ariaSort}
      className={`py-2.5 font-normal text-${align} ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest whitespace-nowrap hover:text-(--color-ink) transition-colors ${
          active ? "text-(--color-ink)" : "text-(--color-ink-soft)"
        }`}
      >
        {label}
        <span aria-hidden="true" className={active ? "" : "opacity-30"}>
          {active ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );
}

const LOCALES = { en: "en-US", fr: "fr-FR", ar: "ar-MA" };

export default function AdminUsers() {
  const { t, lang } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "created_at", dir: "desc" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: rpcError } = await supabase.rpc("admin_list_users");
    if (rpcError) {
      setError(rpcError.code === "42501" ? t("adminForbidden") : t("adminLoadError"));
      setUsers([]);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const fullName = (u) => [u.first_name, u.last_name].filter(Boolean).join(" ");

  function handleSort(key) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : // Text sorts A→Z first; dates and balances start with the biggest/newest.
          { key, dir: key === "name" || key === "email" ? "asc" : "desc" }
    );
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? users.filter((u) => `${fullName(u)} ${u.email}`.toLowerCase().includes(q))
      : users;
    const getValue = SORT_VALUE[sort.key];
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      // Missing values (no name, never signed in) always sink to the bottom.
      const aEmpty = av === "";
      const bEmpty = bv === "";
      if (aEmpty !== bEmpty) return aEmpty ? 1 : -1;
      if (av === bv) return 0;
      return av > bv ? factor : -factor;
    });
  }, [users, query, sort]);

  const totalMad = useMemo(
    () => visible.reduce((sum, u) => sum + (Number(u.balance_mad) || 0), 0),
    [visible]
  );

  return (
    <div className="border border-(--color-rule) bg-(--color-paper) animate-fade-in-up">
      <div className="p-5 sm:p-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-semibold tracking-tight">{t("adminTitle")}</h2>
          <p className="text-xs text-(--color-ink-soft) mt-1">
            {t("adminSubtitle")}
            {!loading && !error && ` · ${t("adminUserCount", { count: visible.length })}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("adminSearch")}
            aria-label={t("adminSearch")}
            className="border border-(--color-rule) bg-transparent px-3 py-2 text-sm w-56 max-w-full"
          />
          <button
            onClick={load}
            disabled={loading}
            className="px-3 py-2 border border-(--color-rule) font-mono text-xs uppercase tracking-widest hover:border-(--color-brass) disabled:opacity-50 transition-colors"
          >
            {t("adminRefresh")}
          </button>
        </div>
      </div>

      {error ? (
        <p className="px-5 sm:px-6 pb-6 text-sm text-(--color-debit)">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-(--color-rule) bg-(--color-paper-bar)">
                <SortHeader label={t("adminName")} sortKey="name" sort={sort} onSort={handleSort} className="px-5 sm:px-6" />
                <SortHeader label={t("adminEmail")} sortKey="email" sort={sort} onSort={handleSort} className="px-3" />
                <SortHeader label={t("adminJoined")} sortKey="created_at" sort={sort} onSort={handleSort} className="px-3" />
                <SortHeader label={t("adminLastSignIn")} sortKey="last_sign_in_at" sort={sort} onSort={handleSort} className="px-3" />
                <SortHeader label={t("adminTransactions")} sortKey="tx_count" sort={sort} onSort={handleSort} className="px-3" />
                <SortHeader label={t("adminAccounts")} sortKey="account_count" sort={sort} onSort={handleSort} className="px-3" />
                <SortHeader label={t("adminBalance")} sortKey="balance" sort={sort} onSort={handleSort} align="end" className="px-5 sm:px-6" />
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => (
                <tr key={u.id} className="border-b border-(--color-rule) last:border-b-0">
                  <td className="px-5 sm:px-6 py-3 whitespace-nowrap">
                    {fullName(u) || <span className="text-(--color-ink-soft)">{t("adminNoName")}</span>}
                  </td>
                  <td className="px-3 py-3 text-(--color-ink-soft) break-all">{u.email}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-(--color-ink-soft)">
                    {u.created_at ? formatDate(u.created_at.slice(0, 10), LOCALES[lang] || "en-US") : "—"}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-(--color-ink-soft)">
                    {u.last_sign_in_at
                      ? formatDate(u.last_sign_in_at.slice(0, 10), LOCALES[lang] || "en-US")
                      : t("adminNever")}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="font-mono tabular">{Number(u.tx_count) || 0}</div>
                    <div className="text-xs text-(--color-ink-soft)">
                      {u.last_tx_date
                        ? t("adminLastTx", {
                            date: formatDate(u.last_tx_date, LOCALES[lang] || "en-US"),
                          })
                        : t("adminNoTx")}
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono tabular">{Number(u.account_count) || 0}</td>
                  <td className="px-5 sm:px-6 py-3">
                    <div className="flex justify-end">
                      <BalanceCell user={u} />
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-(--color-ink-soft)">
                    {t("adminNoUsers")}
                  </td>
                </tr>
              )}
            </tbody>
            {visible.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: "3px double var(--color-ink)" }}>
                  <td colSpan={6} className="px-5 sm:px-6 py-3 font-serif font-semibold">
                    {t("adminTotalMad")}
                  </td>
                  <td
                    className={`px-5 sm:px-6 py-3 text-end font-mono tabular font-semibold ${
                      totalMad < 0 ? "text-(--color-debit)" : "text-(--color-ink)"
                    }`}
                  >
                    {totalMad < 0 ? "−" : ""}
                    {formatAmount(totalMad)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
