"use client"

import { useState } from "react"
import { Tag, Plus, CheckCircle, Sparkles, Bell, Send } from "lucide-react"

export function CouponManager({ initialCoupons }: { initialCoupons: any[] }) {
  const [coupons, setCoupons] = useState<any[]>(initialCoupons)
  const [showAddForm, setShowAddForm] = useState(false)

  const [code, setCode] = useState("")
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState("")
  const [minOrderAmount, setMinOrderAmount] = useState("")
  const [maxDiscount, setMaxDiscount] = useState("")
  const [targetScope, setTargetScope] = useState<"order" | "menu" | "item">("order")
  const [sendNotification, setSendNotification] = useState(true)
  const [notificationBody, setNotificationBody] = useState("")
  const [loading, setLoading] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [noticeMsg, setNoticeMsg] = useState("")

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || !discountValue) return
    setLoading(true)
    setNoticeMsg("")

    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discountType,
          discountValue,
          minOrderAmount,
          maxDiscount,
          targetScope,
          sendNotification,
          notificationBody: notificationBody.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setCoupons([data.coupon, ...coupons])
        setCode("")
        setDiscountValue("")
        setMinOrderAmount("")
        setMaxDiscount("")
        setNotificationBody("")
        setTargetScope("order")
        setShowAddForm(false)
        setNoticeMsg(
          sendNotification
            ? "تم إنشاء كود الخصم وإرسال إشعار فوري لجميع محملي التطبيق بنجاح! 🔔🎉"
            : "تم إنشاء كود الخصم بنجاح!"
        )
      } else {
        alert(data.error || "حدث خطأ أثناء إضافة الكوبون")
      }
    } catch (err) {
      alert("حدث خطأ في الاتصال")
    } finally {
      setLoading(false)
    }
  }

  const handleBroadcastExistingCoupon = async (c: any) => {
    setSendingId(c.id)
    setNoticeMsg("")
    try {
      const discountLabel = c.discountType === "percentage" ? `${c.discountValue}%` : `${c.discountValue} ج.م`
      const restName = c.restaurant?.name || "مطعمنا"
      const res = await fetch("/api/mobile/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "broadcast",
          restaurantId: c.restaurantId || undefined,
          type: "coupon",
          couponCode: c.code,
          title: `🎉 خصم خاص من ${restName}!`,
          message: `استخدم كود الخصم (${c.code}) واحصل على خصم ${discountLabel} على طلبك الآن! 🔥`,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setNoticeMsg(`تم إرسال إشعار بكود الخصم (${c.code}) لجميع محملي التطبيق بنجاح! 🔔`)
      } else {
        alert(data.error || "تعذر إرسال الإشعار")
      }
    } catch {
      alert("تعذر الاتصال بالخادم")
    } finally {
      setSendingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Action */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Tag className="w-5 h-5 text-cyan-400" />
          أكواد الخصم المفعلة ({coupons.length})
        </h2>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> إنشاء عرض / كود خصم جديد
        </button>
      </div>

      {noticeMsg && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-xs font-bold text-emerald-400 flex items-center gap-2">
          <Bell className="w-4 h-4 shrink-0" />
          <span>{noticeMsg}</span>
        </div>
      )}

      {/* Create Coupon Form */}
      {showAddForm && (
        <form onSubmit={handleCreateCoupon} className="bg-[#0B192C] border border-cyan-500/40 rounded-2xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-sm">بيانات كود الخصم وإشعار العملاء</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">كود الخصم (رمز الترويج)</label>
              <input
                type="text"
                placeholder="مثال: RIVIX20"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 px-3 py-2.5 rounded-lg text-white font-mono text-sm uppercase focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">نطاق تطبيق الخصم</label>
              <select
                value={targetScope}
                onChange={(e: any) => setTargetScope(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 px-3 py-2.5 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-400 font-bold"
              >
                <option value="order">على إجمالي الطلب بالكامل (Full Order Subtotal)</option>
                <option value="menu">على المنيو ككل لمطعم محدد (Entire Restaurant Menu)</option>
                <option value="item">على صنف محدد في المنيو (Specific Menu Item)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">نوع الخصم</label>
              <select
                value={discountType}
                onChange={(e: any) => setDiscountType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 px-3 py-2.5 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="percentage">نسبة مئوية (%)</option>
                <option value="fixed">مبلغ ثابت (ج.م)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">قيمة الخصم ({discountType === "percentage" ? "%" : "ج.م"})</label>
              <input
                type="number"
                step="0.5"
                placeholder={discountType === "percentage" ? "مثال: 20" : "مثال: 30"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 px-3 py-2.5 rounded-lg text-white font-bold text-xs focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">الحد الأدنى لقيمة الطلب (ج.م)</label>
              <input
                type="number"
                placeholder="مثال: 50 (0 لعدم التحديد)"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 px-3 py-2.5 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">رسالة الإشعار للعملاء (اختياري)</label>
              <input
                type="text"
                placeholder="اتركه فارغاً لإنشاء نص الإشعار تلقائياً باسم الكود وقيمة الخصم"
                value={notificationBody}
                onChange={(e) => setNotificationBody(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 px-3 py-2.5 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 rounded-xl">
              <input
                type="checkbox"
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-950 border-slate-700"
              />
              <Bell className="w-4 h-4 text-amber-400" />
              <span>إرسال إشعار فوري بالعرض/الخصم لكل محملي التطبيق 🔔</span>
            </label>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {loading ? "جاري الحفظ والإرسال..." : "حفظ وتفعيل وإرسال الإشعار"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Coupons Table */}
      <div className="bg-[#0B192C] border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm text-slate-300">
            <thead className="bg-slate-900/60 text-slate-400 uppercase text-xs border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">كود الخصم</th>
                <th className="px-4 py-3">قيمة الخصم</th>
                <th className="px-4 py-3">الحد الأدنى للطلب</th>
                <th className="px-4 py-3">تطبيق الكوبون</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">إشعار العملاء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-4 font-mono font-extrabold text-cyan-400 text-base">{c.code}</td>
                  <td className="px-4 py-4 font-bold text-white">
                    {c.discountValue} {c.discountType === "percentage" ? "%" : "ج.م"}
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-300">{c.minOrderAmount} ج.م</td>
                  <td className="px-4 py-4 text-xs text-slate-400">
                    {c.restaurant ? c.restaurant.name : "شامل كافة مطاعم المنصة 🌐"}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle className="w-3.5 h-3.5" /> مفعل
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => handleBroadcastExistingCoupon(c)}
                      disabled={sendingId === c.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      {sendingId === c.id ? "جاري الإرسال..." : "إرسال إشعار للعملاء 🔔"}
                    </button>
                  </td>
                </tr>
              ))}

              {coupons.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-500 italic">
                    لا توجد أكواد خصم مضافة بعد. اضغط على إنشاء عرض / كود خصم جديد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

