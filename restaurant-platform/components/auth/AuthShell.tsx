import React from "react"

interface AuthShellProps {
  children: React.ReactNode
  dir?: "ltr" | "rtl"
}

export function AuthShell({ children, dir = "rtl" }: AuthShellProps) {
  return (
    <div
      dir={dir}
      className="relative min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden selection:bg-brand-sky selection:text-slate-950 px-4 py-8"
    >
      {/* Ambient background glow elements */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-brand-sky/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-brand-navy/60 rounded-full blur-[120px] pointer-events-none" />
      {children}
    </div>
  )
}
