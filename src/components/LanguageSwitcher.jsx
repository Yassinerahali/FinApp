import { LANGUAGES } from "../lib/i18n/translations";
import { useLanguage } from "../lib/i18n/LanguageContext";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center border border-(--color-rule)">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          className={`px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest transition-colors ${
            lang === l.code
              ? "bg-(--color-ink) text-(--color-paper)"
              : "text-(--color-ink-soft) hover:text-(--color-ink)"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
