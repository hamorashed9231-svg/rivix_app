import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { DollarSign, TrendingUp, ShoppingBag, Building2 } from "lucide-react"
import { AdminAnalyticsCharts } from "./AdminAnalyticsCharts"

export default async function AdminAnalyticsPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== "admin") {
    redirect("/dashboard/restaurant")
  }

  // Fetch all orders with restaurant info
  const orders = await prisma.order.findMany({
    include: {
      branch: {
        include: { restaurant: true }
      }
    },
    orderBy: { createdAt: "asc" }
  })

  // Calculate total platform revenue & commission
  let totalGrossSales = 0
  let totalPlatformCommission = 0

  orders.forEach((o) => {
    if (o.status === "delivered" || o.status === "accepted") {
      totalGrossSales += o.totalPrice
      const rate = o.branch.restaurant.commissionRate || 12.5
      totalPlatformCommission += o.totalPrice * (rate / 100)
    }
  })

  // Group sales by day (Last 7 Days)
  const daysMap: { [key: string]: { sales: number; commission: number } } = {}
  const now = new Date()

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const dateStr = d.toLocaleDateString("ar-SA", { weekday: "short", day: "numeric", month: "numeric" })
    daysMap[dateStr] = { sales: 0, commission: 0 }
  }

  orders.forEach((o) => {
    const dStr = new Date(o.createdAt).toLocaleDateString("ar-SA", { weekday: "short", day: "numeric", month: "numeric" })
    if (daysMap[dStr]) {
      if (o.status === "delivered" || o.status === "accepted") {
        daysMap[dStr].sales += o.totalPrice
        const rate = o.branch.restaurant.commissionRate || 12.5
        daysMap[dStr].commission += o.totalPrice * (rate / 100)
      }
    }
  })

  const salesTrend = Object.keys(daysMap).map((k) => ({
    date: k,
    sales: Math.round(daysMap[k].sales),
    commission: Math.round(daysMap[k].commission),
  }))

  // Restaurant Rankings
  const restaurants = await prisma.restaurant.findMany({
    include: {
      branches: {
        include: {
          orders: true
        }
      }
    }
  })

  const restaurantRankings = restaurants.map((r) => {
    let sales = 0
    let count = 0
    r.branches.forEach((b) => {
      b.orders.forEach((o) => {
        if (o.status === "delivered" || o.status === "accepted") {
          sales += o.totalPrice
          count += 1
        }
      })
    })
    return { name: r.name, sales, count }
  }).sort((a, b) => b.sales - a.sales)

  // Status Distribution
  const pendingCount = orders.filter((o) => o.status === "pending").length
  const acceptedCount = orders.filter((o) => o.status === "accepted").length
  const deliveredCount = orders.filter((o) => o.status === "delivered").length
  const cancelledCount = orders.filter((o) => o.status === "cancelled").length

  const statusDistribution = [
    { name: "تم التوصيل", value: deliveredCount, color: "#10B981" },
    { name: "مقبول ومحول", value: acceptedCount, color: "#00D2FF" },
    { name: "قيد الانتظار", value: pendingCount, color: "#F59E0B" },
    { name: "ملغي", value: cancelledCount, color: "#EF4444" },
  ]

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">تقارير المبيعات والأرباح للمنصة (Platform Financial Analytics)</h1>
        <p className="text-sm text-slate-400 mt-1">حساب صافي أرباح وعمولات المنصة، تتبع أداء المطاعم ومعدلات إكمال الطلبات.</p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#0B192C] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">إجمالي مبيعات المنصة</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400"><DollarSign className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-black text-white mt-3">{totalGrossSales.toLocaleString()} <span className="text-sm font-normal text-slate-400">ج.م</span></p>
          <p className="text-xs text-cyan-400 mt-2">عبر كافة المطاعم والطلبات</p>
        </div>

        <div className="bg-[#0B192C] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">صافي عمولات المنصة المستحقة</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><TrendingUp className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-3">{Math.round(totalPlatformCommission).toLocaleString()} <span className="text-sm font-normal text-slate-400">ج.م</span></p>
          <p className="text-xs text-emerald-300 mt-2 font-medium">بمتوسط نسبة عمولة 12.5%</p>
        </div>

        <div className="bg-[#0B192C] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">عدد الطلبات المنفذة</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><ShoppingBag className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-black text-white mt-3">{orders.length}</p>
        </div>

        <div className="bg-[#0B192C] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">متوسط قيمة الطلب</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400"><Building2 className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-black text-white mt-3">
            {orders.length > 0 ? Math.round(totalGrossSales / orders.length) : 0} <span className="text-sm font-normal text-slate-400">ج.م</span>
          </p>
        </div>
      </div>

      {/* Interactive Charts */}
      <AdminAnalyticsCharts
        salesTrend={salesTrend}
        restaurantRankings={restaurantRankings}
        statusDistribution={statusDistribution}
      />
    </div>
  )
}
