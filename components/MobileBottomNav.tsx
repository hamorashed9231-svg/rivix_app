"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Compass, ShoppingBag, Clock, User } from "lucide-react"
import { useCart } from "./CartProvider"

export function MobileBottomNav() {
  const pathname = usePathname()
  const { totalCount } = useCart()

  // Hide bottom nav on dashboard routes
  if (pathname.startsWith("/dashboard")) {
    return null
  }

  const navItems = [
    { label: "الرئيسية", href: "/", icon: Home },
    { label: "السلة", href: "/cart", icon: ShoppingBag, badge: totalCount },
    { label: "طلباتي", href: "/my-orders", icon: Clock },
    { label: "حسابي", href: "/login", icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0B192C]/95 backdrop-blur-xl border-t border-slate-800/80 px-4 py-2 flex items-center justify-around max-w-md mx-auto shadow-2xl shadow-cyan-500/10">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`relative flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              isActive
                ? "text-cyan-400 font-bold scale-105"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? "drop-shadow-[0_0_8px_rgba(0,210,255,0.8)]" : ""}`} />
              {!!item.badge && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-md">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
