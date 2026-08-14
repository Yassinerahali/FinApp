import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { LANGUAGES, translate, categoryLabel } from "./translations";

const LanguageContext = createContext(null);
const STORAGE_KEY = "ledger:language:v1";

function getInitialLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGES.some((l) => l.code === stored)) return stored;
  } catch {
    // ignore
  }
  return "en";
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLanguage);

  const meta = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = meta.dir;
  }, [lang, meta.dir]);

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);
  const catLabel = useCallback((categoryId) => categoryLabel(lang, categoryId), [lang]);

  const value = useMemo(
    () => ({ lang, dir: meta.dir, locale: meta.locale, setLang, t, catLabel }),
    [lang, meta.dir, meta.locale, setLang, t, catLabel]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
