import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
import { getDefaultBranch } from "@/lib/restaurant"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { MenuManager } from "./MenuManager"
import { Utensils, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function RestaurantMenuPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // 1. Find restaurant owned by user or where user is staff/manager
  let restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: user.id },
  })

  if (!restaurant) {
    const staffRecord = await prisma.restaurantStaff.findFirst({
      where: { userId: user.id, isActive: true },
      select: { restaurantId: true },
    })

    if (staffRecord) {
      restaurant = await prisma.restaurant.findUnique({
        where: { id: staffRecord.restaurantId },
      })
    }
  }

  if (!restaurant) {
    redirect("/dashboard/restaurant")
  }

  // 2. Validate Permission (Owner & Manager ONLY, not Staff)
  const access = await getRestaurantAccess(user.id, restaurant.id)

  if (access !== "owner" && access !== "manager" && user.role !== "admin") {
    // Restrict staff or unauthorized users
    redirect("/dashboard/restaurant")
  }

  // 3. Get Default Branch for restaurant
  const defaultBranch = await getDefaultBranch(restaurant.id)

  if (!defaultBranch) {
    redirect("/dashboard/restaurant")
  }

  // 4. Fetch menu categories and items for default branch
  const categories = await prisma.menuCategory.findMany({
    where: { branchId: defaultBranch.id },
    include: {
      items: true,
    },
    orderBy: { order: "asc" },
  })

  return (
    <div className="space-y-6 text-brand-white">
      {/* Navigation Breadcrumb Header */}
      <div className="flex items-center justify-between border-b border-brand-gray-800 pb-4">
        <div>
          <Link
            href="/dashboard/restaurant"
            className="inline-flex items-center gap-1.5 text-xs text-brand-gray-400 hover:text-brand-sky transition-colors mb-1"
          >
            <ArrowRight className="w-3.5 h-3.5" /> العودة للوحة المطعم
          </Link>
          <h1 className="text-2xl font-black text-brand-white flex items-center gap-2">
            <Utensils className="w-6 h-6 text-brand-sky" /> المنيو الإلكتروني وقائمة الأطعمة
          </h1>
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-brand-sky/10 border border-brand-sky/20 text-brand-sky text-xs font-bold font-mono">
          MENU MANAGEMENT
        </span>
      </div>

      {/* Menu Manager Interactive Client */}
      <MenuManager
        restaurantId={restaurant.id}
        branchId={defaultBranch.id}
        restaurantName={restaurant.name}
        initialCategories={categories}
      />
    </div>
  )
}
