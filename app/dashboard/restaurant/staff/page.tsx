import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { StaffManagementClient } from "./StaffManagementClient"
import { Users, Store, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function RestaurantStaffPage() {
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

  // 2. Check permission level: Owner or Manager ONLY
  const access = await getRestaurantAccess(user.id, restaurant.id)

  if (access !== "owner" && access !== "manager" && user.role !== "admin") {
    // Staff level or null -> block access completely and redirect
    redirect("/dashboard/restaurant")
  }

  // 3. Fetch staff members
  const staffMembers = await prisma.restaurantStaff.findMany({
    where: { restaurantId: restaurant.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6 text-brand-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-brand-gray-800 pb-4">
        <div>
          <Link
            href="/dashboard/restaurant"
            className="inline-flex items-center gap-1.5 text-xs text-brand-gray-400 hover:text-brand-sky transition-colors mb-1"
          >
            <ArrowRight className="w-3.5 h-3.5" /> العودة للوحة المطعم
          </Link>
          <h1 className="text-2xl font-black text-brand-white flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-sky" /> إدارة طاقم العمل والموظفين
          </h1>
          <p className="text-xs text-brand-gray-400 mt-1">
            مطعم: <span className="font-bold text-brand-white">{restaurant.name}</span>
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold font-mono flex items-center gap-1.5">
          <Store className="w-4 h-4" />
          <span>STAFF ACCESS CONTROL</span>
        </span>
      </div>

      {/* Staff Management Interactive Client */}
      <StaffManagementClient
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        initialStaff={staffMembers}
      />
    </div>
  )
}
