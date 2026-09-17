import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
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
  CheckSquare,
  MapPin
} from "lucide-react"
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
    { name: "خريطة مواقع وتحليلات العملاء", href: "/dashboard/restaurant/customers-map", icon: MapPin },
    { name: "شاشة استقبال وتوجيه الطلبات", href: "/dashboard/orders", icon: ShoppingBag },
  ]

  const navItems: { name: string; href: string; icon: any; badge?: number }[] = isAdmin ? adminNav : ownerNav

  return (
    <DashboardSidebar navItems={navItems} user={user} isAdmin={isAdmin}>
      {children}
    </DashboardSidebar>
  )
}
}
