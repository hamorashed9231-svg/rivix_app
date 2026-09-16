export interface BranchDeliverySettings {
  id: string
  name: string
  lat: number
  lng: number
  deliveryRadiusKm?: number
  baseDeliveryFee?: number
  feePerKm?: number
  isActive?: boolean
}

export interface DeliveryCoverageResult {
  isWithinRadius: boolean
  distanceKm: number
  deliveryFee: number
  maxRadiusKm: number
  closestBranchId?: string
  closestBranchName?: string
  reason?: string
}

/**
 * Calculates straight-line distance in kilometers using the Haversine formula.
 */
export function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  if (lat1 === lat2 && lng1 === lng2) return 0

  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  // Return distance rounded to 1 decimal place
  return Math.round(distance * 10) / 10
}

/**
 * Checks if a customer's GPS coordinates are within any active branch's delivery radius,
 * and calculates the exact dynamic delivery fee.
 */
export function calculateDeliveryForCustomer(
  customerLat: number,
  customerLng: number,
  branches: BranchDeliverySettings[]
): DeliveryCoverageResult {
  const activeBranches = branches.filter((b) => b.isActive !== false)

  if (activeBranches.length === 0) {
    return {
      isWithinRadius: false,
      distanceKm: 0,
      deliveryFee: 0,
      maxRadiusKm: 0,
      reason: "لا يوجد فرع نشط للتوصيل حالياً",
    }
  }

  let bestBranch: BranchDeliverySettings | null = null
  let minDistance = Infinity

  for (const branch of activeBranches) {
    const dist = calculateHaversineDistance(customerLat, customerLng, branch.lat, branch.lng)
    if (dist < minDistance) {
      minDistance = dist
      bestBranch = branch
    }
  }

  if (!bestBranch) {
    return {
      isWithinRadius: false,
      distanceKm: 0,
      deliveryFee: 0,
      maxRadiusKm: 0,
      reason: "عذراً، لم نتمكن من تحديد أقرب فرع لموقعك",
    }
  }

  const radiusLimit = bestBranch.deliveryRadiusKm ?? 10.0
  const baseFee = bestBranch.baseDeliveryFee ?? 15.0
  const feePerKm = bestBranch.feePerKm ?? 3.0

  const isWithinRadius = minDistance <= radiusLimit
  const calculatedFee = Math.round((baseFee + minDistance * feePerKm) * 100) / 100

  if (!isWithinRadius) {
    return {
      isWithinRadius: false,
      distanceKm: minDistance,
      deliveryFee: calculatedFee,
      maxRadiusKm: radiusLimit,
      closestBranchId: bestBranch.id,
      closestBranchName: bestBranch.name,
      reason: `عذراً، موقعك الحالي يبعد ${minDistance} كم ويقع خارج نطاق التوصيل المتاح لفرعنا (نطاق التوصيل المتاح: ${radiusLimit} كم)`,
    }
  }

  return {
    isWithinRadius: true,
    distanceKm: minDistance,
    deliveryFee: calculatedFee,
    maxRadiusKm: radiusLimit,
    closestBranchId: bestBranch.id,
    closestBranchName: bestBranch.name,
  }
}
