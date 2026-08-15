import { useTheme } from "../lib/theme/ThemeContext";
import { useLanguage } from "../lib/i18n/LanguageContext";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <div className="flex items-center border border-(--color-rule)">
      <button
        onClick={() => setTheme("light")}
        aria-pressed={theme === "light"}
        className={`px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest transition-colors ${
          theme === "light"
            ? "bg-(--color-ink) text-(--color-paper)"
            : "text-(--color-ink-soft) hover:text-(--color-ink)"
        }`}
      >
        {t("themeLight")}
      </button>
      <button
        onClick={() => setTheme("dark")}
        aria-pressed={theme === "dark"}
        className={`px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest transition-colors ${
          theme === "dark"
            ? "bg-(--color-ink) text-(--color-paper)"
            : "text-(--color-ink-soft) hover:text-(--color-ink)"
        }`}
      >
        {t("themeDark")}
      </button>
    </div>
  );
}
