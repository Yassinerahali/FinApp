import { useLanguage } from "../lib/i18n/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";

export default function SetupNotice() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-lg">
        <div className="flex justify-center gap-3 mb-4">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
        <div className="border border-(--color-rule) bg-(--color-paper) p-6 sm:p-8">
          <h1 className="font-serif text-2xl font-bold tracking-tight mb-1">{t("appName")}</h1>
          <p className="text-sm text-(--color-ink-soft) mb-6">{t("setupTitle")}</p>

          <ol className="space-y-4 text-sm">
            <li>
              <span className="font-mono text-(--color-brass-dark)">1.</span> {t("setupStep1")}{" "}
              <span className="font-medium" dir="ltr">supabase.com</span>.
            </li>
            <li>
              <span className="font-mono text-(--color-brass-dark)">2.</span> {t("setupStep2Pre")}{" "}
              <code className="bg-(--color-paper-bar) px-1.5 py-0.5" dir="ltr">supabase/schema.sql</code>{" "}
              {t("setupStep2Post")}
            </li>
            <li>
              <span className="font-mono text-(--color-brass-dark)">3.</span> {t("setupStep3")}
            </li>
            <li>
              <span className="font-mono text-(--color-brass-dark)">4.</span> {t("setupStep4Pre")}{" "}
              <code className="bg-(--color-paper-bar) px-1.5 py-0.5" dir="ltr">.env.example</code>{" "}
              {t("setupStep4Mid")}{" "}
              <code className="bg-(--color-paper-bar) px-1.5 py-0.5" dir="ltr">.env</code>{" "}
              {t("setupStep4Post")}
            </li>
            <li>
              <span className="font-mono text-(--color-brass-dark)">5.</span> {t("setupStep5Pre")}{" "}
              <code className="bg-(--color-paper-bar) px-1.5 py-0.5" dir="ltr">npm run dev</code>.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
