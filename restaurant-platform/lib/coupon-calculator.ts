export interface CouponData {
  id: string
  code: string
  isActive: boolean
  expiresAt?: Date | string | null
  minOrderAmount: number
  restaurantId?: string | null
  discountType: 'percentage' | 'fixed' | string
  discountValue: number
  maxDiscount?: number | null
}

export interface CouponValidationResult {
  valid: boolean
  error?: string
  discountAmount?: number
}

export function calculateCouponDiscount(
  coupon: CouponData,
  subtotal: number,
  targetRestaurantId?: string | null
): CouponValidationResult {
  if (!coupon.isActive) {
    return { valid: false, error: 'كود الخصم غير صالح أو ملغى' }
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, error: 'انتهت صلاحية كود الخصم هذا' }
  }

  if (subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      error: `الحد الأدنى لاستخدام هذا الكوبون هو ${coupon.minOrderAmount} ج.م`,
    }
  }

  if (coupon.restaurantId && targetRestaurantId && coupon.restaurantId !== targetRestaurantId) {
    return { valid: false, error: 'هذا الكوبون غير مخصص لطلبات هذا المطعم' }
  }

  let discountAmount = 0
  if (coupon.discountType === 'percentage') {
    discountAmount = subtotal * (coupon.discountValue / 100)
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount
    }
  } else {
    discountAmount = coupon.discountValue
  }

  return {
    valid: true,
    discountAmount: Math.round(discountAmount * 100) / 100,
  }
}
