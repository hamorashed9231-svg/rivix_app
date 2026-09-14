"use client"

import React, { useState } from "react"
import dynamic from "next/dynamic"
import Button from "@/components/ui/Button"
import { MapPin, Navigation, X, Check, Store, Phone, Clock } from "lucide-react"

// Dynamically import LocationPickerMap with SSR disabled for Leaflet window object compatibility
const LocationPickerMap = dynamic(
  () => import("./LocationPickerMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-slate-800 animate-pulse rounded-xl flex items-center justify-center text-xs text-slate-400">
        جاري تحميل الخريطة التفاعلية...
      </div>
    ),
  }
)

export interface BranchData {
  id?: string
  restaurantId: string
  name: string
  address: string
  phone: string
  lat: number
  lng: number
  isActive: boolean
  openingHours?: any
}

interface BranchFormProps {
  restaurantId: string
  initialData?: BranchData | null
  onSuccess: (branch: any) => void
  onCancel: () => void
}

export function BranchForm({
  restaurantId,
  initialData,
  onSuccess,
  onCancel,
}: BranchFormProps) {
  const [name, setName] = useState(initialData?.name || "")
  const [address, setAddress] = useState(initialData?.address || "")
  const [phone, setPhone] = useState(initialData?.phone || "")
  const [lat, setLat] = useState<number>(initialData?.lat || 30.0444)
  const [lng, setLng] = useState<number>(initialData?.lng || 31.2357)
  const [isActive, setIsActive] = useState<boolean>(
    initialData?.isActive !== undefined ? initialData.isActive : true
  )
  const [openTime, setOpenTime] = useState(
    initialData?.openingHours?.open || "10:00 AM"
  )
  const [closeTime, setCloseTime] = useState(
    initialData?.openingHours?.close || "12:00 AM"
  )

  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("متصفحك لا يدعم تحديد الموقع الجغرافي (Geolocation)")
      return
    }

    setIsGettingLocation(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude)
        setLng(position.coords.longitude)
        setIsGettingLocation(false)
      },
      (err) => {
        console.error("Geolocation error:", err)
        setError("تعذر تحديد موقعك الحالي. يرجى تفعيل إذن الوصول للموقع أو النقر على الخريطة مباشرة.")
        setIsGettingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !address.trim() || !phone.trim()) {
      setError("يرجى ملء جميع الحقول المطلوبة (اسم الفرع، العنوان، رقم الهاتف)")
      return;
    }

    setError(null)
    setIsSubmitting(true)

    const payload = {
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      lat,
      lng,
      isActive,
      openingHours: { open: openTime, close: closeTime },
    }

    try {
      const url = initialData?.id
        ? `/api/branches/${initialData.id}`
        : `/api/restaurants/${restaurantId}/branches`

      const method = initialData?.id ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "فشل حفظ بيانات الفرع")
      }

      onSuccess(data)
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع أثناء حفظ الفرع")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-right dir-rtl">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold leading-relaxed">
          {error}
        </div>
      )}

      {/* Branch Name */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
          <Store className="w-4 h-4 text-cyan-400" /> اسم الفرع *
        </label>
        <input
          type="text"
          placeholder="مثال: فرع المعادي / الفرع الرئيسي"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
          required
        />
      </div>

      {/* Address & Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-cyan-400" /> العنوان التفصيلي *
          </label>
          <input
            type="text"
            placeholder="مثال: شارع النصر، كاردينال مول"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-cyan-400" /> رقم هاتف الفرع *
          </label>
          <input
            type="text"
            placeholder="01012345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors dir-ltr text-right"
            required
          />
        </div>
      </div>

      {/* Location Picker Header & Current Location Button */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-cyan-400" /> تحديد موقع الفرع على الخريطة *
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGetCurrentLocation}
            isLoading={isGettingLocation}
            className="text-xs"
          >
            <Navigation className="w-3.5 h-3.5" /> تحديد موقعي الحالي
          </Button>
        </div>

        <p className="text-[11px] text-slate-400 mb-2">
          انقر في أي مكان على الخريطة لتحديد موقع الفرع الجغرافي بالضبط، أو اسحب العلامة المكانية.
        </p>

        {/* Leaflet Map */}
        <LocationPickerMap
          lat={lat}
          lng={lng}
          onLocationChange={(newLat, newLng) => {
            setLat(newLat)
            setLng(newLng)
          }}
        />

        {/* Lat & Lng Readout */}
        <div className="grid grid-cols-2 gap-3 mt-2 font-mono text-xs text-slate-400">
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex justify-between items-center">
            <span>Latitude (خط العرض):</span>
            <span className="text-cyan-300 font-bold">{lat.toFixed(6)}</span>
          </div>
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex justify-between items-center">
            <span>Longitude (خط الطول):</span>
            <span className="text-cyan-300 font-bold">{lng.toFixed(6)}</span>
          </div>
        </div>
      </div>

      {/* Hours & Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-cyan-400" /> موعد الفتح
          </label>
          <input
            type="text"
            placeholder="10:00 AM"
            value={openTime}
            onChange={(e) => setOpenTime(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-cyan-400" /> موعد الإغلاق
          </label>
          <input
            type="text"
            placeholder="12:00 AM"
            value={closeTime}
            onChange={(e) => setCloseTime(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Switch for isActive */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            حالة الفرع (نشط)
          </label>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              isActive
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}
          >
            {isActive ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> الفرع نشط ومستقبل للطلبات
              </>
            ) : (
              <>
                <X className="w-4 h-4 text-rose-400" /> الفرع غير نشط
              </>
            )}
          </button>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
        >
          {initialData?.id ? "حفظ التعديلات" : "إضافة الفرع"}
        </Button>
      </div>
    </form>
  )
}
