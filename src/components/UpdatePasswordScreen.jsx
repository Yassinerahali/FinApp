import { useState } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";

export default function UpdatePasswordScreen({ updatePassword }) {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError(t("passwordTooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("passwordsDontMatch"));
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(password);
      setNotice(t("passwordUpdated"));
    } catch (err) {
      setError(err.message || t("somethingWentWrong"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="flex justify-center gap-3 mb-4">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold tracking-tight">{t("appName")}</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-(--color-ink-soft) mt-1">
            {t("setNewPassword")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="border border-(--color-rule) bg-(--color-paper) p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
                {t("newPassword")}
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-b border-(--color-ink) bg-transparent py-1.5 text-sm outline-none"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
                {t("confirmPassword")}
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full border-b border-(--color-ink) bg-transparent py-1.5 text-sm outline-none"
              />
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-(--color-debit) font-medium">{error}</p>}
          {notice && <p className="mt-4 text-sm text-(--color-credit) font-medium">{notice}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full bg-(--color-ink) text-(--color-paper) py-3 font-mono text-sm uppercase tracking-widest hover:bg-(--color-brass-dark) transition-colors disabled:opacity-60"
          >
            {submitting ? t("pleaseWait") : t("updatePassword")}
          </button>
        </form>
      </div>
    </div>
  );
}
