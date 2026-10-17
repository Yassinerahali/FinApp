import { useEffect, useState } from "react";
import { adminUserAction } from "../lib/adminClient";
import { useLanguage } from "../lib/i18n/LanguageContext";

const ACTION_BUTTON =
  "px-3 py-2 border font-mono text-xs uppercase tracking-widest transition-colors disabled:opacity-50";

export default function AdminUserActions({ user, onClose, onChanged }) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);

  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  const disabled = Boolean(user.banned_until) && new Date(user.banned_until) > new Date();
  const emailMatches = confirmEmail.trim().toLowerCase() === (user.email || "").toLowerCase();

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && !busy) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  async function run(action, doneKey, extra) {
    setBusy(action);
    setError("");
    setMessage("");
    try {
      await adminUserAction(action, user.id, extra);
      if (action === "delete") {
        onChanged();
        onClose();
        return;
      }
      setMessage(t(doneKey));
      if (action !== "reset_password") onChanged();
    } catch (err) {
      setError(`${t("adminActionError")} (${err.message})`);
    } finally {
      setBusy("");
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-(--color-ink)/40 animate-fade-in"
      onClick={() => !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("adminManageTitle")}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto border border-(--color-rule) bg-(--color-paper) p-6 animate-scale-in"
      >
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="font-serif text-lg font-semibold tracking-tight">{t("adminManageTitle")}</h2>
          <button
            onClick={onClose}
            disabled={Boolean(busy)}
            aria-label={t("adminClose")}
            className="text-(--color-ink-soft) hover:text-(--color-ink) text-sm"
          >
            ✕
          </button>
        </div>
        <p className="text-sm mb-5">
          {name && <span className="font-semibold">{name} · </span>}
          <span className="text-(--color-ink-soft) break-all">{user.email}</span>
          {disabled && (
            <span className="ms-2 font-mono text-[10px] uppercase tracking-widest text-(--color-debit)">
              {t("adminDisabled")}
            </span>
          )}
        </p>

        {message && <p className="mb-4 text-sm text-(--color-credit)">{message}</p>}
        {error && <p className="mb-4 text-sm text-(--color-debit) break-words">{error}</p>}

        <div className="space-y-5">
          <section>
            <p className="text-xs text-(--color-ink-soft) mb-2">
              {t("adminResetPwDesc", { email: user.email })}
            </p>
            <button
              onClick={() => run("reset_password", "adminResetSent")}
              disabled={Boolean(busy)}
              className={`${ACTION_BUTTON} border-(--color-rule) hover:border-(--color-brass)`}
            >
              {busy === "reset_password" ? t("pleaseWait") : t("adminResetPw")}
            </button>
          </section>

          <section className="pt-5 border-t border-(--color-rule)">
            <p className="text-xs text-(--color-ink-soft) mb-2">
              {disabled ? t("adminEnableDesc") : t("adminDisableDesc")}
            </p>
            <button
              onClick={() =>
                disabled
                  ? run("enable", "adminEnabledDone")
                  : run("disable", "adminDisabledDone")
              }
              disabled={Boolean(busy)}
              className={`${ACTION_BUTTON} border-(--color-rule) hover:border-(--color-brass)`}
            >
              {busy === "disable" || busy === "enable"
                ? t("pleaseWait")
                : disabled
                  ? t("adminEnable")
                  : t("adminDisable")}
            </button>
          </section>

          <section className="pt-5 border-t border-(--color-rule)">
            <p className="text-xs text-(--color-ink-soft) mb-2">{t("adminDeleteDesc")}</p>
            {!deleting ? (
              <button
                onClick={() => setDeleting(true)}
                disabled={Boolean(busy)}
                className={`${ACTION_BUTTON} border-(--color-debit) text-(--color-debit) hover:bg-(--color-debit) hover:text-(--color-paper)`}
              >
                {t("adminDelete")}
              </button>
            ) : (
              <div className="space-y-2 animate-fade-in-up">
                <label className="block text-xs">
                  {t("adminDeleteConfirmLabel", { email: user.email })}
                  <input
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    autoFocus
                    autoComplete="off"
                    dir="ltr"
                    className="mt-1 w-full border border-(--color-rule) bg-transparent px-3 py-2 text-sm"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => run("delete", "adminDeletedDone", { confirmEmail })}
                    disabled={!emailMatches || Boolean(busy)}
                    className={`${ACTION_BUTTON} border-(--color-debit) bg-(--color-debit) text-(--color-paper)`}
                  >
                    {busy === "delete" ? t("pleaseWait") : t("adminDeleteButton")}
                  </button>
                  <button
                    onClick={() => {
                      setDeleting(false);
                      setConfirmEmail("");
                    }}
                    disabled={Boolean(busy)}
                    className={`${ACTION_BUTTON} border-(--color-rule) hover:border-(--color-brass)`}
                  >
                    {t("cancel")}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
