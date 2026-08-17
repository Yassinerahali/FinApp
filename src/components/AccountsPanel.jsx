import { useState } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { formatAmount } from "../lib/format";

const KINDS = ["cash", "bank", "card", "other"];
const KIND_LABEL_KEYS = {
  cash: "accountKindCash",
  bank: "accountKindBank",
  card: "accountKindCard",
  other: "accountKindOther",
};

export default function AccountsPanel({ accounts, addAccount, renameAccount, updateOpeningBalance, deleteAccount }) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [kind, setKind] = useState("cash");
  const [openingBalance, setOpeningBalance] = useState("");
  const [renamingId, setRenamingId] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [editingBalanceId, setEditingBalanceId] = useState(null);
  const [balanceDraft, setBalanceDraft] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setError("");
    const parsedBalance = parseFloat(openingBalance);
    const { error: addError } = await addAccount(
      trimmed,
      kind,
      Number.isNaN(parsedBalance) ? 0 : parsedBalance
    );
    if (addError) {
      setError(addError.message || t("accountErrorGeneric"));
      return;
    }
    setName("");
    setKind("cash");
    setOpeningBalance("");
  }

  function startRename(account) {
    setRenamingId(account.id);
    setRenameDraft(account.name);
  }

  async function commitRename(id) {
    const trimmed = renameDraft.trim();
    if (trimmed) await renameAccount(id, trimmed);
    setRenamingId(null);
  }

  function startEditBalance(account) {
    setEditingBalanceId(account.id);
    setBalanceDraft(String(account.opening_balance ?? 0));
  }

  async function commitBalance(id) {
    const parsed = parseFloat(balanceDraft);
    await updateOpeningBalance(id, Number.isNaN(parsed) ? 0 : parsed);
    setEditingBalanceId(null);
  }

  async function handleDelete(id) {
    if (window.confirm(t("accountDeleteConfirm"))) {
      await deleteAccount(id);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="border border-(--color-rule) bg-(--color-paper) p-5 sm:p-6">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-serif text-lg font-semibold tracking-tight">{t("accountsTitle")}</h2>
          <span className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft)">
            {t("accountsSubtitle")}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("accountNamePlaceholder")}
            className="flex-1 border-b border-(--color-ink) bg-transparent py-1.5 text-sm outline-none placeholder:text-(--color-rule)"
          />
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="border-b border-(--color-ink) bg-transparent py-1.5 text-sm outline-none"
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {t(KIND_LABEL_KEYS[k])}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <label htmlFor="opening-balance" className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
            {t("startingBalance")}
          </label>
          <div className="flex items-center border-b border-(--color-ink) max-w-[10rem]">
            <input
              id="opening-balance"
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="w-full bg-transparent py-1.5 font-mono text-sm tabular outline-none placeholder:text-(--color-rule)"
            />
            <span className="font-mono text-xs text-(--color-ink-soft) ps-1">MAD</span>
          </div>
          <p className="mt-1.5 text-xs text-(--color-ink-soft)">{t("startingBalanceHint")}</p>
        </div>

        <button
          type="submit"
          className="mt-5 w-full bg-(--color-ink) text-(--color-paper) py-3 font-mono text-sm uppercase tracking-widest hover:bg-(--color-brass-dark) transition-colors"
        >
          {t("addAccount")}
        </button>
        {error && <p className="mt-3 text-sm text-(--color-debit) font-medium">{error}</p>}
      </form>

      <div className="border border-(--color-rule) bg-(--color-paper)">
        {accounts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-(--color-ink-soft)">{t("noAccountsYet")}</p>
          </div>
        ) : (
          <ul>
            {accounts.map((a, index) => (
              <li
                key={a.id}
                className="stagger-row flex items-center justify-between gap-3 border-b border-(--color-rule) last:border-b-0 px-4 sm:px-5 py-3 group"
                style={{ "--i": Math.min(index, 14) }}
              >
                <div className="min-w-0">
                  {renamingId === a.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      onBlur={() => commitRename(a.id)}
                      onKeyDown={(e) => e.key === "Enter" && commitRename(a.id)}
                      className="border-b border-(--color-ink) bg-transparent text-sm outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => startRename(a)}
                      className="text-start text-sm hover:text-(--color-brass-dark) transition-colors"
                    >
                      {a.name}
                      <span className="ms-2 font-mono text-xs text-(--color-ink-soft) uppercase tracking-wide">
                        {t(KIND_LABEL_KEYS[a.kind] || "accountKindOther")}
                      </span>
                    </button>
                  )}
                  <div className="mt-1">
                    {editingBalanceId === a.id ? (
                      <input
                        autoFocus
                        type="number"
                        step="0.01"
                        value={balanceDraft}
                        onChange={(e) => setBalanceDraft(e.target.value)}
                        onBlur={() => commitBalance(a.id)}
                        onKeyDown={(e) => e.key === "Enter" && commitBalance(a.id)}
                        className="w-24 border-b border-(--color-ink) bg-transparent font-mono text-xs tabular outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => startEditBalance(a)}
                        className="font-mono text-xs text-(--color-ink-soft) hover:text-(--color-brass-dark) transition-colors"
                      >
                        {t("startingBalance")}: {formatAmount(a.opening_balance || 0)}
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  aria-label={t("deleteAccountAria")}
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-(--color-ink-soft) hover:text-(--color-debit) text-xs transition-opacity shrink-0"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
