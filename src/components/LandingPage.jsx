import { useLanguage } from "../lib/i18n/LanguageContext";
import { formatAmount } from "../lib/format";
import LanguageSwitcher from "./LanguageSwitcher";

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

export default function LandingPage({ onGetStarted, onSignIn }) {
  const { t, catLabel } = useLanguage();

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
            <span className="font-mono text-xs uppercase tracking-widest text-(--color-brass-dark)">
              {t("tagline")}
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight leading-[1.1] mt-3">
              {t("landingHeroTitle")}
            </h2>
            <p className="text-(--color-ink-soft) text-base sm:text-lg mt-5 leading-relaxed max-w-xl">
              {t("landingHeroSubtitle")}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-8">
              <button
                onClick={onGetStarted}
                className="bg-(--color-ink) text-(--color-paper) px-6 py-3.5 font-mono text-sm uppercase tracking-widest hover:bg-(--color-brass-dark) transition-colors"
              >
                {t("landingCtaPrimary")}
              </button>
              <button
                onClick={onSignIn}
                className="border border-(--color-rule) px-6 py-3.5 font-mono text-sm uppercase tracking-widest text-(--color-ink-soft) hover:border-(--color-ink) hover:text-(--color-ink) transition-colors"
              >
                {t("landingCtaSecondary")}
              </button>
            </div>
          </div>

          {/* Ledger preview mock */}
          <div className="mt-14 border border-(--color-rule) bg-(--color-paper) max-w-3xl">
            <div
              className="flex items-baseline justify-between px-5 sm:px-6 py-4"
              style={{ borderBottom: "3px double var(--color-ink)" }}
            >
              <span className="font-serif font-semibold">{t("balance")}</span>
              <span className="font-mono tabular text-xl font-semibold">
                {formatAmount(
                  PREVIEW_ROWS.reduce((sum, r) => sum + (r.positive ? r.amount : -r.amount), 0)
                )}
              </span>
            </div>
            <ul className="divide-y divide-(--color-rule)">
              {PREVIEW_ROWS.map((r) => (
                <PreviewRow
                  key={r.category}
                  label={catLabel(r.category)}
                  amount={r.amount}
                  positive={r.positive}
                />
              ))}
            </ul>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-(--color-rule) px-5 sm:px-8 py-14 sm:py-16">
          <div className="max-w-5xl mx-auto">
            <span className="font-mono text-xs uppercase tracking-widest text-(--color-ink-soft)">
              {t("landingFeaturesEyebrow")}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
              {FEATURE_KEYS.map((f) => (
                <div key={f.title} className="border border-(--color-rule) bg-(--color-paper) p-6">
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
        <section className="border-t border-(--color-rule) px-5 sm:px-8 py-14 sm:py-16">
          <div className="max-w-5xl mx-auto">
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
              className="mt-8 bg-(--color-ink) text-(--color-paper) px-6 py-3.5 font-mono text-sm uppercase tracking-widest hover:bg-(--color-brass-dark) transition-colors"
            >
              {t("landingCtaPrimary")}
            </button>
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto px-5 sm:px-8 py-8 text-xs text-(--color-ink-soft)">
        {t("appName")} — {t("tagline")}
      </footer>
    </div>
  );
}

function PreviewRow({ label, amount, positive }) {
  return (
    <li className="flex items-center justify-between px-5 sm:px-6 py-3 text-sm">
      <span>{label}</span>
      <span
        className={`font-mono tabular ${positive ? "text-(--color-credit)" : "text-(--color-debit)"}`}
      >
        {positive ? "+" : "−"}{formatAmount(amount)}
      </span>
    </li>
  );
}
