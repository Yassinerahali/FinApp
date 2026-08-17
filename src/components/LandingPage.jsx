import { useLanguage } from "../lib/i18n/LanguageContext";
import { formatAmount } from "../lib/format";
import { useInView } from "../hooks/useInView";
import { useCountUp } from "../hooks/useCountUp";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";

const FEATURE_KEYS = [
  { title: "landingFeature1Title", body: "landingFeature1Body" },
  { title: "landingFeature2Title", body: "landingFeature2Body" },
  { title: "landingFeature3Title", body: "landingFeature3Body" },
  { title: "landingFeature4Title", body: "landingFeature4Body" },
];

const PREVIEW_ROWS = [
  { category: "salary", amount: 8000, positive: true },
  { category: "housing", amount: 3200 },
  { category: "food", amount: 612.5 },
  { category: "entertainment", amount: 89 },
];

const PREVIEW_TOTAL = PREVIEW_ROWS.reduce((sum, r) => sum + (r.positive ? r.amount : -r.amount), 0);

export default function LandingPage({ onGetStarted, onSignIn }) {
  const { t, catLabel } = useLanguage();
  const animatedTotal = useCountUp(PREVIEW_TOTAL, 900);
  const [featuresRef, featuresInView] = useInView();
  const [privacyRef, privacyInView] = useInView();

  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-(--color-ink) px-5 sm:px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight">
              {t("appName")}
            </h1>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <LanguageSwitcher />
            <ThemeSwitcher />
            <button
              onClick={onSignIn}
              className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft) hover:text-(--color-ink) underline decoration-(--color-rule) underline-offset-4"
            >
              {t("landingCtaSecondary")}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-14 pb-16 sm:pt-20 sm:pb-20">
          <div className="max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-widest text-(--color-brass-dark) animate-fade-in-up">
              {t("tagline")}
            </span>
            <h2
              className="font-serif text-3xl sm:text-5xl font-bold tracking-tight leading-[1.1] mt-3 animate-fade-in-up"
              style={{ animationDelay: "60ms" }}
            >
              {t("landingHeroTitle")}
            </h2>
            <p
              className="text-(--color-ink-soft) text-base sm:text-lg mt-5 leading-relaxed max-w-xl animate-fade-in-up"
              style={{ animationDelay: "120ms" }}
            >
              {t("landingHeroSubtitle")}
            </p>
            <div
              className="flex flex-wrap items-center gap-4 mt-8 animate-fade-in-up"
              style={{ animationDelay: "180ms" }}
            >
              <button
                onClick={onGetStarted}
                className="bg-(--color-ink) text-(--color-paper) px-6 py-3.5 font-mono text-sm uppercase tracking-widest hover:bg-(--color-brass-dark) hover:-translate-y-0.5 hover:shadow-lg transition-all"
              >
                {t("landingCtaPrimary")}
              </button>
              <button
                onClick={onSignIn}
                className="border border-(--color-rule) px-6 py-3.5 font-mono text-sm uppercase tracking-widest text-(--color-ink-soft) hover:border-(--color-ink) hover:text-(--color-ink) hover:-translate-y-0.5 transition-all"
              >
                {t("landingCtaSecondary")}
              </button>
            </div>
          </div>

          {/* Ledger preview mock */}
          <div
            className="mt-14 border border-(--color-rule) bg-(--color-paper) max-w-3xl animate-fade-in-up hover:shadow-lg transition-shadow"
            style={{ animationDelay: "260ms" }}
          >
            <div
              className="flex items-baseline justify-between px-5 sm:px-6 py-4"
              style={{ borderBottom: "3px double var(--color-ink)" }}
            >
              <span className="font-serif font-semibold">{t("balance")}</span>
              <span className="font-mono tabular text-xl font-semibold">
                {formatAmount(animatedTotal)}
              </span>
            </div>
            <ul className="divide-y divide-(--color-rule)">
              {PREVIEW_ROWS.map((r, index) => (
                <PreviewRow
                  key={r.category}
                  index={index}
                  label={catLabel(r.category)}
                  amount={r.amount}
                  positive={r.positive}
                />
              ))}
            </ul>
          </div>
        </section>

        {/* Features */}
        <section
          ref={featuresRef}
          className="border-t border-(--color-rule) px-5 sm:px-8 py-14 sm:py-16"
        >
          <div className="max-w-5xl mx-auto">
            <span className="font-mono text-xs uppercase tracking-widest text-(--color-ink-soft)">
              {t("landingFeaturesEyebrow")}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
              {FEATURE_KEYS.map((f, index) => (
                <div
                  key={f.title}
                  className={`border border-(--color-rule) bg-(--color-paper) p-6 hover:-translate-y-1 hover:shadow-md hover:border-(--color-brass) transition-all ${
                    featuresInView ? "animate-fade-in-up" : "opacity-0"
                  }`}
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <h3 className="font-serif text-lg font-semibold tracking-tight mb-2">
                    {t(f.title)}
                  </h3>
                  <p className="text-sm text-(--color-ink-soft) leading-relaxed">{t(f.body)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section
          ref={privacyRef}
          className="border-t border-(--color-rule) px-5 sm:px-8 py-14 sm:py-16"
        >
          <div className={`max-w-5xl mx-auto ${privacyInView ? "animate-fade-in-up" : "opacity-0"}`}>
            <div className="max-w-2xl">
              <span className="font-mono text-xs uppercase tracking-widest text-(--color-brass-dark)">
                {t("landingPrivacyEyebrow")}
              </span>
              <h3 className="font-serif text-2xl font-semibold tracking-tight mt-2 mb-3">
                {t("landingPrivacyTitle")}
              </h3>
              <p className="text-(--color-ink-soft) leading-relaxed">{t("landingPrivacyBody")}</p>
            </div>
            <button
              onClick={onGetStarted}
              className="mt-8 bg-(--color-ink) text-(--color-paper) px-6 py-3.5 font-mono text-sm uppercase tracking-widest hover:bg-(--color-brass-dark) hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              {t("landingCtaPrimary")}
            </button>
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto px-5 sm:px-8 py-8 flex flex-wrap items-center justify-between gap-2 text-xs text-(--color-ink-soft)">
        <span>{t("appName")} — {t("tagline")}</span>
        <span>{t("madeBy", { name: "Choumchoum" })}</span>
      </footer>
    </div>
  );
}

function PreviewRow({ index, label, amount, positive }) {
  return (
    <li
      className="flex items-center justify-between px-5 sm:px-6 py-3 text-sm stagger-row hover:bg-(--color-paper-bar)/50"
      style={{ "--i": index, animationDelay: `${340 + index * 60}ms` }}
    >
      <span>{label}</span>
      <span
        className={`font-mono tabular ${positive ? "text-(--color-credit)" : "text-(--color-debit)"}`}
      >
        {positive ? "+" : "−"}{formatAmount(amount)}
      </span>
    </li>
  );
}
