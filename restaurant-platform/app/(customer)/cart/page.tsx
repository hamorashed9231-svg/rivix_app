"use client"

import { useState } from "react"
import { useCart } from "@/components/CartProvider"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ShoppingBag, ArrowLeft, CheckCircle, Clock, Sparkles, Tag, Check } from "lucide-react"

export default function CartPage() {
  const { items, updateQuantity, clearCart, totalPrice, restaurantId, restaurantName } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<any | null>(null)
  const [error, setError] = useState("")

  // Coupon state
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [couponMessage, setCouponMessage] = useState("")

  const handleApplyCoupon = async () => {
    if (!couponCode) return
    setValidatingCoupon(true)
    setCouponMessage("")

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          subtotal: totalPrice,
          restaurantId,
        }),
      })

      const data = await res.json()

      if (res.ok && data.valid) {
        setAppliedCoupon(data.coupon)
        setDiscountAmount(data.coupon.discountAmount)
        setCouponMessage(data.message)
      } else {
        setAppliedCoupon(null)
        setDiscountAmount(0)
        setCouponMessage(data.error || "كود الخصم غير صالح")
      }
    } catch (err) {
      setCouponMessage("حدث خطأ أثناء فحص الكود")
    } finally {
      setValidatingCoupon(false)
    }
  }

  const finalTotal = Math.max(0, totalPrice + 15 - discountAmount)

  const handleConfirmOrder = async () => {
    if (!restaurantId || items.length === 0) return
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/customer/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          items: items.map((i) => ({
            id: i.id,
            quantity: i.quantity,
            price: i.price,
          })),
          totalPrice: finalTotal,
          discountAmount,
          couponId: appliedCoupon?.id || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "حدث خطأ أثناء إرسال الطلب")
      } else {
        setCreatedOrder(data.order)
        clearCart()
      }
    } catch (err) {
      setError("حدث خطأ أثناء الاتصال بالخادم")
    } finally {
      setSubmitting(false)
    }
  }

  // Order Success Screen
  if (createdOrder) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto">
        <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 animate-bounce shadow-2xl shadow-emerald-500/20">
          <CheckCircle className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" /> تم إرسال الطلب بنجاح!
          </span>
          <h2 className="text-2xl font-black text-white">شكراً لطلبك من {restaurantName}</h2>
          <p className="text-xs text-slate-400">تم استلام طلبك وبانتظار موافقة موظف الاستقبال فوراً.</p>
        </div>

        <div className="w-full bg-[#0B192C] border border-slate-800 rounded-2xl p-4 space-y-3 text-xs text-right">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-slate-400">رقم الطلب المرجعي:</span>
            <span className="font-mono font-extrabold text-cyan-400 text-sm">#{createdOrder.id.slice(-6).toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-slate-400">الحالة الحالية:</span>
            <span className="font-bold text-amber-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> قيد الانتظار 🟡
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">إجمالي المبلغ المدفوع:</span>
            <span className="font-black text-white text-sm">{createdOrder.totalPrice} ر.س</span>
          </div>
        </div>

        <Link
          href="/"
          className="w-full py-4 rounded-2xl bg-cyan-500 text-slate-950 font-black text-xs shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2"
        >
          <span>العودة للرئيسية وتصفح المزيد</span>
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  // Empty Cart Screen
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-extrabold text-white">السلة فارغة حالياً</h2>
        <p className="text-xs text-slate-400 max-w-xs">تصفح المطاعم المتاحة وأضف أشهى الوجبات لتجربة طلب فورية ومميزة.</p>
        <Link
          href="/"
          className="px-6 py-3 rounded-2xl bg-cyan-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20"
        >
          تصفح المطاعم الآن
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 max-w-md mx-auto space-y-6 pb-28">
      {/* Top Bar */}
      <div className="flex items-center justify-between pt-2">
        <Link href="/" className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-white">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-black text-white">سلة التسوق</h1>
        <button onClick={clearCart} className="text-xs font-semibold text-rose-400 hover:text-rose-300">
          مسح السلة
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300 text-center font-bold">
          {error}
        </div>
      )}

      {/* Restaurant Header */}
      <div className="bg-[#0B192C] border border-cyan-500/30 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-cyan-400 font-bold uppercase">الطلب من مطعم</span>
          <h3 className="font-extrabold text-white text-base">{restaurantName}</h3>
        </div>
        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
          <CheckCircle className="w-5 h-5" />
        </div>
      </div>

      {/* Cart Items List */}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-[#0B192C] border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-slate-900 overflow-hidden relative border border-slate-800 shrink-0">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">{item.name}</h4>
                <p className="text-xs font-black text-cyan-400 mt-1">{item.price * item.quantity} ر.س</p>
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => updateQuantity(item.id, -1)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 text-xs font-bold"
              >
                -
              </button>
              <span className="text-xs font-black text-white w-4 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, 1)}
                className="w-7 h-7 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-xs"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Promo Code Coupon Section */}
      <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Tag className="w-4 h-4 text-cyan-400" />
          <span>هل لديك كود خصم أو كوبون؟</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="أدخل الكود (مثال: RIVIX20)"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-xs font-mono uppercase text-white focus:outline-none focus:border-cyan-400"
          />
          <button
            onClick={handleApplyCoupon}
            disabled={validatingCoupon || !couponCode}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-colors disabled:opacity-50"
          >
            {validatingCoupon ? "فحص..." : "تطبيق"}
          </button>
        </div>

        {couponMessage && (
          <p className={`text-xs font-bold ${appliedCoupon ? "text-emerald-400" : "text-rose-400"}`}>
            {couponMessage}
          </p>
        )}
      </div>

      {/* Bill Summary */}
      <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>مجموع الوجبات</span>
          <span className="text-white font-bold">{totalPrice} ر.س</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-emerald-400 font-bold">
            <span>الخصم المطبق ({appliedCoupon?.code})</span>
            <span>-{discountAmount} ر.س</span>
          </div>
        )}

        <div className="flex justify-between text-slate-400">
          <span>رسوم التوصيل السريع</span>
          <span className="text-emerald-400 font-bold">15.00 ر.س</span>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-black text-white">
          <span>المبلغ الإجمالي</span>
          <span className="text-cyan-400 text-lg">{finalTotal} ر.س</span>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={handleConfirmOrder}
        disabled={submitting}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-black text-sm shadow-2xl shadow-cyan-500/30 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50"
      >
        <span>{submitting ? "جاري إرسال الطلب للموظف..." : "تأكيد الطلب والدفع (إرسال)"}</span>
        <ArrowLeft className="w-5 h-5" />
      </button>
    </div>
  )
}
