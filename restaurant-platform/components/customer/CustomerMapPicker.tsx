"use client"

import React, { useState, useEffect, useCallback } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Search, MapPin, Loader2 } from "lucide-react"

// Fix Leaflet default marker icons in Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

interface CustomerMapPickerProps {
  initialLat?: number
  initialLng?: number
  onAddressSelect: (data: { address: string; lat: number; lng: number }) => void
}

function MapEventsHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 15)
    }
  }, [lat, lng, map])
  return null
}

export default function CustomerMapPicker({
  initialLat = 24.7136,
  initialLng = 46.6753,
  onAddressSelect,
}: CustomerMapPickerProps) {
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng])
  const [addressDetails, setAddressDetails] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false)
  const [isSearching, setIsSearching] = useState<boolean>(false)

  // Nominatim Reverse Geocoding (lat, lng -> formatted address)
  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      setIsGeocoding(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`
        )
        if (res.ok) {
          const data = await res.json()
          const formatted = data.display_name || `إحداثيات: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
          setAddressDetails(formatted)
          onAddressSelect({ address: formatted, lat, lng })
        }
      } catch (err) {
        console.error("Nominatim Reverse Geocode Error:", err)
        const fallback = `إحداثيات التوصيل: (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        setAddressDetails(fallback)
        onAddressSelect({ address: fallback, lat, lng })
      } finally {
        setIsGeocoding(false)
      }
    },
    [onAddressSelect]
  )

  const handleLocationChange = (lat: number, lng: number) => {
    setPosition([lat, lng])
    reverseGeocode(lat, lng)
  }

  // Nominatim Search (Address String -> lat, lng)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&accept-language=ar&limit=1`
      )
      if (res.ok) {
        const results = await res.json()
        if (results && results.length > 0) {
          const newLat = parseFloat(results[0].lat)
          const newLng = parseFloat(results[0].lon)
          handleLocationChange(newLat, newLng)
        } else {
          alert("لم نتمكن من العثور على العنوان المدخل، يرجى تحريك الدبوس على الخريطة")
        }
      }
    } catch (err) {
      console.error("Nominatim Search Error:", err)
    } finally {
      setIsSearching(false)
    }
  }

  // Attempt HTML5 Geolocation API on mount
  useEffect(() => {
    if (navigator.geolocation && !initialLat) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handleLocationChange(pos.coords.latitude, pos.coords.longitude)
        },
        () => {
          handleLocationChange(initialLat, initialLng)
        }
      )
    } else {
      reverseGeocode(initialLat, initialLng)
    }
  }, [])

  return (
    <div className="space-y-3">
      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن الحي أو الشارع..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "بحث"}
        </button>
      </form>

      {/* Leaflet Interactive Map */}
      <div className="w-full h-64 rounded-2xl overflow-hidden border border-slate-800 relative z-0 shadow-inner">
        <MapContainer
          center={position}
          zoom={14}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={position}
            draggable={true}
            eventHandlers={{
              dragend(e) {
                const marker = e.target
                const pos = marker.getLatLng()
                handleLocationChange(pos.lat, pos.lng)
              },
            }}
          />
          <MapEventsHandler onLocationChange={handleLocationChange} />
          <RecenterMap lat={position[0]} lng={position[1]} />
        </MapContainer>
      </div>

      {/* Address Confirmation Display */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-start gap-2 text-xs">
        <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-slate-400 font-bold block">العنوان المحدد من الخريطة:</span>
          {isGeocoding ? (
            <span className="text-slate-400 italic flex items-center gap-1.5 mt-0.5">
              <Loader2 className="w-3 h-3 animate-spin text-cyan-400" /> جاري تجميع تفاصيل العنوان...
            </span>
          ) : (
            <p className="text-white font-medium mt-0.5 leading-relaxed">{addressDetails}</p>
          )}
        </div>
      </div>
    </div>
  )
}
