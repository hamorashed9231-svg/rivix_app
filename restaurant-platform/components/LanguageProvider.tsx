"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { Language, translations } from "@/lib/translations"

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  toggleLanguage: () => void
  t: (key: keyof typeof translations.ar) => string
  dir: "rtl" | "ltr"
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("ar")

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rivix_lang") as Language
      if (saved === "ar" || saved === "en") {
        setLangState(saved)
      }
    } catch (e) {}
  }, [])

  useEffect(() => {
    try {
      const dir = lang === "ar" ? "rtl" : "ltr"
      document.documentElement.dir = dir
      document.documentElement.lang = lang
      localStorage.setItem("rivix_lang", lang)
    } catch (e) {}
  }, [lang])

  const setLang = (newLang: Language) => {
    setLangState(newLang)
  }

  const toggleLanguage = () => {
    setLangState((prev) => (prev === "ar" ? "en" : "ar"))
  }

  const t = (key: keyof typeof translations.ar): string => {
    const dict = translations[lang] || translations.ar
    return (dict as any)[key] || translations.ar[key] || String(key)
  }

  const dir = lang === "ar" ? "rtl" : "ltr"

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        toggleLanguage,
        t,
        dir,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
