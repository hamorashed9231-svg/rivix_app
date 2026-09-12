"use client"

import { useState } from "react"
import { CheckCircle, AlertTriangle, XCircle, Edit, Save, RefreshCw } from "lucide-react"

interface RestaurantData {
  id: string
  name: string
  status: string
  commissionRate: number
  owner: {
    name: string
    email: string
    phone: string | null
  }
  branches: { id: string; address: string }[]
}

export function AdminRestaurantTable({ initialRestaurants }: { initialRestaurants: any[] }) {
  const [restaurants, setRestaurants] = useState<RestaurantData[]>(initialRestaurants)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingRate, setEditingRate] = useState<number>(0)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleStatusChange = async (id: string, newStatus: string) => {
    setLoadingId(id)
    try {
      const res = await fetch("/api/admin/restaurants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: id, status: newStatus }),
      })

      if (res.ok) {
        setRestaurants((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        )
      }
    } catch (err) {
      alert("حدث خطأ أثناء تحديث الحالة")
    } finally {
      setLoadingId(null)
    }
  }

  const handleSaveCommission = async (id: string) => {
    setLoadingId(id)
    try {
      const res = await fetch("/api/admin/restaurants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: id, commissionRate: editingRate }),
      })

      if (res.ok) {
        setRestaurants((prev) =>
          prev.map((r) => (r.id === id ? { ...r, commissionRate: editingRate } : r))
        )
        setEditingId(null)
      }
    } catch (err) {
      alert("حدث خطأ أثناء حفظ نسبة العمولة")
    } finally {
      setLoadingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5" /> نشط
          </span>
        )
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> قيد الانتظار
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> موقوف
          </span>
        )
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right text-sm text-slate-300">
        <thead className="bg-slate-900/60 text-slate-400 uppercase text-xs border-b border-slate-800">
          <tr>
            <th className="px-4 py-3">المطعم</th>
            <th className="px-4 py-3">المالك</th>
            <th className="px-4 py-3">الفروع</th>
            <th className="px-4 py-3">عمولة المنصة</th>
            <th className="px-4 py-3">الحالة الحالية</th>
            <th className="px-4 py-3 text-center">التحكم والعمليات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {restaurants.map((r) => (
            <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
              <td className="px-4 py-4 font-semibold text-white">{r.name}</td>
              <td className="px-4 py-4">
                <div className="text-white font-medium">{r.owner.name}</div>
                <div className="text-xs text-slate-400">{r.owner.email}</div>
              </td>
              <td className="px-4 py-4 text-xs text-slate-400">
                {r.branches.length} فرع
              </td>
              <td className="px-4 py-4">
                {editingId === r.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      value={editingRate}
                      onChange={(e) => setEditingRate(parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 bg-slate-900 border border-cyan-500/50 rounded text-white text-xs focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">%</span>
                    <button
                      onClick={() => handleSaveCommission(r.id)}
                      disabled={loadingId === r.id}
                      className="p-1 rounded bg-cyan-600 text-white hover:bg-cyan-500 text-xs"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{r.commissionRate}%</span>
                    <button
                      onClick={() => {
                        setEditingId(r.id)
                        setEditingRate(r.commissionRate)
                      }}
                      className="text-slate-400 hover:text-cyan-400"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </td>
              <td className="px-4 py-4">{getStatusBadge(r.status)}</td>
              <td className="px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  {r.status !== "active" && (
                    <button
                      onClick={() => handleStatusChange(r.id, "active")}
                      disabled={loadingId === r.id}
                      className="px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 transition-colors"
                    >
                      موافقة وتفعيل
                    </button>
                  )}
                  {r.status !== "suspended" && (
                    <button
                      onClick={() => handleStatusChange(r.id, "suspended")}
                      disabled={loadingId === r.id}
                      className="px-3 py-1.5 text-xs font-semibold rounded bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/30 transition-colors"
                    >
                      إيقاف المطعم
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
