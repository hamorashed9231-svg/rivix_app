import { BranchDeliverySettings, DeliveryCoverageResult } from '../types/index';

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}

export interface BranchWithLocation {
  id: string;
  name: string;
  lat?: number | null;
  lng?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  deliveryEnabled?: boolean;
  deliveryRadiusKm?: number | null;
  pricePerKm?: number | null;
  baseDeliveryFee?: number | null;
  isActive?: boolean;
}

export function findNearestDeliverableBranch<T extends BranchWithLocation>(
  customerLat: number,
  customerLng: number,
  branches: T[]
): { branch: T; distanceKm: number } | null {
  const eligible = branches
    .filter((b) => b.deliveryEnabled !== false && b.deliveryRadiusKm != null && b.isActive !== false)
    .map((b) => {
      const bLat = b.lat ?? b.latitude ?? 0;
      const bLng = b.lng ?? b.longitude ?? 0;
      const distanceKm = haversineKm(customerLat, customerLng, bLat, bLng);
      return { branch: b, distanceKm };
    })
    .filter((x) => x.distanceKm <= (x.branch.deliveryRadiusKm ?? 0))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return eligible[0] ?? null;
}

export function calculateDeliveryFee(
  distanceKm: number,
  branch: { baseDeliveryFee?: number | null; pricePerKm?: number | null }
): number {
  const base = branch.baseDeliveryFee ?? 0;
  const perKm = branch.pricePerKm ?? 0;
  return Math.round((base + distanceKm * perKm) * 100) / 100;
}

export function calculateDeliveryForCustomer(
  customerLat: number,
  customerLng: number,
  branches: BranchDeliverySettings[]
): DeliveryCoverageResult {
  const activeBranches = branches.filter((b) => b.isActive !== false && b.deliveryEnabled !== false);

  if (activeBranches.length === 0) {
    return {
      isWithinRadius: false,
      distanceKm: 0,
      deliveryFee: 0,
      maxRadiusKm: 0,
      reason: 'لا يوجد فرع نشط للتوصيل حالياً',
    };
  }

  const result = findNearestDeliverableBranch(customerLat, customerLng, activeBranches);

  if (!result) {
    let closestBranch: BranchDeliverySettings | null = null;
    let minDist = Infinity;

    for (const b of activeBranches) {
      const dist = haversineKm(customerLat, customerLng, b.lat, b.lng);
      if (dist < minDist) {
        minDist = dist;
        closestBranch = b;
      }
    }

    const radiusLimit = closestBranch?.deliveryRadiusKm ?? 10.0;
    const fee = closestBranch ? calculateDeliveryFee(minDist, closestBranch) : 0;

    return {
      isWithinRadius: false,
      distanceKm: minDist === Infinity ? 0 : minDist,
      deliveryFee: fee,
      maxRadiusKm: radiusLimit,
      closestBranchId: closestBranch?.id,
      closestBranchName: closestBranch?.name,
      reason: closestBranch
        ? `عذراً، موقعك الحالي يبعد ${minDist} كم ويقع خارج نطاق التوصيل المتاح لفرعنا (نطاق التوصيل المتاح: ${radiusLimit} كم)`
        : 'عذراً، لم نتمكن من تحديد أقرب فرع لموقعك',
    };
  }

  const { branch: bestBranch, distanceKm } = result;
  const calculatedFee = calculateDeliveryFee(distanceKm, bestBranch);
  const radiusLimit = bestBranch.deliveryRadiusKm ?? 10.0;

  return {
    isWithinRadius: true,
    distanceKm,
    deliveryFee: calculatedFee,
    maxRadiusKm: radiusLimit,
    closestBranchId: bestBranch.id,
    closestBranchName: bestBranch.name,
  };
}
