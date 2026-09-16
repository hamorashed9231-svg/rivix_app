"use client"

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts"
import { TrendingUp, Building2, PieChart as PieIcon, DollarSign } from "lucide-react"

interface AdminChartsProps {
  salesTrend: { date: string; sales: number; commission: number }[]
  restaurantRankings: { name: string; sales: number; count: number }[]
  statusDistribution: { name: string; value: number; color: string }[]
}

export function AdminAnalyticsCharts({
  salesTrend,
  restaurantRankings,
  statusDistribution,
}: AdminChartsProps) {
  return (
    <div className="space-y-8">
      {/* Sales & Commission Area Chart */}
      <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              مؤشر المبيعات وصافي عمولات المنصة (7 أيام)
            </h3>
            <p className="text-xs text-slate-400 mt-1">تتبع المبيعات الإجمالية وعمولة المنصة المستحقة يومياً</p>
          </div>
        </div>

        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesTrend}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D2FF" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00D2FF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
              />
              <Legend wrapperStyle={{ paddingTop: "10px" }} />
              <Area
                type="monotone"
                dataKey="sales"
                name="إجمالي المبيعات (ج.م)"
                stroke="#00D2FF"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#salesGrad)"
              />
              <Area
                type="monotone"
                dataKey="commission"
                name="صافي عمولة المنصة (ج.م)"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#commGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Grid: Restaurant Ranking + Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Restaurants Bar Chart */}
        <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              أعلى المطاعم تحقيقاً للمبيعات
            </h3>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={restaurantRankings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                />
                <Bar dataKey="sales" name="المبيعات الإجمالية (ج.م)" fill="#0091FF" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Donut Chart */}
        <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-emerald-400" />
              توزيع حالات الطلبات بالمنصة
            </h3>
          </div>

          <div className="h-72 w-full flex items-center justify-center pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
