import { describe, it, expect } from 'vitest'
import { calculateCouponDiscount, CouponData } from '../coupon-calculator'

describe('Coupon Calculation Unit Tests', () => {
  const baseCoupon: CouponData = {
    id: 'coupon-1',
    code: 'SAVE20',
    isActive: true,
    minOrderAmount: 100,
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 50,
  }

  it('rejects inactive coupons', () => {
    const inactive = { ...baseCoupon, isActive: false }
    const res = calculateCouponDiscount(inactive, 200)
    expect(res.valid).toBe(false)
    expect(res.error).toBe('كود الخصم غير صالح أو ملغى')
  })

  it('rejects expired coupons', () => {
    const expired = { ...baseCoupon, expiresAt: new Date(Date.now() - 100000) }
    const res = calculateCouponDiscount(expired, 200)
    expect(res.valid).toBe(false)
    expect(res.error).toBe('انتهت صلاحية كود الخصم هذا')
  })

  it('rejects orders below minimum amount', () => {
    const res = calculateCouponDiscount(baseCoupon, 50)
    expect(res.valid).toBe(false)
    expect(res.error).toContain('الحد الأدنى لاستخدام هذا الكوبون هو 100 ج.م')
  })

  it('calculates percentage discount accurately up to max discount limit', () => {
    // 20% of 200 = 40 (under max 50)
    const res1 = calculateCouponDiscount(baseCoupon, 200)
    expect(res1.valid).toBe(true)
    expect(res1.discountAmount).toBe(40)

    // 20% of 400 = 80 -> capped at max 50
    const res2 = calculateCouponDiscount(baseCoupon, 400)
    expect(res2.valid).toBe(true)
    expect(res2.discountAmount).toBe(50)
  })

  it('calculates fixed discount accurately', () => {
    const fixedCoupon: CouponData = {
      ...baseCoupon,
      discountType: 'fixed',
      discountValue: 30,
    }
    const res = calculateCouponDiscount(fixedCoupon, 150)
    expect(res.valid).toBe(true)
    expect(res.discountAmount).toBe(30)
  })

  it('enforces restaurant specific coupon restriction', () => {
    const restaurantCoupon: CouponData = {
      ...baseCoupon,
      restaurantId: 'rest-specific-123',
    }
    const resMismatch = calculateCouponDiscount(restaurantCoupon, 200, 'rest-other-456')
    expect(resMismatch.valid).toBe(false)
    expect(resMismatch.error).toBe('هذا الكوبون غير مخصص لطلبات هذا المطعم')

    const resMatch = calculateCouponDiscount(restaurantCoupon, 200, 'rest-specific-123')
    expect(resMatch.valid).toBe(true)
    expect(resMatch.discountAmount).toBe(40)
  })
})
