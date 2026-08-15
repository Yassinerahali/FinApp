import { useState } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";

export default function AuthScreen({ signIn, signUp, resetPassword, initialMode = "signin", onBack }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState(initialMode); // "signin" | "signup" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function switchMode(next) {
    setMode(next);
    setError("");
    setNotice("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");

    if (mode === "reset") {
      if (!email) {
        setError(t("authMissingEmail"));
        return;
      }
      setSubmitting(true);
      try {
        await resetPassword(email);
        setNotice(t("resetLinkSent"));
      } catch (err) {
        setError(err.message || t("somethingWentWrong"));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!email || !password) {
      setError(t("authMissingFields"));
      return;
    }
    if (password.length < 6) {
      setError(t("authShortPassword"));
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        setNotice(t("authSignupNotice"));
        setMode("signin");
      }
    } catch (err) {
      setError(err.message || t("somethingWentWrong"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft) hover:text-(--color-ink)"
          >
            ← {t("landingBackToHome")}
          </button>
        )}
        <div className="flex justify-center gap-3 mb-4">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold tracking-tight">{t("appName")}</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-(--color-ink-soft) mt-1">
            {t("tagline")}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border border-(--color-rule) bg-(--color-paper) p-6"
        >
          {mode !== "reset" && (
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={`py-2.5 font-mono text-sm uppercase tracking-wide border transition-colors ${
                  mode === "signin"
                    ? "bg-(--color-ink) border-(--color-ink) text-(--color-paper)"
                    : "border-(--color-rule) text-(--color-ink-soft) hover:border-(--color-ink)"
                }`}
              >
                {t("signIn")}
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`py-2.5 font-mono text-sm uppercase tracking-wide border transition-colors ${
                  mode === "signup"
                    ? "bg-(--color-ink) border-(--color-ink) text-(--color-paper)"
                    : "border-(--color-rule) text-(--color-ink-soft) hover:border-(--color-ink)"
                }`}
              >
                {t("signUp")}
              </button>
            </div>
          )}

          {mode === "reset" && (
            <p className="text-sm text-(--color-ink-soft) mb-5">{t("resetInstructions")}</p>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-b border-(--color-ink) bg-transparent py-1.5 text-sm outline-none text-start"
              />
            </div>
            {mode !== "reset" && (
              <div>
                <label htmlFor="password" className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
                  {t("password")}
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-b border-(--color-ink) bg-transparent py-1.5 text-sm outline-none text-start"
                />
              </div>
            )}
          </div>

          {mode === "signin" && (
            <button
              type="button"
              onClick={() => switchMode("reset")}
              className="mt-3 font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft) hover:text-(--color-ink) underline decoration-(--color-rule) underline-offset-4"
            >
              {t("forgotPassword")}
            </button>
          )}

          {error && <p className="mt-4 text-sm text-(--color-debit) font-medium">{error}</p>}
          {notice && <p className="mt-4 text-sm text-(--color-credit) font-medium">{notice}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full bg-(--color-ink) text-(--color-paper) py-3 font-mono text-sm uppercase tracking-widest hover:bg-(--color-brass-dark) transition-colors disabled:opacity-60"
          >
            {submitting
              ? t("pleaseWait")
              : mode === "signin"
              ? t("signIn")
              : mode === "signup"
              ? t("createAccount")
              : t("sendResetLink")}
          </button>

          {mode === "reset" && (
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="mt-4 w-full font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft) hover:text-(--color-ink)"
            >
              ← {t("backToSignIn")}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
