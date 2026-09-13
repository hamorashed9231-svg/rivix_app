import { prisma } from "@/lib/prisma"
import { RestaurantApprovalTable } from "./RestaurantApprovalTable"
import { ShieldCheck, Store, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function AdminRestaurantsPage() {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  return (
    <div className="space-y-6 text-brand-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-brand-gray-800 pb-4">
        <div>
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center gap-1.5 text-xs text-brand-gray-400 hover:text-brand-sky transition-colors mb-1"
          >
            <ArrowRight className="w-3.5 h-3.5" /> العودة للوحة الإدارة
          </Link>
          <h1 className="text-2xl font-black text-brand-white flex items-center gap-2">
            <Store className="w-6 h-6 text-brand-sky" /> إدارة وتراخيص مطاعم المنصة
          </h1>
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-brand-sky/10 border border-brand-sky/20 text-brand-sky text-xs font-bold font-mono flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          <span>RESTAURANTS MANAGEMENT</span>
        </span>
      </div>

      {/* Main Table */}
      <RestaurantApprovalTable initialRestaurants={restaurants} />
    </div>
  )
}
