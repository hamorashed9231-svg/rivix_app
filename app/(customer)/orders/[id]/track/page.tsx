"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  Truck, 
  PackageCheck, 
  Phone, 
  MapPin, 
  UserCheck, 
  RefreshCw,
  ShoppingBag,
  Navigation
} from "lucide-react"

const STEPS = [
  { step: 1, label: "تم استلام الطلب", icon: Clock },
  { step: 2, label: "جاري التجهيز", icon: CheckCircle2 },
  { step: 3, label: "جاهز للتسليم", icon: PackageCheck },
  { step: 4, label: "في الطريق إليك", icon: Truck },
  { step: 5, label: "تم التوصيل", icon: CheckCircle2 },
]

export default function MobileOrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [trackData, setTrackData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTrackData = async () => {
    try {
      const res = await fetch(`/api/orders/${id}/track`)
      if (res.ok) {
        const data = await res.json()
        setTrackData(data)
      }
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrackData()
    const interval = setInterval(fetchTrackData, 6000)
    return () => clearInterval(interval)
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-xs font-bold text-slate-400">جاري تحميل شاشة تتبع الطلب...</p>
      </div>
    )
  }

  if (!trackData || !trackData.order) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
        <ShoppingBag className="w-12 h-12 text-slate-600" />
        <h2 className="text-lg font-bold text-white">لم يتم العثور على الطلب</h2>
        <Link href="/" className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs">
          العودة للرئيسية
        </Link>
      </div>
    )
  }

  const { order, stepIndex, statusLabel, driverInfo } = trackData

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 max-w-md mx-auto space-y-6 pb-24">
      {/* Top Bar */}
      <div className="flex items-center justify-between pt-2">
        <Link href="/" className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-white">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div className="text-center">
          <span className="text-[10px] text-slate-400">تتبع حالة الطلب</span>
          <h1 className="text-sm font-mono font-extrabold text-cyan-400">#{order.id.slice(-6).toUpperCase()}</h1>
        </div>
        <button onClick={fetchTrackData} className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Status Header Card */}
      <div className="bg-gradient-to-br from-[#0B192C] via-slate-900 to-[#0091FF]/20 border border-cyan-500/30 rounded-3xl p-6 space-y-3 shadow-2xl text-center">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
          {statusLabel}
        </span>
        <h2 className="text-2xl font-black text-white">
          {stepIndex === 4 ? `يصل خلال ${driverInfo.estimatedMinutes} دقيقة ⏱️` : order.branch?.restaurant?.name}
        </h2>
        <p className="text-xs text-slate-300">يتم التحديث التلقائي الفوري لمراحل الطلب وموقع المندوب</p>
      </div>

      {/* 5-Step Visual Timeline Progress Bar */}
      <div className="bg-[#0B192C] border border-slate-800 rounded-3xl p-5 space-y-5 shadow-xl">
        <h3 className="text-xs font-extrabold text-slate-300">مراحل تنفيذ الطلب:</h3>

        <div className="space-y-4 relative">
          {STEPS.map((s, idx) => {
            const Icon = s.icon
            const isDone = stepIndex >= s.step
            const isCurrent = stepIndex === s.step

            return (
              <div key={s.step} className="flex items-center gap-3.5 relative">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                    isCurrent
                      ? "bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/20 shadow-lg shadow-cyan-500/30 scale-110"
                      : isDone
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-slate-900 text-slate-600 border border-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1">
                  <h4 className={`text-xs font-bold ${isDone ? "text-white" : "text-slate-500"}`}>
                    {s.label}
                  </h4>
                  {isCurrent && <p className="text-[10px] text-cyan-400 font-medium mt-0.5 animate-pulse">جاري التنفيذ حالياً...</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Driver Card (If On Way / Active) */}
      {(stepIndex === 4 || stepIndex === 3) && (
        <div className="bg-[#0B192C] border border-cyan-500/40 rounded-3xl p-5 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">{driverInfo.driverName}</h4>
                <p className="text-[11px] text-slate-400">{driverInfo.vehicle}</p>
              </div>
            </div>

            <a
              href={`tel:${driverInfo.driverPhone}`}
              className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform"
            >
              <Phone className="w-5 h-5 fill-slate-950" />
            </a>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-2xl flex items-center justify-between text-xs border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-cyan-400" /> موقع المندوب الحقيقي (GPS):
            </span>
            <span className="font-mono text-cyan-300 font-bold">{driverInfo.lat}, {driverInfo.lng}</span>
          </div>
        </div>
      )}

      {/* Delivery Address & Order Summary */}
      <div className="bg-[#0B192C] border border-slate-800 rounded-3xl p-5 space-y-3 text-xs">
        <div className="flex items-center gap-2 text-white font-bold border-b border-slate-800 pb-2">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <span>عنوان التوصيل المعتمد:</span>
        </div>
        <p className="text-slate-300">{order.deliveryAddress?.details || "الرياض - حي الملقا"}</p>

        <div className="pt-2 border-t border-slate-800 space-y-1">
          <span className="font-bold text-slate-400">الوجبات في هذا الطلب ({order.items?.length}):</span>
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex justify-between text-slate-300 py-1">
              <span>x{item.quantity} {item.menuItem?.name}</span>
              <span className="font-bold text-white">{item.price * item.quantity} ر.س</span>
            </div>
          ))}
          <div className="flex justify-between font-black text-cyan-400 text-sm pt-2 border-t border-slate-800">
            <span>الإجمالي الكلي:</span>
            <span>{order.totalPrice} ر.س</span>
          </div>
        </div>
      </div>
    </div>
  )
}
