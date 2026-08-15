import { useState } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";

const KINDS = ["cash", "bank", "card", "other"];
const KIND_LABEL_KEYS = {
  cash: "accountKindCash",
  bank: "accountKindBank",
  card: "accountKindCard",
  other: "accountKindOther",
};

export default function AccountsPanel({ accounts, addAccount, renameAccount, deleteAccount }) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [kind, setKind] = useState("cash");
  const [renamingId, setRenamingId] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await addAccount(trimmed, kind);
    setName("");
    setKind("cash");
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

        <button
          type="submit"
          className="mt-5 w-full bg-(--color-ink) text-(--color-paper) py-3 font-mono text-sm uppercase tracking-widest hover:bg-(--color-brass-dark) transition-colors"
        >
          {t("addAccount")}
        </button>
      </form>

      <div className="border border-(--color-rule) bg-(--color-paper)">
        {accounts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-(--color-ink-soft)">{t("noAccountsYet")}</p>
          </div>
        ) : (
          <ul>
            {accounts.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 border-b border-(--color-rule) last:border-b-0 px-4 sm:px-5 py-3 group"
              >
                {renamingId === a.id ? (
                  <input
                    autoFocus
                    type="text"
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onBlur={() => commitRename(a.id)}
                    onKeyDown={(e) => e.key === "Enter" && commitRename(a.id)}
                    className="flex-1 border-b border-(--color-ink) bg-transparent text-sm outline-none"
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
