import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { DollarSign, TrendingUp, ShoppingBag, Percent } from "lucide-react"
import { OwnerAnalyticsCharts } from "./OwnerAnalyticsCharts"

export default async function OwnerAnalyticsPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== "restaurant_owner") {
    redirect("/login")
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: user.id },
    include: {
      branches: {
        include: {
          orders: {
            include: {
              items: {
                include: { menuItem: true }
              }
            }
          }
        }
      }
    }
  })

  if (!restaurant) {
    redirect("/dashboard/restaurant")
  }

  const commissionRate = restaurant.commissionRate || 12.5

  let totalGrossSales = 0
  let totalOrdersCount = 0

  const daysMap: { [key: string]: number } = {}
  const now = new Date()

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const dateStr = d.toLocaleDateString("ar-SA", { weekday: "short", day: "numeric", month: "numeric" })
    daysMap[dateStr] = 0
  }

  const itemSalesMap: { [key: string]: { name: string; sales: number; qty: number } } = {}
  const branchSalesMap: { [key: string]: number } = {}

  restaurant.branches.forEach((branch) => {
    branchSalesMap[branch.address] = 0

    branch.orders.forEach((o) => {
      if (o.status === "delivered" || o.status === "accepted") {
        totalGrossSales += o.totalPrice
        totalOrdersCount += 1

        // Daily trend
        const dStr = new Date(o.createdAt).toLocaleDateString("ar-SA", { weekday: "short", day: "numeric", month: "numeric" })
        if (daysMap[dStr] !== undefined) {
          daysMap[dStr] += o.totalPrice
        }

        // Branch sales
        branchSalesMap[branch.address] += o.totalPrice

        // Item sales
        o.items.forEach((item) => {
          const itemName = item.menuItem?.name || "صنف"
          if (!itemSalesMap[itemName]) {
            itemSalesMap[itemName] = { name: itemName, sales: 0, qty: 0 }
          }
          itemSalesMap[itemName].sales += item.price * item.quantity
          itemSalesMap[itemName].qty += item.quantity
        })
      }
    })
  })

  const platformCommissionAmount = totalGrossSales * (commissionRate / 100)
  const netStoreRevenue = totalGrossSales - platformCommissionAmount

  const dailySales = Object.keys(daysMap).map((k) => ({
    date: k,
    sales: Math.round(daysMap[k]),
  }))

  const topItems = Object.values(itemSalesMap)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5)

  const branchSales = Object.keys(branchSalesMap).map((k) => ({
    name: k,
    value: Math.round(branchSalesMap[k]),
  }))

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">تقارير المبيعات والأرباح للمطعم (Restaurant Financial Analytics)</h1>
        <p className="text-sm text-slate-400 mt-1">تتبع المبيعات اليومية، صافي الأرباح بعد عمولة المنصة، والأصناف الأكثر مبيعاً.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#0B192C] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">إجمالي مبيعات المطعم</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400"><DollarSign className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-black text-white mt-3">{totalGrossSales.toLocaleString()} <span className="text-sm font-normal text-slate-400">ر.س</span></p>
        </div>

        <div className="bg-[#0B192C] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">صافي الأرباح المستلمة</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><TrendingUp className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-3">{Math.round(netStoreRevenue).toLocaleString()} <span className="text-sm font-normal text-slate-400">ر.س</span></p>
          <p className="text-xs text-emerald-300 mt-2 font-medium">بعد خصم عمولة المنصة ({commissionRate}%)</p>
        </div>

        <div className="bg-[#0B192C] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">عدد الطلبات المنفذة</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><ShoppingBag className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-black text-white mt-3">{totalOrdersCount}</p>
        </div>

        <div className="bg-[#0B192C] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">عمولة المنصة المخصومة</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><Percent className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-black text-amber-400 mt-3">{Math.round(platformCommissionAmount).toLocaleString()} <span className="text-sm font-normal text-slate-400">ر.س</span></p>
        </div>
      </div>

      {/* Interactive Charts */}
      <OwnerAnalyticsCharts
        dailySales={dailySales}
        topItems={topItems}
        branchSales={branchSales}
      />
    </div>
  )
}
