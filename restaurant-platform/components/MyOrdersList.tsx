"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  ShoppingBag, 
  Clock, 
  RotateCcw, 
  Truck, 
  UtensilsCrossed, 
  MapPin, 
  ArrowRight,
  Star
} from "lucide-react"
import { useCart, CartItem } from "./CartProvider"
import { ReviewModal } from "./ReviewModal"

interface OrderItem {
  id: string
  quantity: number
  price: number
  menuItem: {
    id: string
    name: string
    image?: string | null
  }
}

interface Order {
  id: string
  status: string
  totalPrice: number
  createdAt: string
  branch?: {
    restaurant?: {
      id: string
      name: string
      logo?: string | null
    }
  }
  deliveryAddress?: {
    details?: string
  }
  items: OrderItem[]
}

export function MyOrdersList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")
  const [reorderingId, setReorderingId] = useState<string | null>(null)
  const [activeReviewOrder, setActiveReviewOrder] = useState<{ id: string; name: string } | null>(null)
  
  const { replaceCart } = useCart()
  const router = useRouter()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/customer/orders")
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (e) {
      console.error("Failed to fetch customer orders:", e)
    } finally {
      setLoading(false)
    }
  }

  const handleReorder = (order: Order) => {
    setReorderingId(order.id)

    const restaurantId = order.branch?.restaurant?.id || "default-rest"
    const restaurantName = order.branch?.restaurant?.name || "المطعم"

    const cartItems: CartItem[] = order.items.map((item) => ({
      id: item.menuItem.id,
      name: item.menuItem.name,
      price: item.price,
      image: item.menuItem.image,
      restaurantId,
      restaurantName,
      quantity: item.quantity,
    }))

    // Load items into cart
    replaceCart(cartItems)

    setTimeout(() => {
      setReorderingId(null)
      router.push("/cart")
    }, 400)
  }

  const filteredOrders = orders.filter((order) => {
    const isActive = ["pending", "accepted", "preparing", "ready", "out_for_delivery"].includes(order.status)
    if (filter === "active") return isActive
    if (filter === "completed") return !isActive
    return true
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "بانتظار الموافقة 🟡", style: "bg-amber-500/10 text-amber-300 border-amber-500/30" }
      case "accepted":
      case "preparing":
        return { label: "جاري التجهيز بالمطعم 🔵", style: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30 animate-pulse" }
      case "ready":
        return { label: "جاهز للاستلام 📦", style: "bg-blue-500/10 text-blue-300 border-blue-500/30" }
      case "out_for_delivery":
        return { label: "المندوب في الطريق 🚚", style: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 animate-pulse" }
      case "delivered":
        return { label: "تم التسليم بنجاح 🏁", style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" }
      case "cancelled":
        return { label: "تم إلغاء الطلب ❌", style: "bg-rose-500/10 text-rose-400 border-rose-500/30" }
      default:
        return { label: "جاري المعالجة", style: "bg-slate-800 text-slate-300 border-slate-700" }
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 py-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-cyan-400" /> سجل طلباتي (Order History)
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">تابع طلباتك الحية وأعد طلب وجباتك المفضلة بنقرة واحدة</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setFilter("all")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === "all"
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          الكل ({orders.length})
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === "active"
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          الطلبات الحية
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === "completed"
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          السابقة والملغاة
        </button>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-[#0B192C]/50 border border-slate-800 rounded-3xl p-8 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">لا توجد طلبات في هذا القسم</h3>
            <p className="text-xs text-slate-400">تصفح المنيو واطلب الآن أشهى الوجبات من مطاعم RIVIX</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-sm hover:brightness-110 shadow-lg shadow-cyan-500/20 transition-all"
          >
            تصفح المطاعم والمنيو 🚀
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const badge = getStatusBadge(order.status)
            const isActive = ["pending", "accepted", "preparing", "ready", "out_for_delivery"].includes(order.status)

            return (
              <div
                key={order.id}
                className="bg-[#0B192C] border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 space-y-4 shadow-xl transition-all"
              >
                {/* Header info */}
                <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-extrabold text-base">
                        {order.branch?.restaurant?.name || "مطعم RIVIX"}
                      </span>
                      <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded font-mono font-bold">
                        #{order.id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(order.createdAt).toLocaleString("ar-SA", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badge.style}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Items Summary */}
                <div className="space-y-2">
                  <div className="bg-slate-900/80 p-3 rounded-xl space-y-1.5 border border-slate-800/60">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs">
                        <span className="text-slate-200 font-medium">
                          x{item.quantity} {item.menuItem.name}
                        </span>
                        <span className="text-slate-400 font-mono">
                          {(item.price * item.quantity).toFixed(2)} ج.م
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.deliveryAddress?.details && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 px-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">عنوان التوصيل: {order.deliveryAddress.details}</span>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-[11px] text-slate-400 block">إجمالي الطلب:</span>
                    <span className="text-lg font-black text-cyan-400">{order.totalPrice.toFixed(2)} ج.م</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Live Track Link for Active Orders */}
                    {isActive && (
                      <Link
                        href={`/orders/${order.id}/track`}
                        className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/10"
                      >
                        <Truck className="w-4 h-4" /> تتبع الطلب
                      </Link>
                    )}

                    {/* Rate Experience Button */}
                    {order.status === "delivered" && (
                      <button
                        onClick={() =>
                          setActiveReviewOrder({
                            id: order.id,
                            name: order.branch?.restaurant?.name || "المطعم",
                          })
                        }
                        className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
                      >
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> تقييم التجربة
                      </button>
                    )}

                    {/* 1-Click Re-Order Button */}
                    <button
                      onClick={() => handleReorder(order)}
                      disabled={reorderingId === order.id}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
                    >
                      <RotateCcw className={`w-4 h-4 ${reorderingId === order.id ? "animate-spin" : ""}`} />
                      {reorderingId === order.id ? "جاري الإضافة..." : "إعادة الطلب 🔄"}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={!!activeReviewOrder}
        onClose={() => setActiveReviewOrder(null)}
        orderId={activeReviewOrder?.id || ""}
        restaurantName={activeReviewOrder?.name || ""}
        onSubmitted={fetchOrders}
      />
    </div>
  )
}
