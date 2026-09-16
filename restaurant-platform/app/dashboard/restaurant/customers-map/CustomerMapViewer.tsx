"use client"

import { useState, useEffect } from "react"
import {
  MapPin,
  User,
  Phone,
  Mail,
  ShoppingBag,
  DollarSign,
  Ban,
  MessageSquare,
  X,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
} from "lucide-react"

interface CustomerMapRecord {
  id: string
  name: string
  email: string
  phone: string
  lat: number
  lng: number
  addressDetails: string
  totalOrders: number
  completedOrders: number
  cancelledOrders: number
  totalSpent: number
  cancellationReasons: { orderId: string; date: string; reason: string }[]
  reviews: { rating: number; comment: string; date: string }[]
}

export function CustomerMapViewer() {
  const [customers, setCustomers] = useState<CustomerMapRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerMapRecord | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCancelledOnly, setFilterCancelledOnly] = useState(false)

  useEffect(() => {
    const fetchCustomerMapData = async () => {
      try {
        const res = await fetch("/api/restaurant/customers-map")
        if (res.ok) {
          const data = await res.json()
          setCustomers(data.customers || [])
        }
      } catch (e) {
        console.error("Failed to load customer map:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchCustomerMapData()
  }, [])

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.addressDetails.toLowerCase().includes(searchQuery.toLowerCase())

    if (filterCancelledOnly) {
      return matchesSearch && c.cancelledOrders > 0
    }
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-cyan-400" /> خريطة استخبارات ومواقع العملاء
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            استعرض مواقع العملاء كعلامات تفاعلية، ومتابعة أسباب الإلغاء والشكاوى لكل عميل.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، الهاتف، أو العنوان..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          {/* Filter Cancelled Orders Only */}
          <button
            type="button"
            onClick={() => setFilterCancelledOnly((prev) => !prev)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              filterCancelledOnly
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-lg shadow-rose-500/10"
                : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>العملاء ذوو الطلبات الملغاة فقط ({customers.filter((c) => c.cancelledOrders > 0).length})</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Map & Pins Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Map Representation */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-3xl p-6 min-h-[500px] relative overflow-hidden flex flex-col justify-between shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              الخريطة التفاعلية لمواقع العملاء ({filteredCustomers.length})
            </span>

            <span className="text-[11px] text-slate-400 font-semibold">
              اضغط على أي دبوس لعرض البيانات الكاملة
            </span>
          </div>

          {/* Map Surface Grid Simulation */}
          <div className="flex-1 my-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex items-center justify-center">
            {/* Grid Pattern Lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />

            {loading ? (
              <div className="text-center text-xs text-slate-400 space-y-2 z-10">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>جاري جلب مواقع العملاء وتحليلات الطلبات...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center text-xs text-slate-400 z-10">
                لا يوجد عملاء يطابقون خيارات البحث حالياً.
              </div>
            ) : (
              <div className="w-full h-full relative">
                {/* Render Small Pins for Each Customer */}
                {filteredCustomers.map((c, index) => {
                  // Project lat/lng slightly for visual grid distribution if same area
                  const topPercent = 20 + ((c.lat * 100) % 60)
                  const rightPercent = 15 + ((c.lng * 100) % 70)

                  const hasCancelled = c.cancelledOrders > 0

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCustomer(c)}
                      style={{ top: `${topPercent}%`, right: `${rightPercent}%` }}
                      className="absolute group transition-transform hover:scale-125 z-10 cursor-pointer"
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg border ${
                          hasCancelled
                            ? "bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse"
                            : "bg-cyan-500/20 border-cyan-400 text-cyan-400"
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>

                      {/* Tooltip on Hover */}
                      <div className="absolute bottom-full mb-1 right-1/2 translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md border border-slate-700 whitespace-nowrap shadow-xl z-30">
                        {c.name} ({c.totalOrders} طلبات)
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-cyan-500/20 border border-cyan-400 inline-block" />
              دبوس أزرق: عميل بدون إلغاءات
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-400 inline-block" />
              دبوس أحمر: عميل لديه طلبات ملغاة
            </span>
          </div>
        </div>

        {/* Customer Sidebar List */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 flex flex-col h-[500px]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="w-4 h-4 text-cyan-400" /> قائمة العملاء ({filteredCustomers.length})
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
            {filteredCustomers.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCustomer(c)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                  selectedCustomer?.id === c.id
                    ? "bg-cyan-500/10 border-cyan-400 text-white"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-white truncate">{c.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {c.totalOrders} طلبات
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 truncate">{c.addressDetails}</p>

                <div className="flex items-center justify-between pt-1 text-[10px]">
                  <span className="text-cyan-400 font-bold">{c.totalSpent} ج.م إجمالي</span>
                  {c.cancelledOrders > 0 && (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <Ban className="w-3 h-3" /> {c.cancelledOrders} ملغاة
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Full Analytics Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 text-right max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-lg font-bold">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">{selectedCustomer.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3 h-3 text-cyan-400" /> {selectedCustomer.phone} |{" "}
                    <Mail className="w-3 h-3 text-cyan-400" /> {selectedCustomer.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 font-bold block">إجمالي الطلبات</span>
                <span className="text-lg font-black text-cyan-400">{selectedCustomer.totalOrders}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 font-bold block">إجمالي الإنفاق</span>
                <span className="text-lg font-black text-emerald-400">{selectedCustomer.totalSpent} ج.م</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 font-bold block">طلبات ملغاة</span>
                <span className="text-lg font-black text-rose-400">{selectedCustomer.cancelledOrders}</span>
              </div>
            </div>

            {/* Address Details */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-400" /> عنوان التوصيل الرئيسي:
              </span>
              <p className="text-slate-400">{selectedCustomer.addressDetails}</p>
            </div>

            {/* Cancellation Reasons History */}
            {selectedCustomer.cancelledOrders > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> سجل أسباب الإلغاء التفصيلية ({selectedCustomer.cancelledOrders}):
                </h4>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {selectedCustomer.cancellationReasons.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-rose-300 font-bold">
                        <span>طلب #{item.orderId.slice(-6).toUpperCase()}</span>
                        <span>{item.date}</span>
                      </div>
                      <p className="text-slate-300 font-semibold">سبب الإلغاء: "{item.reason}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews History */}
            {selectedCustomer.reviews.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" /> التقييمات والملاحظات المتروكة ({selectedCustomer.reviews.length}):
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedCustomer.reviews.map((rev, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-amber-300 font-bold">
                        <span>تقييم: {rev.rating} / 5 ⭐</span>
                        <span>{rev.date}</span>
                      </div>
                      <p className="text-slate-300">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
