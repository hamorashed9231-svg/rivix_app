export interface BranchDeliverySettings {
  id: string;
  name: string;
  lat: number;
  lng: number;
  deliveryEnabled?: boolean;
  deliveryRadiusKm?: number | null;
  baseDeliveryFee?: number | null;
  pricePerKm?: number | null;
  minOrderForDelivery?: number | null;
  isActive?: boolean;
}

export interface DeliveryCoverageResult {
  isWithinRadius: boolean;
  distanceKm: number;
  deliveryFee: number;
  maxRadiusKm: number;
  closestBranchId?: string;
  closestBranchName?: string;
  reason?: string;
}

export interface CouponData {
  id: string;
  code: string;
  isActive: boolean;
  expiresAt?: Date | string | null;
  minOrderAmount: number;
  restaurantId?: string | null;
  discountType: 'percentage' | 'fixed' | string;
  discountValue: number;
  maxDiscount?: number | null;
}

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  discountAmount?: number;
}
