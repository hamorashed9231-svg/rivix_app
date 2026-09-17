"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Store,
} from "lucide-react"
import { SignOutButton } from "@/components/SignOutButton"

interface NavItem {
  name: string
  href: string
  icon: any
  badge?: number
}

interface DashboardSidebarProps {
  navItems: NavItem[]
  user: {
    name: string
    role: string
  }
  isAdmin: boolean
  children: React.ReactNode
}

export function DashboardSidebar({
  navItems,
  user,
  isAdmin,
  children,
}: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  // Load collapsed preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dashboard_sidebar_collapsed")
    if (saved !== null) {
      setIsCollapsed(saved === "true")
    }
  }, [])

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem("dashboard_sidebar_collapsed", String(next))
      return next
    })
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row relative">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed md:sticky top-0 z-50 h-screen bg-[#0B192C] border-b md:border-b-0 md:border-l border-slate-800 flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "md:w-20" : "md:w-64"
        } ${
          isMobileOpen
            ? "translate-x-0 w-72"
            : "translate-x-full md:translate-x-0 w-72 md:w-auto"
        } right-0`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-4 md:p-5 border-b border-slate-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-cyan-400/40 shadow-lg shadow-cyan-500/20 shrink-0">
                <Image
                  src="/logo.jpg"
                  alt="RIVIX Logo"
                  fill
                  className="object-cover"
                />
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <div className="truncate">
                  <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent truncate">
                    RIVIX
                  </h1>
                  <p className="text-[10px] text-slate-400 font-mono tracking-tight uppercase truncate">
                    Restaurant Operations
                  </p>
                </div>
              )}
            </div>

            {/* Desktop Collapse Toggle Button */}
            <button
              onClick={toggleCollapse}
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-400 hover:text-white transition-colors shrink-0"
              title={isCollapsed ? "توسيع القائمة" : "طوي القائمة"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-thin scrollbar-thumb-slate-700">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  title={isCollapsed ? item.name : undefined}
                  className={`flex items-center gap-3 px-3.5 py-3 text-sm font-medium rounded-xl transition-all group relative ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/10 font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                  } ${isCollapsed && !isMobileOpen ? "justify-center" : "justify-between"}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? "text-cyan-400" : "text-cyan-400/80 group-hover:text-cyan-300"
                      }`}
                    />
                    {(!isCollapsed || isMobileOpen) && (
                      <span className="truncate">{item.name}</span>
                    )}
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 ${
                        isCollapsed && !isMobileOpen ? "absolute -top-1 -right-1 shadow-lg" : ""
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/40">
          <div className={`flex items-center gap-3 ${isCollapsed && !isMobileOpen ? "justify-center" : "justify-between"}`}>
            <div className="flex items-center gap-3 truncate">
              <div className="w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <div className="truncate">
                  <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                  <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-medium">
                    {isAdmin ? "مدير المنصة" : "صاحب مطعم"}
                  </span>
                </div>
              )}
            </div>
            {(!isCollapsed || isMobileOpen) && <SignOutButton />}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Top Header */}
        <header className="h-16 bg-[#0B192C]/80 backdrop-blur border-b border-slate-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden flex items-center justify-center p-2 rounded-lg bg-slate-800/90 text-cyan-400 hover:text-white border border-slate-700"
              aria-label="فتح القائمة"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Desktop Toggle Button in Header (Optional extra toggle) */}
            <button
              onClick={toggleCollapse}
              className="hidden md:flex items-center justify-center p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-cyan-400 hover:text-white transition-colors border border-slate-800"
              title={isCollapsed ? "توسيع القائمة" : "طوي القائمة"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>

            <Store className="w-5 h-5 text-cyan-400 hidden sm:block" />
            <h2 className="text-sm font-semibold text-slate-200 truncate">
              {isAdmin ? "نظام إدارة المنصة الإدارية" : "لوحة تشغيل المطعم والفروع"}
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="hidden sm:inline">النظام متصل مباشر</span>
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8 overflow-y-auto flex-1">{children}</div>
      </main>
    </div>
  )
}
