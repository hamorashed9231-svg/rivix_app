import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { 
  Building2, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle 
} from "lucide-react"
import { AdminRestaurantTable } from "./AdminRestaurantTable"

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== "admin") {
    redirect("/dashboard/restaurant")
  }

  // Fetch metrics from DB
  const [
    totalRestaurants,
    pendingRestaurants,
    activeRestaurants,
    totalOrders,
    totalUsers,
    restaurants
  ] = await Promise.all([
    prisma.restaurant.count(),
    prisma.restaurant.count({ where: { status: "pending" } }),
    prisma.restaurant.count({ where: { status: "active" } }),
    prisma.order.count(),
    prisma.user.count(),
    prisma.restaurant.findMany({
      include: {
        owner: { select: { name: true, email: true, phone: true } },
        branches: { select: { id: true, address: true } }
      },
      orderBy: { createdAt: "desc" }
    })
  ])

  // Total sales from all delivered orders
  const deliveredOrders = await prisma.order.aggregate({
    where: { status: "delivered" },
    _sum: { totalPrice: true }
  })

  const totalRevenue = deliveredOrders._sum.totalPrice || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          لوحة تحكم مدير المنصة (Admin Overview)
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          متابعة مؤشرات أداء المنصة، الموافقة على المطاعم الجدد، وضبط نسبة العمولات.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="bg-[#0B192C] border border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-lg shadow-cyan-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">إجمالي المبيعات</span>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3">{totalRevenue.toLocaleString()} <span className="text-sm font-normal text-slate-400">ر.س</span></p>
          <p className="text-xs text-emerald-400 mt-2 font-medium">الطلبات المكتملة بالتوصيل</p>
        </div>

        {/* Total Orders */}
        <div className="bg-[#0B192C] border border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">إجمالي الطلبات</span>
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3">{totalOrders}</p>
          <p className="text-xs text-slate-400 mt-2">عبر كافة الفروع والمطاعم</p>
        </div>

        {/* Active Restaurants */}
        <div className="bg-[#0B192C] border border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">المطاعم النشطة</span>
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3">{activeRestaurants} <span className="text-xs font-normal text-slate-400">من {totalRestaurants}</span></p>
          <p className="text-xs text-blue-400 mt-2">مطاعم تم قيودها وحسابها نشط</p>
        </div>

        {/* Pending Approvals */}
        <div className="bg-[#0B192C] border border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">طلبات الانتظار</span>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-400 mt-3">{pendingRestaurants}</p>
          <p className="text-xs text-amber-300 mt-2 font-medium">مطاعم بانتظار موافقة الأدمن</p>
        </div>
      </div>

      {/* Restaurants Management Table */}
      <div className="bg-[#0B192C] border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              إدارة طلبات المطاعم والعمولات
            </h2>
            <p className="text-xs text-slate-400 mt-1">تحديد حالة كل مطعم (نشط / قيد الانتظار / موقوف) وتعديل نسبة العمولة الخاصة بالمنصة</p>
          </div>
        </div>

        <AdminRestaurantTable initialRestaurants={restaurants} />
      </div>
    </div>
  )
}
