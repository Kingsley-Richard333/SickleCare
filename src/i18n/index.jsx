import { createContext, useContext, useEffect, useMemo, useState } from "react";
import en from "./en.js";
import fr from "./fr.js";
import es from "./es.js";

// To add a language: create its file (copy en.js), import it here, and add it below. See I18N.md.
export const languages = { en, fr, es };

const KEY = "sicklecare-lang";
const Ctx = createContext(null);

function initial() {
  try { const saved = localStorage.getItem(KEY); if (saved && languages[saved]) return saved; } catch {}
  const guess = (navigator.language || "en").slice(0, 2).toLowerCase();
  return languages[guess] ? guess : "en";
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(initial);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = languages[lang].meta.dir || "ltr";
    try { localStorage.setItem(KEY, lang); } catch {}
  }, [lang]);

  const value = useMemo(() => ({
    lang, setLang, languages,
    reviewed: languages[lang].meta.reviewed,
    // Falls back to English, so a missing translation never shows a blank.
    t: (key, vars) => {
      let s = languages[lang].strings[key] ?? languages.en.strings[key] ?? key;
      if (vars) for (const k in vars) s = s.replaceAll(`{${k}}`, vars[k]);
      return s;
    },
  }), [lang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx);
