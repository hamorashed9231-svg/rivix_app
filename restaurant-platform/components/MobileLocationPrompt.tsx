"use client"

import { useState } from "react"
import { MapPin, Navigation, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export function MobileLocationPrompt() {
  const [loading, setLoading] = useState(false)
  const [locationText, setLocationText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("خاصية تحديد الموقع غير مدعومة في متصفحك")
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const loc = `حي الملقا (${latitude.toFixed(2)}, ${longitude.toFixed(2)}) 🎯`
        setLocationText(loc)
        setLoading(false)
        try {
          localStorage.setItem("rivix_user_lat", latitude.toString())
          localStorage.setItem("rivix_user_lng", longitude.toString())
        } catch (e) {}
      },
      (err) => {
        setLoading(false)
        if (err.code === err.PERMISSION_DENIED) {
          setError("تم رفض إذن الوصول للموقع، يرجى سماح الموقع في إعدادات الهاتف.")
        } else {
          setError("تعذر الحصول على الموقع الحقيقي حالياً.")
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="bg-[#0B192C] border border-cyan-500/30 rounded-2xl p-3.5 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
          <MapPin className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-medium block">تحديد عنوان التوصيل الحقيقي</span>
          <p className="font-bold text-white text-xs truncate max-w-[170px]">
            {locationText || "اضغط لتفعيل الـ GPS 📍"}
          </p>
        </div>
      </div>

      <button
        onClick={handleGetLocation}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all shadow-md shrink-0 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : locationText ? (
          <CheckCircle className="w-3.5 h-3.5" />
        ) : (
          <Navigation className="w-3.5 h-3.5 fill-slate-950" />
        )}
        <span>{loading ? "جاري التحديد..." : locationText ? "محدد" : "تحديد موقعي"}</span>
      </button>
    </div>
  )
}
