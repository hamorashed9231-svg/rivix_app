"use client"

import { useState } from "react"
import Image from "next/image"
import {
  Sparkles,
  Flame,
  Tag,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  DollarSign,
  Utensils,
  Search,
  Bell,
  Send,
} from "lucide-react"

interface MenuItem {
  id: string
  name: string
  description?: string | null
  price: number
  originalPrice?: number | null
  image?: string | null
  isAvailable: boolean
  isTopSeller: boolean
  isFeatured: boolean
  badge?: string | null
}

interface MenuCategory {
  id: string
  name: string
  items: MenuItem[]
}

interface CustomizationManagerProps {
  restaurantId: string
  restaurantName: string
  initialBanner: {
    bannerTitle: string
    bannerSubtitle: string
    bannerBadge: string
    bannerActive: boolean
  }
  categories: MenuCategory[]
}

export function CustomizationManagerClient({
  restaurantId,
  restaurantName,
  initialBanner,
  categories,
}: CustomizationManagerProps) {
  // Banner state
  const [banner, setBanner] = useState(initialBanner)

  // Items state (flattened map or array for quick mutations)
  const allItems = categories.flatMap((cat) => cat.items)
  const [itemsMap, setItemsMap] = useState<{ [id: string]: MenuItem }>(() => {
    const map: { [id: string]: MenuItem } = {}
    allItems.forEach((item) => {
      map[item.id] = { ...item }
    })
    return map
  })

  const [saving, setSaving] = useState(false)
  const [notifyOnSave, setNotifyOnSave] = useState(true)
  const [broadcastTitle, setBroadcastTitle] = useState(`🔥 عرض وخصم جديد من ${restaurantName}!`)
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [sendingBroadcast, setSendingBroadcast] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("all")

  // Update item field
  const handleItemChange = (itemId: string, field: keyof MenuItem, value: any) => {
    setItemsMap((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }))
  }

  // Send immediate push notification broadcast
  const handleSendImmediateBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      setErrorMessage("يرجى كتابة عنوان ونص الإشعار قبل الإرسال للعملاء")
      return
    }
    setSendingBroadcast(true)
    setSuccessMessage("")
    setErrorMessage("")
    try {
      const res = await fetch("/api/mobile/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "broadcast",
          restaurantId,
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          type: "offer",
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMessage(data.error || "تعذر إرسال الإشعار")
      } else {
        setSuccessMessage("تم إرسال الإشعار بالعرض/الخصم لجميع العملاء المحملين للتطبيق بنجاح! 🔔🚀")
        setBroadcastMessage("")
        setTimeout(() => setSuccessMessage(""), 6000)
      }
    } catch {
      setErrorMessage("تعذر الاتصال بالخادم لإرسال الإشعار")
    } finally {
      setSendingBroadcast(false)
    }
  }

  // Handle Save to API
  const handleSave = async () => {
    setSaving(true)
    setSuccessMessage("")
    setErrorMessage("")

    try {
      // Prepare item updates
      const itemUpdates = Object.values(itemsMap).map((item) => ({
        id: item.id,
        price: item.price,
        isTopSeller: item.isTopSeller,
        isFeatured: item.isFeatured,
        badge: item.badge,
        originalPrice: item.originalPrice,
      }))

      const res = await fetch(`/api/restaurants/${restaurantId}/customization`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banner,
          itemUpdates,
          notifyCustomers: notifyOnSave,
          notificationTitle: broadcastTitle.trim() || undefined,
          notificationBody: broadcastMessage.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || "حدث خطأ أثناء حفظ التعديلات")
      } else {
        setSuccessMessage(
          notifyOnSave
            ? "تم حفظ الكروت والعروض في شاشة المنيو وإرسال إشعار لجميع محملي التطبيق بنجاح! 🔔🚀"
            : "تم حفظ إعدادات وتخصيصات واجهة العميل بنجاح! 🚀"
        )
        setTimeout(() => setSuccessMessage(""), 5000)
      }
    } catch (err) {
      setErrorMessage("تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى")
    } finally {
      setSaving(false)
    }
  }

  // Filter items
  const filteredItems = Object.values(itemsMap).filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))

    if (!matchesSearch) return false
    if (activeCategoryFilter === "all") return true
    if (activeCategoryFilter === "top_sellers") return item.isTopSeller
    if (activeCategoryFilter === "special_offers") return item.isFeatured || (item.originalPrice && item.originalPrice > item.price)

    const parentCat = categories.find((c) => c.items.some((i) => i.id === item.id))
    return parentCat?.id === activeCategoryFilter
  })

  // Counters
  const topSellersCount = Object.values(itemsMap).filter((i) => i.isTopSeller).length
  const featuredOffersCount = Object.values(itemsMap).filter(
    (i) => i.isFeatured || (i.originalPrice && i.originalPrice > i.price)
  ).length

  return (
    <div className="space-y-8">
      {/* Top Header & Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Sliders className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-white">
              التحكم في واجهة العميل والعروض — {restaurantName}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            بإمكان الأونر ومدير الكول سنتر التحكم بما يظهر للعملاء في الصفحة الرئيسية، كالبانرات الترويجية وقسم الأكثر طلباً والعروض الخاصة.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Save className="w-4 h-4" />
          {saving ? "جاري الحفظ..." : "حفظ التغييرات في الواجهة 💾"}
        </button>
      </div>

      {/* Alert Banners */}
      {successMessage && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-xs font-bold text-emerald-400 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4 text-xs font-bold text-rose-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Section 1: Promotional Banner Setup & Live Preview */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" /> البانر الترويجي في واجهة العميل
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200">تفعيل ظهور البانر في الواجهة</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={banner.bannerActive}
                  onChange={(e) => setBanner({ ...banner, bannerActive: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                نص الشارة الترويجية (Badge)
              </label>
              <input
                type="text"
                placeholder="مثال: خصم حصري 30% 🔥"
                value={banner.bannerBadge}
                onChange={(e) => setBanner({ ...banner, bannerBadge: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                العنوان الرئيسي للبانر
              </label>
              <input
                type="text"
                placeholder="مثال: أشهى وجبات ومشويات على أصولها 🚀"
                value={banner.bannerTitle}
                onChange={(e) => setBanner({ ...banner, bannerTitle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                الوصف الفرعي
              </label>
              <input
                type="text"
                placeholder="مثال: خصم خاص للطلبات اليومية مع توصيل سريع حتى باب منزلك!"
                value={banner.bannerSubtitle}
                onChange={(e) => setBanner({ ...banner, bannerSubtitle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-3">
              <Eye className="w-4 h-4 text-cyan-400" /> معاينة حية لشكل البانر عند العميل:
            </div>

            {banner.bannerActive ? (
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0B192C] via-slate-900 to-cyan-500/20 p-6 border border-cyan-500/30 shadow-2xl space-y-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-cyan-400 text-slate-950 uppercase tracking-widest">
                  <Sparkles className="w-3 h-3 fill-slate-950" /> {banner.bannerBadge || "عرض خاص"}
                </span>
                <h3 className="text-lg font-black text-white leading-tight">
                  {banner.bannerTitle || "أشهى الوجبات والمشويات بأقصى سرعة توصيل 🚀"}
                </h3>
                <p className="text-xs text-slate-300">
                  {banner.bannerSubtitle || "استمتع بألذ الأطباق مع العروض الخاصة اليومية!"}
                </p>
              </div>
            ) : (
              <div className="h-32 border-2 border-dashed border-slate-800 rounded-2xl flex items-center justify-center text-xs text-slate-500">
                البانر معطل حالياً ولن يظهر للعملاء في الواجهة
              </div>
            )}

            <div className="text-[11px] text-slate-500 mt-4 text-center">
              يظهر هذا البانر في أعلى شاشة الموبايل وصفحة المنيو للعملاء لجذب الانتباه وزيادة المبيعات.
            </div>
          </div>
        </div>
      </div>

      {/* Section 1.5: Broadcast Offer/Discount Notification to All App Users */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border border-amber-500/30 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" /> إرسال إشعار عرض أو خصم لكل محملي التطبيق 🔔
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              يمكن لمدير الكول سنتر أو مالك المطعم إرسال إشعار فوري يظهر لكل العملاء الذين قاموا بتحميل البرنامج بعرض جديد أو خصم خاص.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={notifyOnSave}
              onChange={(e) => setNotifyOnSave(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700"
            />
            <span>إرسال إشعار تلقائياً عند حفظ العروض</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">عنوان الإشعار</label>
            <input
              type="text"
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              placeholder={`🔥 عرض وخصم جديد من ${restaurantName}!`}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">نص الإشعار للعملاء</label>
            <input
              type="text"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="مثال: خصم 25% اليوم على جميع المشويات والوجبات! اطلب الآن 🔥"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="button"
            onClick={handleSendImmediateBroadcast}
            disabled={sendingBroadcast}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {sendingBroadcast ? "جاري إرسال الإشعار..." : "إرسال الإشعار لكل العملاء الآن 🔔"}
          </button>
        </div>
      </div>

      {/* Section 2: Items Control (Top Sellers & Special Offers Carousel Cards) */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" /> التحكم في الكروت الكبيرة المتحركة أعلى شاشة المنيو (الأكثر مبيعاً & العروض والخصومات)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              الأصناف المحددة هنا تظهر في كروت كبيرة متحركة (يمين ويسار) في أعلى شاشة المنيو عند العميل، ويمكن لمدير الكول سنتر أو الأونر تحديدها وتعديل أسعار الخصم الخاصة بها.
            </p>
          </div>

          {/* Stat Badges */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> الأكثر مبيعاً ({topSellersCount})
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-black flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-rose-400" /> العروض والخصومات ({featuredOffersCount})
            </span>
          </div>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar text-xs font-bold">
            <button
              onClick={() => setActiveCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeCategoryFilter === "all"
                  ? "bg-cyan-500 text-slate-950 font-black"
                  : "bg-slate-900 text-slate-300 border border-slate-800"
              }`}
            >
              الكل ({allItems.length})
            </button>
            <button
              onClick={() => setActiveCategoryFilter("top_sellers")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeCategoryFilter === "top_sellers"
                  ? "bg-amber-400 text-slate-950 font-black"
                  : "bg-slate-900 text-slate-300 border border-slate-800"
              }`}
            >
              🔥 كروت الأكثر مبيعاً ({topSellersCount})
            </button>
            <button
              onClick={() => setActiveCategoryFilter("special_offers")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeCategoryFilter === "special_offers"
                  ? "bg-rose-500 text-white font-black"
                  : "bg-slate-900 text-slate-300 border border-slate-800"
              }`}
            >
              🏷️ كروت العروض والخصومات ({featuredOffersCount})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                  activeCategoryFilter === cat.id
                    ? "bg-cyan-500 text-slate-950 font-black"
                    : "bg-slate-900 text-slate-300 border border-slate-800"
                }`}
              >
                {cat.name} ({cat.items.length})
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="بحث عن صنف بالاسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
          </div>
        </div>

        {/* Items Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const hasDiscount = item.originalPrice && item.originalPrice > item.price
            const discountPct = hasDiscount
              ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100)
              : null

            return (
              <div
                key={item.id}
                className={`bg-slate-900/90 border rounded-3xl p-4 space-y-3.5 transition-all shadow-lg ${
                  item.isTopSeller
                    ? "border-amber-500/50 shadow-amber-950/20 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20"
                    : item.isFeatured || hasDiscount
                    ? "border-rose-500/50 shadow-rose-950/20 bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/20"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Item Header */}
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-950 overflow-hidden relative shrink-0 border border-slate-800">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <Utensils className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-extrabold text-white truncate">{item.name}</h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-normal">
                      {item.description || "طبق شهي ومميز"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-black text-cyan-400">{item.price} ج.م</span>
                      {hasDiscount && (
                        <span className="text-[10px] text-slate-500 line-through">
                          {item.originalPrice} ج.م
                        </span>
                      )}
                      {discountPct && (
                        <span className="px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-black">
                          خصم {discountPct}% 🔥
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Toggles & Options */}
                <div className="pt-2 border-t border-slate-800 space-y-2.5 text-xs">
                  {/* Toggle: Top Seller */}
                  <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-xl hover:bg-slate-800/50 transition-colors">
                    <span className="flex items-center gap-1.5 font-bold text-slate-200">
                      <Flame className="w-3.5 h-3.5 text-amber-400" /> كارت «الأكثر مبيعاً» أعلى المنيو
                    </span>
                    <input
                      type="checkbox"
                      checked={item.isTopSeller}
                      onChange={(e) => handleItemChange(item.id, "isTopSeller", e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-950 border-slate-700 cursor-pointer"
                    />
                  </label>

                  {/* Toggle: Featured / Special Offer */}
                  <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-xl hover:bg-slate-800/50 transition-colors">
                    <span className="flex items-center gap-1.5 font-bold text-slate-200">
                      <Tag className="w-3.5 h-3.5 text-rose-400" /> كارت «العروض والخصومات» أعلى المنيو
                    </span>
                    <input
                      type="checkbox"
                      checked={item.isFeatured}
                      onChange={(e) => handleItemChange(item.id, "isFeatured", e.target.checked)}
                      className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400 bg-slate-950 border-slate-700 cursor-pointer"
                    />
                  </label>

                  {/* Current Price (Discounted / Selling Price) */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] font-bold text-cyan-300">السعر الحالي (بعد الخصم):</span>
                    <div className="relative w-28">
                      <input
                        type="number"
                        value={item.price ?? ""}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "price",
                            e.target.value ? parseFloat(e.target.value) : 0
                          )
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-cyan-300 font-bold text-left focus:outline-none focus:border-cyan-400"
                      />
                      <span className="text-[9px] text-slate-500 absolute left-2 top-1.5">ج.م</span>
                    </div>
                  </div>

                  {/* Original Price (for Discount calculation) */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-400">السعر قبل الخصم:</span>
                    <div className="relative w-28">
                      <input
                        type="number"
                        placeholder="بدون خصم"
                        value={item.originalPrice || ""}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "originalPrice",
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white text-left placeholder-slate-600 focus:outline-none focus:border-rose-400"
                      />
                      <span className="text-[9px] text-slate-500 absolute left-2 top-1.5">ج.م</span>
                    </div>
                  </div>

                  {/* Custom Badge Text */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-400">شارة على الكارت:</span>
                    <input
                      type="text"
                      placeholder="مثال: عرض اليوم 🔥"
                      value={item.badge || ""}
                      onChange={(e) => handleItemChange(item.id, "badge", e.target.value)}
                      className="w-36 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-400 space-y-2">
            <Utensils className="w-8 h-8 text-slate-600 mx-auto" />
            <p>لم يتم العثور على أصناف تطابق الفلتر أو البحث الحالي.</p>
          </div>
        )}
      </div>

      {/* Floating Bottom Quick Save Bar */}
      <div className="sticky bottom-4 z-40 bg-slate-950/90 border border-slate-800 backdrop-blur-xl p-4 rounded-3xl flex items-center justify-between gap-4 shadow-2xl">
        <div className="text-xs text-slate-300">
          عند الحفظ ستظهر الكروت المتحركة فوراً في أعلى شاشة المنيو للعملاء {notifyOnSave ? "وسيتم إشعار محملي التطبيق بالعرض الجديد 🔔" : ""}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Save className="w-4 h-4" />
          {saving ? "جاري الحفظ..." : "حفظ الكروت والعروض الآن 💾"}
        </button>
      </div>
    </div>
  )
}
