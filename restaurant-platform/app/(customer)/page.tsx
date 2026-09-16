import { prisma } from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"

export const dynamic = "force-dynamic"
export const revalidate = 0
import { 
  Search, 
  Star, 
  Clock, 
  Flame, 
  SlidersHorizontal,
  ChevronLeft,
  Sparkles,
  Zap
} from "lucide-react"
import { MobileLocationPrompt } from "@/components/MobileLocationPrompt"
import { NotificationPrompt } from "@/components/NotificationPrompt"
import { LanguageToggle } from "@/components/LanguageToggle"

export default async function CustomerHomePage() {
  const restaurants = await prisma.restaurant.findMany({
    where: { status: "active" },
    include: {
      branches: { select: { id: true, address: true } }
    }
  })

  return (
    <div className="space-y-5 p-4">
      {/* Top Mobile Header & Location Component */}
      <header className="space-y-3 pt-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-cyan-400/40 shadow-lg shadow-cyan-500/20 shrink-0">
              <Image src="/logo.jpg" alt="RIVIX" fill className="object-cover" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                RIVIX
              </h1>
              <p className="text-[9px] text-slate-400 uppercase font-mono">Restaurant Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Link
              href="/customer/login"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>

        {/* Real-time GPS Location Permission Component */}
        <MobileLocationPrompt />
      </header>

      {/* Push Notifications Permission Component */}
      <NotificationPrompt />

      {/* Hero Banner Promo */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0B192C] via-slate-900 to-[#0091FF]/30 p-6 border border-cyan-500/30 shadow-2xl shadow-cyan-950/40 group">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent opacity-60"></div>
        <div className="relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-cyan-400 text-slate-950 uppercase tracking-widest">
            <Sparkles className="w-3 h-3 fill-slate-950" /> خصم حصري 30%
          </span>
          <h2 className="text-xl font-black text-white leading-tight">
            أشهر الوجبات والمشويات بأقصى سرعة توصيل 🚀
          </h2>
          <p className="text-xs text-slate-300">استمتع بطعم ريفيكس المميز مع عروض اليوم الخاصة!</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="ابحث عن مطعم أو وجبة تفضلها..."
          className="w-full bg-[#0B192C] border border-slate-800 rounded-2xl px-11 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/80 shadow-lg transition-all"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-4 top-4" />
        <button className="absolute left-3 top-2.5 p-1.5 rounded-xl bg-slate-800 text-cyan-400 hover:bg-slate-700">
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Category Pills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" /> التصنيفات الأكثر طلباً
          </h3>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar text-xs font-semibold">
          <span className="px-4 py-2.5 rounded-2xl bg-cyan-500 text-slate-950 font-black shrink-0 shadow-lg shadow-cyan-500/20">
            🔥 الكل
          </span>
          <span className="px-4 py-2.5 rounded-2xl bg-[#0B192C] border border-slate-800 text-slate-300 hover:text-white shrink-0">
            🍔 برجر
          </span>
          <span className="px-4 py-2.5 rounded-2xl bg-[#0B192C] border border-slate-800 text-slate-300 hover:text-white shrink-0">
            🥩 مشويات
          </span>
          <span className="px-4 py-2.5 rounded-2xl bg-[#0B192C] border border-slate-800 text-slate-300 hover:text-white shrink-0">
            🍕 بيتزا
          </span>
          <span className="px-4 py-2.5 rounded-2xl bg-[#0B192C] border border-slate-800 text-slate-300 hover:text-white shrink-0">
            🧋 عصائر
          </span>
        </div>
      </div>

      {/* Restaurant List Section */}
      <div className="space-y-4 pt-2" id="restaurants">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-white">المطاعم المتاحة حولك ({restaurants.length})</h3>
          <span className="text-xs font-semibold text-cyan-400">عرض الكل</span>
        </div>

        <div className="space-y-4">
          {restaurants.map((restaurant) => (
            <Link
              key={restaurant.id}
              href={`/restaurants/${restaurant.id}`}
              className="block group bg-[#0B192C] border border-slate-800/80 hover:border-cyan-500/50 rounded-3xl overflow-hidden shadow-xl transition-all hover:shadow-cyan-950/40"
            >
              {/* Cover Header */}
              <div className="relative h-36 w-full bg-slate-900">
                <Image
                  src={restaurant.coverImage || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"}
                  alt={restaurant.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B192C] via-transparent to-transparent opacity-90"></div>

                {/* Delivery Time Badge */}
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/80 text-[11px] font-bold text-white flex items-center gap-1.5 shadow-lg">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> 20 - 30 دقيقة
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 relative space-y-2">
                {/* Logo Overlap */}
                <div className="relative -mt-10 mb-2 flex justify-between items-end">
                  <div className="w-14 h-14 rounded-2xl bg-[#0B192C] border-2 border-cyan-400 p-1 shadow-xl overflow-hidden relative">
                    <Image
                      src={restaurant.logo || "/logo.jpg"}
                      alt={restaurant.name}
                      fill
                      className="object-cover rounded-xl"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl text-amber-300 text-xs font-black">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> 4.9
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-base text-white group-hover:text-cyan-400 transition-colors">
                    {restaurant.name}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-1 font-normal">
                    {restaurant.description}
                  </p>
                </div>

                {/* Delivery & Branch details */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" /> توصيل سريع عبر RIVIX
                  </span>
                  <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                    تصفح المنيو <ChevronLeft className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
