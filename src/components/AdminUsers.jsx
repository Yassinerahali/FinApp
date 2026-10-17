import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { formatAmount, formatDate } from "../lib/format";
import { exportUsersCSV } from "../lib/export";
import AdminOverview from "./AdminOverview";
import AdminSignupsChart from "./AdminSignupsChart";
import AdminFeatureAdoption from "./AdminFeatureAdoption";
import AdminUserActions from "./AdminUserActions";
import { ADMIN_EMAIL } from "../lib/admin";
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

function SortButton({ label, sortKey, sort, onSort }) {
  const active = sort.key === sortKey;
  return (
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
  );
}

function SortHeader({ label, sortKey, sort, onSort, align = "start", className = "" }) {
  const ariaSort =
    sort.key === sortKey ? (sort.dir === "asc" ? "ascending" : "descending") : "none";
  return (
    <th aria-sort={ariaSort} className={`py-2.5 font-normal text-${align} ${className}`}>
      <SortButton label={label} sortKey={sortKey} sort={sort} onSort={onSort} />
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
  const [adoption, setAdoption] = useState(null);
  const [adoptionError, setAdoptionError] = useState("");
  const [managingId, setManagingId] = useState(null);
  const [sort, setSort] = useState({ key: "created_at", dir: "desc" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    // The feature-adoption call is independent: if its migration hasn't been
    // run yet, only that card shows an error and the rest still works.
    const [usersRes, adoptionRes] = await Promise.all([
      supabase.rpc("admin_list_users"),
      supabase.rpc("admin_feature_adoption"),
    ]);
    const { data, error: rpcError } = usersRes;
    if (rpcError) {
      setError(
        rpcError.code === "42501"
          ? t("adminForbidden")
          : `${t("adminLoadError")} (${rpcError.message || rpcError.code})`
      );
      setUsers([]);
    } else {
      setUsers(data || []);
    }
    if (adoptionRes.error) {
      setAdoption(null);
      setAdoptionError(adoptionRes.error.message || adoptionRes.error.code || "error");
    } else {
      const row = Array.isArray(adoptionRes.data) ? adoptionRes.data[0] : adoptionRes.data;
      setAdoption(row || null);
      setAdoptionError("");
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

  // Look the user up by id so the dialog always shows fresh data after a
  // reload (and closes by itself once the user no longer exists).
  const managingUser = managingId ? users.find((u) => u.id === managingId) || null : null;

  const totalMad = useMemo(
    () => visible.reduce((sum, u) => sum + (Number(u.balance_mad) || 0), 0),
    [visible]
  );

  return (
    <div className="space-y-6">
    {!loading && !error && users.length > 0 && (
      <>
        <AdminOverview users={users} />
        <AdminSignupsChart users={users} />
        <AdminFeatureAdoption users={users} adoption={adoption} error={adoptionError} />
      </>
    )}
    <div className="border border-(--color-rule) bg-(--color-paper) animate-fade-in-up">
      <div className="p-5 sm:p-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-semibold tracking-tight">{t("adminTitle")}</h2>
          <p className="text-xs text-(--color-ink-soft) mt-1">
            {t("adminSubtitle")}
            {!loading && !error && ` · ${t("adminUserCount", { count: visible.length })}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("adminSearch")}
            aria-label={t("adminSearch")}
            className="border border-(--color-rule) bg-transparent px-3 py-2 text-sm w-full sm:w-56"
          />
          <button
            onClick={() => exportUsersCSV(visible)}
            disabled={loading || visible.length === 0}
            className="px-3 py-2 border border-(--color-rule) font-mono text-xs uppercase tracking-widest hover:border-(--color-brass) disabled:opacity-50 transition-colors"
          >
            {t("adminExportCsv")}
          </button>
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
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-y border-(--color-rule) bg-(--color-paper-bar)">
                <th
                  aria-sort={
                    sort.key === "name" || sort.key === "email"
                      ? sort.dir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className="px-4 sm:px-5 py-2.5 text-start font-normal"
                >
                  <div className="flex items-center gap-3">
                    <SortButton label={t("adminName")} sortKey="name" sort={sort} onSort={handleSort} />
                    <SortButton label={t("adminEmail")} sortKey="email" sort={sort} onSort={handleSort} />
                  </div>
                </th>
                <SortHeader label={t("adminJoined")} sortKey="created_at" sort={sort} onSort={handleSort} className="px-2.5" />
                <SortHeader label={t("adminLastSignIn")} sortKey="last_sign_in_at" sort={sort} onSort={handleSort} className="px-2.5" />
                <SortHeader label={t("adminTransactions")} sortKey="tx_count" sort={sort} onSort={handleSort} className="px-2.5" />
                <SortHeader label={t("adminAccounts")} sortKey="account_count" sort={sort} onSort={handleSort} className="px-2.5" />
                <SortHeader label={t("adminBalance")} sortKey="balance" sort={sort} onSort={handleSort} align="end" className="px-2.5" />
                <th className="px-4 sm:px-5 py-2.5 text-end font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft) font-normal">
                  {t("adminActions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => (
                <tr key={u.id} className="border-b border-(--color-rule) last:border-b-0">
                  <td className="px-4 sm:px-5 py-3 whitespace-nowrap">
                    <div>
                      {fullName(u) || <span className="text-(--color-ink-soft)">{t("adminNoName")}</span>}
                      {u.banned_until && new Date(u.banned_until) > new Date() && (
                        <span className="ms-2 font-mono text-[10px] uppercase tracking-widest text-(--color-debit)">
                          {t("adminDisabled")}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-(--color-ink-soft)">{u.email}</div>
                  </td>
                  <td className="px-2.5 py-3 whitespace-nowrap text-(--color-ink-soft)">
                    {u.created_at ? formatDate(u.created_at.slice(0, 10), LOCALES[lang] || "en-US") : "—"}
                  </td>
                  <td className="px-2.5 py-3 whitespace-nowrap text-(--color-ink-soft)">
                    {u.last_sign_in_at
                      ? formatDate(u.last_sign_in_at.slice(0, 10), LOCALES[lang] || "en-US")
                      : t("adminNever")}
                  </td>
                  <td className="px-2.5 py-3 whitespace-nowrap">
                    <div className="font-mono tabular">{Number(u.tx_count) || 0}</div>
                    <div className="text-xs text-(--color-ink-soft)">
                      {u.last_tx_date
                        ? t("adminLastTx", {
                            date: formatDate(u.last_tx_date, LOCALES[lang] || "en-US"),
                          })
                        : t("adminNoTx")}
                    </div>
                  </td>
                  <td className="px-2.5 py-3 font-mono tabular">{Number(u.account_count) || 0}</td>
                  <td className="px-2.5 py-3">
                    <div className="flex justify-end">
                      <BalanceCell user={u} />
                    </div>
                  </td>
                  <td className="px-4 sm:px-5 py-3 text-end whitespace-nowrap">
                    {(u.email || "").toLowerCase() !== ADMIN_EMAIL && (
                      <button
                        onClick={() => setManagingId(u.id)}
                        className="px-2.5 py-1.5 border border-(--color-rule) font-mono text-[11px] uppercase tracking-widest hover:border-(--color-brass) transition-colors"
                      >
                        {t("adminManage")}
                      </button>
                    )}
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
                  <td colSpan={5} className="px-4 sm:px-5 py-3 font-serif font-semibold">
                    {t("adminTotalMad")}
                  </td>
                  <td
                    className={`px-2.5 py-3 text-end whitespace-nowrap font-mono tabular font-semibold ${
                      totalMad < 0 ? "text-(--color-debit)" : "text-(--color-ink)"
                    }`}
                  >
                    {totalMad < 0 ? "−" : ""}
                    {formatAmount(totalMad)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
    {managingUser && (
      <AdminUserActions
        user={managingUser}
        onClose={() => setManagingId(null)}
        onChanged={load}
      />
    )}
    </div>
  );
}
