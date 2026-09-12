"use client"

import { useState } from "react"
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  Share2, 
  Phone, 
  MapPin, 
  User, 
  Clock, 
  Cpu, 
  Check, 
  Ban,
  ShoppingBag,
  ArrowUpRight
} from "lucide-react"

export function OrderBoard({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState<any[]>(initialOrders)
  const [activeTab, setActiveTab] = useState<"pending" | "accepted" | "history">("pending")
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const pendingOrders = orders.filter((o) => o.status === "pending")
  const acceptedOrders = orders.filter((o) => o.status === "accepted" || o.status === "preparing" || o.status === "ready" || o.status === "out_for_delivery")
  const historyOrders = orders.filter((o) => o.status === "delivered" || o.status === "cancelled")

  // Accept Order Directly
  const handleAcceptOrder = async (orderId: string) => {
    setLoadingId(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      })

      if (res.ok) {
        const data = await res.json()
        setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)))
      }
    } catch (err) {
      alert("حدث خطأ أثناء قبول الطلب")
    } finally {
      setLoadingId(null)
    }
  }

  // Reject / Cancel Order
  const handleRejectOrder = async (orderId: string) => {
    setLoadingId(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })

      if (res.ok) {
        const data = await res.json()
        setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)))
      }
    } catch (err) {
      alert("حدث خطأ أثناء رفض الطلب")
    } finally {
      setLoadingId(null)
    }
  }

  // Forward to External System / POS Integration
  const handleForwardToPOS = async (orderId: string) => {
    setLoadingId(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/forward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetSystem: "POS_INTEGRATION_MAIN" }),
      })

      if (res.ok) {
        const data = await res.json()
        setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)))
        alert(`تم تحويل الطلب بنجاح إلى السيستم الخارجي (كود الربط: ${data.externalRef})`)
      }
    } catch (err) {
      alert("حدث خطأ أثناء تحويل الطلب للنظام الخارجي")
    } finally {
      setLoadingId(null)
    }
  }

  const displayedOrders = 
    activeTab === "pending" 
      ? pendingOrders 
      : activeTab === "accepted" 
      ? acceptedOrders 
      : historyOrders

  return (
    <div className="space-y-6">
      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-3 bg-[#0B192C] p-2 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg transition-all ${
            activeTab === "pending"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Bell className="w-4 h-4 text-amber-400 animate-pulse" />
          طلبات واردة بحاجة لاتخاذ إجراء
          {pendingOrders.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px]">
              {pendingOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("accepted")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg transition-all ${
            activeTab === "accepted"
              ? "bg-cyan-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <CheckCircle className="w-4 h-4 text-cyan-300" />
          طلبات مقبولة / محولة
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px]">
            {acceptedOrders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg transition-all ${
            activeTab === "history"
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-slate-400" />
          سجل الطلبات ({historyOrders.length})
        </button>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedOrders.map((order) => {
          const isPosForwarded = order.driverAssignmentId?.startsWith("POS-EXT-")

          return (
            <div
              key={order.id}
              className={`bg-[#0B192C] border rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between transition-all ${
                order.status === "pending"
                  ? "border-amber-500/40 shadow-amber-500/5 ring-1 ring-amber-500/20"
                  : "border-slate-800"
              }`}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs text-slate-400">رقم الطلب</span>
                    <h4 className="font-mono text-base font-extrabold text-white">
                      #{order.id.slice(-6).toUpperCase()}
                    </h4>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {new Date(order.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isPosForwarded && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        <Cpu className="w-3 h-3 text-cyan-400" /> محول للـ POS
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer Details */}
                <div className="bg-slate-900/80 rounded-xl p-3.5 space-y-2 text-xs border border-slate-800/80">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span>{order.customer?.name}</span>
                  </div>
                  {order.customer?.phone && (
                    <div className="flex items-center gap-2 text-slate-300 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.customer.phone}</span>
                    </div>
                  )}
                  {order.deliveryAddress?.details && (
                    <div className="flex items-start gap-2 text-slate-400 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{order.deliveryAddress.details}</span>
                    </div>
                  )}
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400">عناصر الطلب ({order.items?.length || 0}):</span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between text-xs bg-slate-950/60 p-2 rounded border border-slate-800/50">
                        <span className="text-white font-medium">x{item.quantity} {item.menuItem?.name}</span>
                        <span className="font-bold text-cyan-400">{item.price * item.quantity} ر.س</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Total & Action Buttons */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">الإجمالي النهائي:</span>
                  <span className="text-lg font-black text-white">{order.totalPrice} <span className="text-xs font-normal text-slate-400">ر.س</span></span>
                </div>

                {/* Actions for Pending Orders */}
                {order.status === "pending" && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Accept Order */}
                      <button
                        onClick={() => handleAcceptOrder(order.id)}
                        disabled={loadingId === order.id}
                        className="py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
                      >
                        <Check className="w-4 h-4" /> قبول واستلام
                      </button>

                      {/* Forward to POS Integration */}
                      <button
                        onClick={() => handleForwardToPOS(order.id)}
                        disabled={loadingId === order.id}
                        className="py-2.5 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all"
                      >
                        <Share2 className="w-4 h-4" /> تحويل للـ POS
                      </button>
                    </div>

                    {/* Reject Button */}
                    <button
                      onClick={() => handleRejectOrder(order.id)}
                      disabled={loadingId === order.id}
                      className="w-full py-2 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Ban className="w-3.5 h-3.5" /> رفض الطلب
                    </button>
                  </div>
                )}

                {/* Label for Accepted/Forwarded Orders */}
                {order.status !== "pending" && (
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span>الحالة:</span>
                    <span className={`font-bold px-2.5 py-1 rounded text-[11px] ${
                      order.status === "accepted" 
                        ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                        : order.status === "delivered"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}>
                      {order.status === "accepted" && "تم القبول والاستلام"}
                      {order.status === "delivered" && "مكتمل ومسلم"}
                      {order.status === "cancelled" && "ملغي"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {displayedOrders.length === 0 && (
        <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
          <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">لا توجد طلبات في هذا القسم حالياً</h3>
          <p className="text-xs text-slate-400">ستظهر الطلبات الجديدة فور قيام العملاء بالطلب عبر المنصة.</p>
        </div>
      )}
    </div>
  )
}
