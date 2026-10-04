import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CustomizationManagerClient } from "./CustomizationManagerClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function CustomerInterfaceCustomizationPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login?callbackUrl=/dashboard/restaurant/customization")
  }

  // 1. Determine restaurant for this user (Owner or Staff/Manager)
  let restaurant = null

  if (user.role === "admin") {
    restaurant = await prisma.restaurant.findFirst({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
    })
  } else if (user.role === "restaurant_owner") {
    restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: user.id },
    })
  } else {
    // Check Call Center Staff / Manager
    const staff = await prisma.restaurantStaff.findFirst({
      where: { userId: user.id, isActive: true },
      include: { restaurant: true },
    })
    if (staff) {
      restaurant = staff.restaurant
    }
  }

  if (!restaurant) {
    return (
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center text-slate-300">
        لم يتم العثور على مطعم مرتبط بحسابك حالياً.
      </div>
    )
  }

  const access = await getRestaurantAccess(user.id, restaurant.id)
  if (access !== "owner" && access !== "manager" && user.role !== "admin") {
    return (
      <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-8 text-center text-rose-400 font-bold">
        عذراً، التحكم في واجهة العميل متاح لمالك المطعم ومدير الكول سنتر فقط.
      </div>
    )
  }

  // 2. Fetch all menu categories and items for this restaurant
  const categories = await prisma.menuCategory.findMany({
    where: { restaurantId: restaurant.id },
    include: {
      items: {
        orderBy: { name: "asc" },
      },
    },
    orderBy: { order: "asc" },
  })

  return (
    <div className="space-y-6">
      <CustomizationManagerClient
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        initialBanner={{
          bannerTitle: restaurant.bannerTitle || "",
          bannerSubtitle: restaurant.bannerSubtitle || "",
          bannerBadge: restaurant.bannerBadge || "",
          bannerActive: restaurant.bannerActive ?? true,
        }}
        categories={categories}
      />
    </div>
  )
}
