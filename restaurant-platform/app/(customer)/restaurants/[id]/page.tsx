import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Star, Clock, MapPin, Phone } from "lucide-react"
import { MobileMenuBrowser } from "./MobileMenuBrowser"
import { RestaurantReviewsSection } from "@/components/RestaurantReviewsSection"

import { checkBranchOpenStatus } from "@/lib/opening-hours"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      menuCategories: {
        include: {
          items: {
            include: {
              branchItems: true,
              optionGroups: {
                include: {
                  options: {
                    orderBy: { order: "asc" },
                  },
                },
                orderBy: { order: "asc" },
              },
            },
          },
        },
        orderBy: { order: "asc" },
      },
      branches: {
        include: {
          menuCategories: {
            include: {
              items: true,
            },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  })

  if (!restaurant || restaurant.status !== "active") {
    notFound()
  }

  const defaultBranch = restaurant.branches[0]
  const branchStatus = checkBranchOpenStatus(defaultBranch?.openingHours, defaultBranch?.isActive)

  return (
    <div className="space-y-6 pb-24">
      {/* Mobile Top Header Banner */}
      <div className="relative h-48 w-full bg-slate-900">
        <Image
          src={restaurant.coverImage || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"}
          alt={restaurant.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

        {/* Back Button */}
        <Link
          href="/"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-950/70 backdrop-blur-md border border-slate-700 flex items-center justify-center text-white shadow-xl"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Restaurant Header Details */}
      <div className="px-4 -mt-12 relative z-10 space-y-3">
        <div className="flex justify-between items-end">
          <div className="w-20 h-20 rounded-3xl bg-[#0B192C] border-2 border-cyan-400 p-1.5 shadow-2xl overflow-hidden relative">
            <Image
              src={restaurant.logo || "/logo.jpg"}
              alt={restaurant.name}
              fill
              className="object-cover rounded-2xl"
            />
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border ${
                branchStatus.isOpen
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/30"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${branchStatus.isOpen ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`} />
              {branchStatus.isOpen ? "مفتوح الآن" : "مغلق حالياً"}
            </span>

            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl text-amber-300 text-xs font-black">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> 4.9 (تقييمات مؤكدة)
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-black text-white">{restaurant.name}</h1>
          <p className="text-xs text-slate-400 mt-1">{restaurant.description}</p>
        </div>

        {/* Info Badges */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300 pt-1 border-t border-slate-800/80">
          <span className="flex items-center gap-1 font-bold text-cyan-400">
            <Clock className="w-3.5 h-3.5" /> {branchStatus.formattedHours}
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" /> {defaultBranch?.address || "الفرع الرئيسي"}
          </span>
        </div>
      </div>

      {/* Mobile Interactive Menu Browser */}
      {(restaurant.menuCategories && restaurant.menuCategories.length > 0) || defaultBranch?.menuCategories ? (
        <MobileMenuBrowser
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          categories={restaurant.menuCategories && restaurant.menuCategories.length > 0 ? restaurant.menuCategories : defaultBranch?.menuCategories || []}
        />
      ) : (
        <div className="p-8 text-center text-xs text-slate-500">لا توجد أصناف مضافة حالياً.</div>
      )}

      {/* Customer Reviews Section */}
      <div className="px-4">
        <RestaurantReviewsSection restaurantId={restaurant.id} />
      </div>
    </div>
  )
}
