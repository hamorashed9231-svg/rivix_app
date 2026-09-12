"use client"

import { useState, useEffect } from "react"
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
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  X,
  Plus,
  Minus,
  Save,
  AlertTriangle
} from "lucide-react"

export function OrderBoard({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState<any[]>(initialOrders)
  const [activeTab, setActiveTab] = useState<"pending" | "accepted" | "history">("pending")
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Modals state
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null)
  const [editingOrder, setEditingOrder] = useState<any | null>(null)
  const [editItems, setEditItems] = useState<any[]>([])

  // Fetch updated orders list
  const refreshOrders = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch("/api/customer/orders")
      if (res.ok) {
        const data = await res.json()
        if (data.orders) {
          setOrders(data.orders)
        }
      }
    } catch (e) {
    } finally {
      setIsRefreshing(false)
    }
  }

  // Auto-refresh polling every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshOrders()
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const pendingOrders = orders.filter((o) => o.status === "pending")
  const acceptedOrders = orders.filter((o) => o.status === "accepted" || o.status === "preparing" || o.status === "ready" || o.status === "out_for_delivery")
  const historyOrders = orders.filter((o) => o.status === "delivered" || o.status === "cancelled")

  // Accept Order
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

  // Reject Order
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

  // Forward to External System / POS
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

  // Delete Order
  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("هل أنت تأكد من رغبتك في حذف هذا الطلب نهائياً من النظام؟")) return
    setLoadingId(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId))
        if (selectedOrderDetails?.id === orderId) setSelectedOrderDetails(null)
      }
    } catch (err) {
      alert("حدث خطأ أثناء حذف الطلب")
    } finally {
      setLoadingId(null)
    }
  }

  // Start Editing Order
  const openEditModal = (order: any) => {
    setEditingOrder(order)
    setEditItems(
      order.items.map((i: any) => ({
        id: i.id,
        menuItemId: i.menuItemId,
        name: i.menuItem?.name || "صنف",
        price: i.price,
        quantity: i.quantity,
      }))
    )
  }

  const updateEditQuantity = (index: number, delta: number) => {
    setEditItems((prev) => {
      const updated = [...prev]
      const newQty = updated[index].quantity + delta
      if (newQty > 0) {
        updated[index].quantity = newQty
      }
      return updated
    })
  }

  const removeEditItem = (index: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== index))
  }

  const saveEditedOrder = async () => {
    if (!editingOrder || editItems.length === 0) return
    setLoadingId(editingOrder.id)

    const newTotalPrice = editItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

    try {
      const res = await fetch(`/api/orders/${editingOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: editItems,
          totalPrice: newTotalPrice,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setOrders((prev) => prev.map((o) => (o.id === editingOrder.id ? data.order : o)))
        setEditingOrder(null)
      }
    } catch (err) {
      alert("حدث خطأ أثناء حفظ التعديلات")
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
      {/* Navigation Filter Tabs & Refresh Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

        {/* Manual Refresh Button */}
        <button
          onClick={refreshOrders}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B192C] border border-slate-800 text-slate-300 hover:text-cyan-400 text-xs font-bold transition-all shadow-md"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
          <span>تحديث مباشر</span>
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

                  <div className="flex items-center gap-2">
                    {/* View Details Button */}
                    <button
                      onClick={() => setSelectedOrderDetails(order)}
                      title="عرض التفاصيل الكاملة"
                      className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 hover:bg-slate-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Edit Order Button */}
                    <button
                      onClick={() => openEditModal(order)}
                      title="تعديل عناصر الطلب"
                      className="p-1.5 rounded-lg bg-slate-800 text-amber-400 hover:bg-slate-700 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Delete Order Button */}
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      title="حذف الطلب نهائياً"
                      className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-slate-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

                {/* Order Items */}
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
                      <button
                        onClick={() => handleAcceptOrder(order.id)}
                        disabled={loadingId === order.id}
                        className="py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
                      >
                        <Check className="w-4 h-4" /> قبول واستلام
                      </button>

                      <button
                        onClick={() => handleForwardToPOS(order.id)}
                        disabled={loadingId === order.id}
                        className="py-2.5 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all"
                      >
                        <Share2 className="w-4 h-4" /> تحويل للـ POS
                      </button>
                    </div>

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
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedOrderDetails(null)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs text-slate-400">بيانات تفاصيل الطلب الكاملة</span>
              <h3 className="text-xl font-extrabold text-white">#{selectedOrderDetails.id.slice(-6).toUpperCase()}</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-900 p-3 rounded-xl space-y-1">
                <p className="text-slate-400">العميل: <strong className="text-white">{selectedOrderDetails.customer?.name}</strong></p>
                <p className="text-slate-400">الهاتف: <strong className="text-cyan-400 font-mono">{selectedOrderDetails.customer?.phone}</strong></p>
                <p className="text-slate-400">العنوان: <strong className="text-white">{selectedOrderDetails.deliveryAddress?.details}</strong></p>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl space-y-2">
                <span className="font-bold text-slate-300">الوجبات المحددة:</span>
                {selectedOrderDetails.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-white">x{item.quantity} {item.menuItem?.name}</span>
                    <span className="text-cyan-400 font-bold">{item.price * item.quantity} ر.س</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-sm font-black text-white pt-2">
                <span>الإجمالي الكلي:</span>
                <span className="text-cyan-300">{selectedOrderDetails.totalPrice} ر.س</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrderDetails(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700"
            >
              إغلاق النافذة
            </button>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B192C] border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setEditingOrder(null)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-lg font-extrabold text-white">تعديل طلب #{editingOrder.id.slice(-6).toUpperCase()}</h3>
              <p className="text-xs text-slate-400">تعديل كميات الأصناف وحساب الإجمالي تلقائياً</p>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {editItems.map((item, idx) => (
                <div key={idx} className="bg-slate-900 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-bold text-white">{item.name}</h5>
                    <p className="text-cyan-400 font-extrabold">{item.price * item.quantity} ر.س</p>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg">
                    <button
                      onClick={() => updateEditQuantity(idx, -1)}
                      className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-black text-white px-2">{item.quantity}</span>
                    <button
                      onClick={() => updateEditQuantity(idx, 1)}
                      className="w-6 h-6 rounded bg-cyan-600 flex items-center justify-center text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeEditItem(idx)}
                      className="text-rose-400 hover:text-rose-300 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm">
              <span className="text-slate-400">الإجمالي الجديد:</span>
              <span className="font-black text-cyan-300">
                {editItems.reduce((sum, i) => sum + i.price * i.quantity, 0)} ر.س
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingOrder(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={saveEditedOrder}
                disabled={loadingId === editingOrder.id}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" /> حفظ التغييرات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
