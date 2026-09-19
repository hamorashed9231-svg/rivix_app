import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { DashboardSidebar } from "@/components/DashboardSidebar"

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
    { name: "لوحة الأدمن الرئيسية", href: "/dashboard/admin", iconName: "ShieldCheck" },
    { name: "طلبات أصحاب المطاعم", href: "/dashboard/admin/owners", iconName: "UserCheck", badge: pendingOwnersCount },
    { name: "إدارة وتراخيص المطاعم", href: "/dashboard/admin/restaurants", iconName: "Store" },
    { name: "إدارة الكوبونات والخصومات", href: "/dashboard/admin/coupons", iconName: "Tag" },
    { name: "تقارير المبيعات والتحليلات", href: "/dashboard/admin/analytics", iconName: "TrendingUp" },
    { name: "تتبع طلبات المنصة", href: "/dashboard/orders", iconName: "ShoppingBag" },
  ]

  const ownerNav = [
    { name: "لوحة تحكم المطعم", href: "/dashboard/restaurant", iconName: "LayoutDashboard" },
    { name: "إدارة طاقم العمل", href: "/dashboard/restaurant/staff", iconName: "Users" },
    { name: "أرقام الدفع اليدوي", href: "/dashboard/restaurant/payment-numbers", iconName: "CreditCard" },
    { name: "مراجعة المدفوعات", href: "/dashboard/restaurant/payments", iconName: "CheckSquare" },
    { name: "إدارة الكوبونات والخصومات", href: "/dashboard/admin/coupons", iconName: "Tag" },
    { name: "تقارير المبيعات والتحليلات", href: "/dashboard/restaurant/analytics", iconName: "TrendingUp" },
    { name: "إدارة المنيو والأصناف", href: "/dashboard/restaurant/menu", iconName: "UtensilsCrossed" },
    { name: "إدارة الفروع", href: "/dashboard/restaurant/branches", iconName: "GitFork" },
    { name: "خريطة مواقع وتحليلات العملاء", href: "/dashboard/restaurant/customers-map", iconName: "MapPin" },
    { name: "رسائل العملاء والدعم", href: "/dashboard/restaurant/messages", iconName: "MessageSquare" },
    { name: "شاشة استقبال وتوجيه الطلبات", href: "/dashboard/orders", iconName: "ShoppingBag" },
  ]

  const navItems = isAdmin ? adminNav : ownerNav

  return (
    <DashboardSidebar navItems={navItems} user={{ name: user.name, role: user.role }} isAdmin={isAdmin}>
      {children}
    </DashboardSidebar>
  )
}
