import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  Store,
  Users,
  ShieldCheck,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  ChevronLeft,
} from "lucide-react"

export default async function AdminDashboardMainPage() {
  // Fetch Restaurant metrics
  const [
    totalRestaurants,
    pendingRestaurantsCount,
    activeRestaurantsCount,
    suspendedRestaurantsCount,
  ] = await Promise.all([
    prisma.restaurant.count(),
    prisma.restaurant.count({ where: { status: "pending" } }),
    prisma.restaurant.count({ where: { status: "active" } }),
    prisma.restaurant.count({ where: { status: "suspended" } }),
  ])

  // Fetch User metrics
  const [
    totalUsers,
    customersCount,
    ownersCount,
    adminsCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.user.count({ where: { role: "restaurant_owner" } }),
    prisma.user.count({ where: { role: "admin" } }),
  ])

  // Fetch Last 10 registered restaurants
  const recentRestaurants = await prisma.restaurant.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      owner: {
        select: { name: true, email: true },
      },
    },
  })

  return (
    <div className="space-y-8 text-brand-white">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-brand-navy border border-brand-sky/20 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-2xl backdrop-blur-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-sky/10 border border-brand-sky/20 text-brand-sky text-xs font-bold font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PLATFORM OVERVIEW</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-white">
            لوحة تحكم إدارة منصة RIVIX 🛡️
          </h1>
          <p className="text-xs text-brand-gray-400 max-w-xl">
            نظرة عامة شاطئة لمتابعة حركة تسجيل المطاعم، اعتماد التراخيص، وإدارة مستخدمي المنصة.
          </p>
        </div>

        <Link
          href="/dashboard/admin/restaurants"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-sky hover:bg-brand-sky/90 text-brand-white font-bold text-xs shadow-lg shadow-brand-sky/20 transition-all shrink-0 cursor-pointer"
        >
          <span>إدارة موافقات المطاعم</span>
          <ChevronLeft className="w-4 h-4" />
        </Link>
      </div>

      {/* Restaurant Metrics Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-brand-gray-300 flex items-center gap-2">
          <Store className="w-4 h-4 text-brand-sky" /> إحصائيات وتراخيص المطاعم
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-brand-navy/90 border border-brand-gray-800 rounded-2xl p-5 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-brand-gray-400">
              <span className="text-xs font-semibold">إجمالي المطاعم</span>
              <Store className="w-5 h-5 text-brand-sky" />
            </div>
            <p className="text-3xl font-black text-brand-white">{totalRestaurants}</p>
            <p className="text-[11px] text-brand-gray-400">مطعم مسجل في المنصة</p>
          </div>

          <div className="bg-brand-navy/90 border border-brand-warning/30 rounded-2xl p-5 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-brand-warning">
              <span className="text-xs font-semibold">قيد المراجعة (Pending)</span>
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-brand-warning">{pendingRestaurantsCount}</p>
            <p className="text-[11px] text-brand-gray-400">بانتظار الموافقة</p>
          </div>

          <div className="bg-brand-navy/90 border border-brand-success/30 rounded-2xl p-5 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-brand-success">
              <span className="text-xs font-semibold">المطاعم النشطة (Active)</span>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-brand-success">{activeRestaurantsCount}</p>
            <p className="text-[11px] text-brand-gray-400">حسابات مرخصة وشغالة</p>
          </div>

          <div className="bg-brand-navy/90 border border-brand-danger/30 rounded-2xl p-5 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-brand-danger">
              <span className="text-xs font-semibold">المطاعم المعلقة (Suspended)</span>
              <XCircle className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-brand-danger">{suspendedRestaurantsCount}</p>
            <p className="text-[11px] text-brand-gray-400">موقوفة مؤقتاً</p>
          </div>
        </div>
      </div>

      {/* User Metrics Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-brand-gray-300 flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-sky" /> مستخدمي المنصة حسب الأدوار
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-brand-navy/90 border border-brand-gray-800 rounded-2xl p-5 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-brand-gray-400">
              <span className="text-xs font-semibold">مجموع الحسابات</span>
              <Users className="w-5 h-5 text-brand-sky" />
            </div>
            <p className="text-3xl font-black text-brand-white">{totalUsers}</p>
            <p className="text-[11px] text-brand-gray-400">كل الحسابات المسجلة</p>
          </div>

          <div className="bg-brand-navy/90 border border-brand-gray-800 rounded-2xl p-5 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-brand-sky">
              <span className="text-xs font-semibold">العملاء (Customers)</span>
              <UserCheck className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-brand-sky">{customersCount}</p>
            <p className="text-[11px] text-brand-gray-400">مستخدمي تطبيق الطلبات</p>
          </div>

          <div className="bg-brand-navy/90 border border-brand-gray-800 rounded-2xl p-5 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-xs font-semibold">أصحاب المطاعم (Owners)</span>
              <Store className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-amber-400">{ownersCount}</p>
            <p className="text-[11px] text-brand-gray-400">مديري التشغيل والأطقم</p>
          </div>

          <div className="bg-brand-navy/90 border border-brand-gray-800 rounded-2xl p-5 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-purple-400">
              <span className="text-xs font-semibold">مدراء المنصة (Admins)</span>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-purple-400">{adminsCount}</p>
            <p className="text-[11px] text-brand-gray-400">حسابات الإدارة العليا</p>
          </div>
        </div>
      </div>

      {/* Table: Last 10 Registered Restaurants */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-brand-gray-800 pb-3">
          <h2 className="text-base font-bold text-brand-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-sky" /> آخر 10 مطاعم انضمت للمنصة
          </h2>
          <Link
            href="/dashboard/admin/restaurants"
            className="text-xs font-bold text-brand-sky hover:underline flex items-center gap-1"
          >
            مشاهدة جميع المطاعم <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="rounded-2xl bg-brand-navy/90 border border-brand-gray-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-brand-gray-900/80 text-brand-gray-400 font-bold border-b border-brand-gray-800">
                <tr>
                  <th className="p-4">اسم المطعم</th>
                  <th className="p-4">المالك (Owner)</th>
                  <th className="p-4">الحالة (Status)</th>
                  <th className="p-4">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray-800/60">
                {recentRestaurants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-brand-gray-400">
                      لا توجد مطاعم مسجلة حتى الآن.
                    </td>
                  </tr>
                ) : (
                  recentRestaurants.map((res) => {
                    const statusStyles = {
                      pending: "bg-brand-warning/10 text-brand-warning border-brand-warning/30",
                      active: "bg-brand-success/10 text-brand-success border-brand-success/30",
                      suspended: "bg-brand-danger/10 text-brand-danger border-brand-danger/30",
                    }
                    const statusLabels = {
                      pending: "قيد المراجعة ⏳",
                      active: "نشط ومعتمد ✅",
                      suspended: "معلق ⛔",
                    }

                    return (
                      <tr key={res.id} className="hover:bg-brand-gray-900/40 transition-colors">
                        <td className="p-4 font-bold text-brand-white">{res.name}</td>
                        <td className="p-4 text-brand-gray-300">
                          <div>{res.owner.name}</div>
                          <div className="text-[10px] text-brand-gray-500 font-mono">{res.owner.email}</div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg font-bold border text-[11px] ${
                              statusStyles[res.status] || "bg-brand-gray-800 text-brand-white"
                            }`}
                          >
                            {statusLabels[res.status] || res.status}
                          </span>
                        </td>
                        <td className="p-4 text-brand-gray-400 font-mono dir-ltr text-right">
                          {new Date(res.createdAt).toLocaleDateString("ar-EG", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
