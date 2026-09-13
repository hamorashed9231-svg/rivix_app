import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  GitFork, 
  ShoppingBag, 
  ShieldCheck, 
  TrendingUp,
  Tag,
  Store,
  UserCheck,
  Users,
  CreditCard,
  CheckSquare
} from "lucide-react"
import { SignOutButton } from "@/components/SignOutButton"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login?callbackUrl=/dashboard/admin")
  }

  const isAdmin = user.role === "admin"
  const isOwner = user.role === "restaurant_owner"

  if (!isAdmin && !isOwner) {
    redirect("/?error=unauthorized")
  }

  let pendingOwnersCount = 0
  if (isAdmin) {
    pendingOwnersCount = await prisma.user.count({
      where: {
        role: "restaurant_owner",
        accountStatus: "pending",
      },
    })
  }

  const adminNav = [
    { name: "لوحة الأدمن الرئيسية", href: "/dashboard/admin", icon: ShieldCheck },
    { name: "طلبات أصحاب المطاعم", href: "/dashboard/admin/owners", icon: UserCheck, badge: pendingOwnersCount },
    { name: "إدارة وتراخيص المطاعم", href: "/dashboard/admin/restaurants", icon: Store },
    { name: "إدارة الكوبونات والخصومات", href: "/dashboard/admin/coupons", icon: Tag },
    { name: "تقارير المبيعات والتحليلات", href: "/dashboard/admin/analytics", icon: TrendingUp },
    { name: "تتبع طلبات المنصة", href: "/dashboard/orders", icon: ShoppingBag },
  ]

  const ownerNav = [
    { name: "لوحة تحكم المطعم", href: "/dashboard/restaurant", icon: LayoutDashboard },
    { name: "إدارة طاقم العمل", href: "/dashboard/restaurant/staff", icon: Users },
    { name: "أرقام الدفع اليدوي", href: "/dashboard/restaurant/payment-numbers", icon: CreditCard },
    { name: "مراجعة المدفوعات", href: "/dashboard/restaurant/payments", icon: CheckSquare },
    { name: "إدارة الكوبونات والخصومات", href: "/dashboard/admin/coupons", icon: Tag },
    { name: "تقارير المبيعات والتحليلات", href: "/dashboard/restaurant/analytics", icon: TrendingUp },
    { name: "إدارة المنيو والأصناف", href: "/dashboard/restaurant/menu", icon: UtensilsCrossed },
    { name: "إدارة الفروع", href: "/dashboard/restaurant/branches", icon: GitFork },
    { name: "شاشة استقبال وتوجيه الطلبات", href: "/dashboard/orders", icon: ShoppingBag },
  ]

  const navItems = isAdmin ? adminNav : ownerNav

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#0B192C] border-b md:border-b-0 md:border-l border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-cyan-400/40 shadow-lg shadow-cyan-500/20 shrink-0">
              <Image
                src="/logo.jpg"
                alt="RIVIX Logo"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                RIVIX
              </h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">
                Restaurant Operations
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 truncate">
              <div className="w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-medium">
                  {isAdmin ? "مدير المنصة" : "صاحب مطعم"}
                </span>
              </div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Top Header */}
        <header className="h-16 bg-[#0B192C]/80 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Store className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              {isAdmin ? "نظام إدارة المنصة الإدارية" : "لوحة تشغيل المطعم والفروع"}
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              النظام متصل مباشر
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          {children}
        </div>
      </main>
    </div>
  )
}
