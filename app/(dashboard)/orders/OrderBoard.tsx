"use client"

import { useState } from "react"
import { 
  Clock, 
  CheckCircle2, 
  ChefHat, 
  PackageCheck, 
  Truck, 
  AlertCircle,
  MapPin,
  Phone,
  User,
  ArrowLeft
} from "lucide-react"

const STATUS_COLUMNS = [
  { key: "pending", title: "طلبات جديدة", bg: "border-amber-500/30 bg-amber-500/5", badge: "bg-amber-500/20 text-amber-300", icon: Clock },
  { key: "accepted", title: "مقبولة", bg: "border-blue-500/30 bg-blue-500/5", badge: "bg-blue-500/20 text-blue-300", icon: CheckCircle2 },
  { key: "preparing", title: "جاري التجهيز بالمطبخ", bg: "border-orange-500/30 bg-orange-500/5", badge: "bg-orange-500/20 text-orange-300", icon: ChefHat },
  { key: "ready", title: "جاهزة للتسليم", bg: "border-emerald-500/30 bg-emerald-500/5", badge: "bg-emerald-500/20 text-emerald-300", icon: PackageCheck },
  { key: "out_for_delivery", title: "مع المندوب للتوصيل", bg: "border-cyan-500/30 bg-cyan-500/5", badge: "bg-cyan-500/20 text-cyan-300", icon: Truck },
  { key: "delivered", title: "تم التوصيل بنجاح", bg: "border-slate-800 bg-slate-900/40", badge: "bg-slate-800 text-slate-400", icon: CheckCircle2 },
]

export function OrderBoard({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState<any[]>(initialOrders)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    setUpdatingId(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
        )
      }
    } catch (err) {
      alert("حدث خطأ أثناء تحديث حالة الطلب")
    } finally {
      setUpdatingId(null)
    }
  }

  const getNextAction = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "قبول الطلب", next: "accepted", color: "bg-blue-600 hover:bg-blue-500" }
      case "accepted":
        return { label: "بدء التجهيز", next: "preparing", color: "bg-orange-600 hover:bg-orange-500" }
      case "preparing":
        return { label: "جاهز للتسليم", next: "ready", color: "bg-emerald-600 hover:bg-emerald-500" }
      case "ready":
        return { label: "تسليم للمندوب", next: "out_for_delivery", color: "bg-cyan-600 hover:bg-cyan-500" }
      case "out_for_delivery":
        return { label: "تم التسليم للعميل", next: "delivered", color: "bg-emerald-700 hover:bg-emerald-600" }
      default:
        return null
    }
  }

  return (
    <div className="overflow-x-auto pb-6">
      <div className="flex gap-5 min-w-[1200px]">
        {STATUS_COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.key)
          const Icon = col.icon

          return (
            <div
              key={col.key}
              className={`flex-1 rounded-2xl border ${col.bg} p-4 flex flex-col min-h-[600px] shadow-lg`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-sm text-white">{col.title}</h3>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${col.badge}`}>
                  {colOrders.length}
                </span>
              </div>

              {/* Order Cards */}
              <div className="space-y-4 flex-1">
                {colOrders.map((order) => {
                  const action = getNextAction(order.status)
                  return (
                    <div
                      key={order.id}
                      className="bg-[#0B192C] border border-slate-800 rounded-xl p-4 shadow-xl space-y-3 hover:border-cyan-500/40 transition-all"
                    >
                      {/* Top Order ID & Time */}
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="font-mono text-xs font-bold text-cyan-400">
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(order.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-white font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400" /> {order.customer?.name}
                        </div>
                        {order.customer?.phone && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <Phone className="w-3.5 h-3.5 text-slate-500" /> {order.customer.phone}
                          </div>
                        )}
                        {order.deliveryAddress?.details && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="line-clamp-1">{order.deliveryAddress.details}</span>
                          </div>
                        )}
                      </div>

                      {/* Order Items */}
                      <div className="bg-slate-900/90 rounded-lg p-2.5 space-y-1 text-xs">
                        {order.items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center text-slate-300">
                            <span>x{item.quantity} {item.menuItem?.name}</span>
                            <span className="font-semibold text-white">{item.price * item.quantity} ر.س</span>
                          </div>
                        ))}
                      </div>

                      {/* Total Price */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-slate-400">الإجمالي:</span>
                        <span className="text-sm font-extrabold text-cyan-300">{order.totalPrice} ر.س</span>
                      </div>

                      {/* Action Button */}
                      {action && (
                        <div className="pt-2 flex gap-2">
                          <button
                            onClick={() => handleUpdateStatus(order.id, action.next)}
                            disabled={updatingId === order.id}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg text-white transition-all shadow-md flex items-center justify-center gap-1.5 ${action.color}`}
                          >
                            {updatingId === order.id ? "جاري التحديث..." : action.label}
                          </button>

                          {order.status === "pending" && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, "cancelled")}
                              disabled={updatingId === order.id}
                              className="px-3 py-2 text-xs font-bold rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/30"
                            >
                              إلغاء
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {colOrders.length === 0 && (
                  <div className="h-32 flex items-center justify-center text-xs text-slate-600 italic">
                    لا توجد طلبات في هذه الحالة حالياً
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
