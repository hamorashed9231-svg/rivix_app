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

  // Check Call Center Staff / Manager membership
  let isCallCenterManager = false
  let isCallCenterStaff = false

  if (!isAdmin && !isOwner) {
    const staffRecord = await prisma.restaurantStaff.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        restaurant: true,
      },
    })

    if (staffRecord) {
      if (staffRecord.staffRole === "manager") {
        isCallCenterManager = true
      } else {
        isCallCenterStaff = true
      }
    } else {
      redirect("/?error=unauthorized")
    }
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

  // 1. Super Admin Navigation
  const adminNav = [
    { name: "لوحة الأدمن الرئيسية", href: "/dashboard/admin", iconName: "ShieldCheck" },
    { name: "طلبات أصحاب المطاعم", href: "/dashboard/admin/owners", iconName: "UserCheck", badge: pendingOwnersCount },
    { name: "إدارة وتراخيص المطاعم", href: "/dashboard/admin/restaurants", iconName: "Store" },
    { name: "إدارة الكوبونات والخصومات", href: "/dashboard/admin/coupons", iconName: "Tag" },
    { name: "تقارير المبيعات والتحليلات", href: "/dashboard/admin/analytics", iconName: "TrendingUp" },
    { name: "تتبع طلبات المنصة", href: "/dashboard/orders", iconName: "ShoppingBag" },
  ]

  // 2. Restaurant Owner Navigation
  const ownerNav = [
    { name: "لوحة تحكم المطعم", href: "/dashboard/restaurant", iconName: "LayoutDashboard" },
    { name: "التحكم في واجهة العميل والعروض", href: "/dashboard/restaurant/customization", iconName: "Sparkles" },
    { name: "طاقم العمل والكول سنتر", href: "/dashboard/restaurant/staff", iconName: "Users" },
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

  // 3. Call Center Manager Navigation
  const callCenterManagerNav = [
    { name: "شاشة استقبال وتوجيه الطلبات", href: "/dashboard/orders", iconName: "ShoppingBag" },
    { name: "التحكم في واجهة العميل والعروض", href: "/dashboard/restaurant/customization", iconName: "Sparkles" },
    { name: "إدارة الكوبونات والخصومات", href: "/dashboard/admin/coupons", iconName: "Tag" },
    { name: "إدارة المنيو والأصناف", href: "/dashboard/restaurant/menu", iconName: "UtensilsCrossed" },
    { name: "رسائل وشكاوى العملاء", href: "/dashboard/restaurant/messages", iconName: "MessageSquare" },
    { name: "خريطة مواقع وتحليلات العملاء", href: "/dashboard/restaurant/customers-map", iconName: "MapPin" },
    { name: "متابعة طاقم الكول سنتر", href: "/dashboard/restaurant/staff", iconName: "Users" },
  ]

  // 4. Call Center Staff Navigation
  const callCenterStaffNav = [
    { name: "شاشة استقبال وتوجيه الطلبات", href: "/dashboard/orders", iconName: "ShoppingBag" },
    { name: "رسائل واستفسارات العملاء", href: "/dashboard/restaurant/messages", iconName: "MessageSquare" },
  ]

  let navItems = ownerNav
  let roleTitle = "مالك المطعم"

  if (isAdmin) {
    navItems = adminNav
    roleTitle = "مدير المنصة"
  } else if (isCallCenterManager) {
    navItems = callCenterManagerNav
    roleTitle = "مدير الكول سنتر"
  } else if (isCallCenterStaff) {
    navItems = callCenterStaffNav
    roleTitle = "موظف كول سنتر"
  }

  return (
    <DashboardSidebar
      navItems={navItems}
      user={{ name: user.name || "مستخدم", role: user.role }}
      isAdmin={isAdmin}
      roleTitle={roleTitle}
    >
      {children}
    </DashboardSidebar>
  )
}
