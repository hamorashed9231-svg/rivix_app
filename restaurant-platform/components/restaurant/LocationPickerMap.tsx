"use client"

import React, { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix Leaflet marker icons in Next.js
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

interface LocationPickerMapProps {
  lat: number
  lng: number
  deliveryRadiusKm?: number
  deliveryEnabled?: boolean
  onLocationChange: (lat: number, lng: number) => void
}

function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
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
      map.setView([lat, lng], map.getZoom())
    }
  }, [lat, lng, map])
  return null
}

export default function LocationPickerMap({
  lat,
  lng,
  deliveryRadiusKm,
  deliveryEnabled = true,
  onLocationChange,
}: LocationPickerMapProps) {
  const position: [number, number] = [lat || 30.0444, lng || 31.2357] // Fallback coordinates

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden border border-slate-700 relative z-0">
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {deliveryEnabled && deliveryRadiusKm && deliveryRadiusKm > 0 ? (
          <Circle
            center={position}
            radius={deliveryRadiusKm * 1000}
            pathOptions={{ color: "#06b6d4", fillColor: "#06b6d4", fillOpacity: 0.15 }}
          />
        ) : null}
        <Marker
          position={position}
          draggable={true}
          eventHandlers={{
            dragend(e) {
              const marker = e.target
              const pos = marker.getLatLng()
              onLocationChange(pos.lat, pos.lng)
            },
          }}
        />
        <MapClickHandler onLocationChange={onLocationChange} />
        <RecenterMap lat={position[0]} lng={position[1]} />
      </MapContainer>
    </div>
  )
}
