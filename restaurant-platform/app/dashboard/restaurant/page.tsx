import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { 
  Utensils, 
  GitFork, 
  ShoppingBag, 
  DollarSign, 
  ArrowLeft,
  Store,
  PlusCircle
} from "lucide-react"

export default async function RestaurantDashboardPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== "restaurant_owner") {
    if (user?.role === "admin") {
      redirect("/dashboard/admin")
    }
    redirect("/login")
  }

  // Find owner's restaurant
  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: user.id },
    include: {
      branches: {
        include: {
          menuCategories: {
            include: { items: true }
          },
          orders: true
        }
      }
    }
  })

  if (!restaurant) {
    return (
      <div className="bg-[#0B192C] border border-slate-800 rounded-xl p-8 text-center max-w-lg mx-auto space-y-4">
        <Store className="w-12 h-12 text-cyan-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">لم يتم العثور على مطعم مرخص لـ {user.name}</h2>
        <p className="text-sm text-slate-400">يمكنك إضافة وإعداد مطعمك الجديد وتخصيص الهوية البصرية الآن.</p>
        <Link
          href="/dashboard/restaurants/new"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-sky text-white font-bold text-sm shadow-lg shadow-brand-sky/20 hover:bg-brand-sky/90 transition-all"
        >
          <PlusCircle className="w-4 h-4" /> إضافة مطعم جديد الآن
        </Link>
      </div>
    )
  }

  const branchIds = restaurant.branches.map((b) => b.id)

  const [totalOrdersCount, totalItemsCount, totalDeliveredAggregate] = await Promise.all([
    prisma.order.count({ where: { branchId: { in: branchIds } } }),
    prisma.menuItem.count({ where: { category: { branchId: { in: branchIds } } } }),
    prisma.order.aggregate({
      where: { branchId: { in: branchIds }, status: "delivered" },
      _sum: { totalPrice: true }
    })
  ])

  const totalSales = totalDeliveredAggregate._sum.totalPrice || 0

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0B192C] via-slate-900 to-[#0B192C] border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-2xl font-black shrink-0">
            {restaurant.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-white">{restaurant.name}</h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                restaurant.status === "active" 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}>
                {restaurant.status === "active" ? "حساب نشط" : "قيد المراجعة"}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1 max-w-xl line-clamp-1">{restaurant.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {restaurant.slug && (
            <Link
              href={`/restaurant/${restaurant.slug}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-sky/10 border border-brand-sky/30 hover:bg-brand-sky/20 text-brand-sky font-medium text-sm transition-colors"
            >
              <Store className="w-4 h-4" /> معاينة صفحة المطعم
            </Link>
          )}
          <Link
            href="/dashboard/restaurants/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-colors border border-slate-700"
          >
            <PlusCircle className="w-4 h-4 text-cyan-400" /> مطعم جديد
          </Link>
          <Link
            href="/dashboard/restaurant/menu"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition-colors shadow-lg shadow-cyan-600/20"
          >
            <PlusCircle className="w-4 h-4" /> إضافة أصناف
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#0B192C] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">إجمالي المبيعات</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><DollarSign className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-black text-white mt-3">{totalSales.toLocaleString()} <span className="text-sm font-normal text-slate-400">ج.م</span></p>
        </div>

        <div className="bg-[#0B192C] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">عدد الطلبات الحالية</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400"><ShoppingBag className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-black text-white mt-3">{totalOrdersCount}</p>
        </div>

        <div className="bg-[#0B192C] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">الفروع المتاحة</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><GitFork className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-black text-white mt-3">{restaurant.branches.length}</p>
        </div>

        <div className="bg-[#0B192C] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">أصناف المنيو المسجلة</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><Utensils className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-black text-white mt-3">{totalItemsCount}</p>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/dashboard/restaurant/menu"
          className="group bg-[#0B192C] border border-slate-800 hover:border-cyan-500/50 rounded-xl p-6 transition-all shadow-lg hover:shadow-cyan-950/30 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Utensils className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">إدارة المنيو والتصنيفات</h3>
            <p className="text-xs text-slate-400 mt-2">إضافة أصناف جديدة، تعديل الأسعار، التحكم في توفر الأصناف، وتصنيف الأطعمة.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mt-6">
            الانتقال للمنيو <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/dashboard/restaurant/branches"
          className="group bg-[#0B192C] border border-slate-800 hover:border-cyan-500/50 rounded-xl p-6 transition-all shadow-lg hover:shadow-cyan-950/30 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <GitFork className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">إدارة الفروع والمواقع</h3>
            <p className="text-xs text-slate-400 mt-2">إدارة مواقع الفروع على الخريطة، أرقام الهواتف، وساعات العمل المعتمدة.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mt-6">
            إدارة الفروع <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/dashboard/orders"
          className="group bg-[#0B192C] border border-slate-800 hover:border-cyan-500/50 rounded-xl p-6 transition-all shadow-lg hover:shadow-cyan-950/30 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">شاشة الطلبات المباشرة (المطبخ)</h3>
            <p className="text-xs text-slate-400 mt-2">استقبال وتجهيز الطلبات لحظياً وتغيير حالات الطلبات (قيد التجهيز ➔ جاهز ➔ تم التوصيل).</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mt-6">
            فتح شاشة الطلبات <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  )
}
