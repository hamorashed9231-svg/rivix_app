"use client"

import React from "react"
import { Globe } from "lucide-react"
import { useLanguage } from "./LanguageProvider"

export function LanguageToggle() {
  const { lang, toggleLanguage } = useLanguage()

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-cyan-400 hover:text-white hover:bg-slate-800 text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/10"
      title={lang === "ar" ? "Switch to English" : "التحويل للغة العربية"}
    >
      <Globe className="w-3.5 h-3.5 text-cyan-400" />
      <span>{lang === "ar" ? "EN" : "العربية"}</span>
    </button>
  )
}
