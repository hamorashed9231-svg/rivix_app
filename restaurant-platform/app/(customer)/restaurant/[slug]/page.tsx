import { prisma } from "@/lib/prisma"
import { getDefaultBranch } from "@/lib/restaurant"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Star, Clock, MapPin, Utensils } from "lucide-react"
import { RestaurantThemeProvider } from "@/components/RestaurantThemeProvider"
import { MobileMenuBrowser } from "../../restaurants/[id]/MobileMenuBrowser"
import { RestaurantReviewsSection } from "@/components/RestaurantReviewsSection"

export const dynamic = "force-dynamic"
export const revalidate = 0


export default async function CustomerRestaurantBySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
  })

  if (!restaurant || restaurant.status !== "active") {
    notFound()
  }

  // 1. Fetch default branch for this restaurant
  const defaultBranch = await getDefaultBranch(restaurant.id)

  // 2. Fetch menu categories and items for default branch (filtering isAvailable: true)
  // 2. Fetch menu categories for restaurant and items available in default branch
  let menuCategories: any[] = []
  menuCategories = await prisma.menuCategory.findMany({
    where: {
      OR: [
        { restaurantId: restaurant.id },
        ...(defaultBranch ? [{ branchId: defaultBranch.id }] : []),
      ],
    },
    include: {
      items: {
        where: {
          isAvailable: true,
        },
        include: {
          branchItems: defaultBranch ? { where: { branchId: defaultBranch.id } } : false,
        },
      },
    },
    orderBy: {
      order: "asc",
    },
  })

  // Check if restaurant has any available items in menu
  const availableCategories = menuCategories.filter(
    (cat) => cat.items && cat.items.length > 0
  )
  const hasMenu = availableCategories.length > 0

  return (
    <RestaurantThemeProvider
      primaryColor={restaurant.primaryColor || "#2196F3"}
      secondaryColor={restaurant.secondaryColor || "#0A1A3C"}
      className="min-h-screen bg-slate-950 text-slate-100 pb-24"
    >
      {/* Dynamic Styled Restaurant Cover / Header Banner */}
      <div className="relative h-56 w-full bg-[var(--restaurant-secondary)] overflow-hidden">
        {restaurant.coverImage ? (
          <Image
            src={restaurant.coverImage}
            alt={restaurant.name}
            fill
            className="object-cover opacity-80"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[var(--restaurant-secondary)] to-[var(--restaurant-primary)] opacity-90"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

        {/* Top Bar with Back Button */}
        <div className="absolute top-4 right-4 left-4 flex justify-between items-center z-10">
          <Link
            href="/"
            className="w-10 h-10 rounded-full bg-slate-950/70 backdrop-blur-md border border-slate-700 flex items-center justify-center text-white shadow-xl hover:bg-slate-900 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--restaurant-primary)] text-white shadow-md">
            صفحة المطعم
          </span>
        </div>
      </div>

      {/* Restaurant Header Info Card */}
      <div className="px-4 -mt-14 relative z-10 space-y-4">
        <div className="flex justify-between items-end">
          <div className="w-24 h-24 rounded-3xl bg-[var(--restaurant-secondary)] border-4 border-[var(--restaurant-primary)] p-1.5 shadow-2xl overflow-hidden relative">
            <Image
              src={restaurant.logo || "/logo.jpg"}
              alt={restaurant.name}
              fill
              className="object-cover rounded-2xl"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl text-amber-300 text-xs font-black">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>4.9 (تقييمات ممتازة)</span>
          </div>
        </div>

        {/* Name & Description Header */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-2 shadow-xl backdrop-blur-md">
          <h1 className="text-2xl font-black text-[var(--restaurant-primary)] tracking-tight">
            {restaurant.name}
          </h1>
          {restaurant.description && (
            <p className="text-xs text-slate-300 leading-relaxed">
              {restaurant.description}
            </p>
          )}

          {/* Info Badges */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-3 border-t border-slate-800/80">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[var(--restaurant-primary)]" /> 20-30 دقيقة
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[var(--restaurant-primary)]" />
              {defaultBranch?.address || "الفرع الرئيسي"}
            </span>
          </div>
        </div>
      </div>

      {/* Menu / Items Section */}
      <div className="px-4 mt-6">
        {hasMenu ? (
          <MobileMenuBrowser
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            branchId={defaultBranch?.id}
            categories={availableCategories}
          />
        ) : (
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-10 text-center space-y-3 shadow-lg">
            <div className="w-12 h-12 rounded-full bg-[var(--restaurant-primary)]/10 text-[var(--restaurant-primary)] mx-auto flex items-center justify-center">
              <Utensils className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">لا يوجد منيو متاح حالياً</h3>
            <p className="text-xs text-slate-400">
              يقوم المطعم بتجهيز الأطباق والمنيو الإلكتروني حالياً. عد قريباً!
            </p>
          </div>
        )}
      </div>

      {/* Customer Reviews Section */}
      <div className="px-4 mt-6">
        <RestaurantReviewsSection restaurantId={restaurant.id} />
      </div>
    </RestaurantThemeProvider>
  )
}
