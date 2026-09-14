import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { GitFork, ArrowRight, Store } from "lucide-react"
import { BranchesClient } from "./BranchesClient"

export default async function BranchesPage() {
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

  // 2. Access check: Owner or Manager ONLY (staff members are restricted)
  const access = await getRestaurantAccess(user.id, restaurant.id)
  if (access !== "owner" && access !== "manager" && user.role !== "admin") {
    redirect("/dashboard/restaurant")
  }

  // 3. Fetch initial branches for the restaurant
  const branches = await prisma.branch.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { id: "asc" },
    include: {
      _count: {
        select: { orders: true, menuCategories: true },
      },
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <Link
            href="/dashboard/restaurant"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors mb-1"
          >
            <ArrowRight className="w-3.5 h-3.5" /> العودة للوحة المطعم
          </Link>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <GitFork className="w-6 h-6 text-cyan-400" /> إدارة الفروع والمواقع الجغرافية
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            مطعم: <span className="font-bold text-white">{restaurant.name}</span>
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold font-mono flex items-center gap-1.5">
          <Store className="w-4 h-4" />
          <span>BRANCH MANAGEMENT</span>
        </span>
      </div>

      {/* Client Component */}
      <BranchesClient
        restaurantId={restaurant.id}
        initialBranches={branches}
      />
    </div>
  )
}
