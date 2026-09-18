import { describe, it, expect } from 'vitest';
import { calculateCouponDiscount } from '../coupon-calculator';

describe('Coupon Validation & Server-side Order Discount Enforcement', () => {
  const percentageCoupon = {
    id: 'coupon-1',
    code: 'RIVIX20',
    discountType: 'percentage' as const,
    discountValue: 20,
    minOrderAmount: 30,
    maxDiscount: null,
    expiresAt: null,
    isActive: true,
    restaurantId: null,
    targetScope: 'order',
    targetMenuItemId: null,
    createdAt: new Date(),
  };

  const fixedCoupon = {
    id: 'coupon-2',
    code: 'WELCOME50',
    discountType: 'fixed' as const,
    discountValue: 50,
    minOrderAmount: 100,
    maxDiscount: null,
    expiresAt: null,
    isActive: true,
    restaurantId: null,
    targetScope: 'order',
    targetMenuItemId: null,
    createdAt: new Date(),
  };

  it('calculates 20% discount correctly when subtotal meets minOrderAmount', () => {
    const subtotal = 100;
    const result = calculateCouponDiscount(percentageCoupon, subtotal);
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(20);
  });

  it('rejects percentage coupon when subtotal is below minOrderAmount (30)', () => {
    const subtotal = 20;
    const result = calculateCouponDiscount(percentageCoupon, subtotal);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('30');
  });

  it('calculates fixed 50 EGP discount correctly when subtotal >= 100', () => {
    const subtotal = 150;
    const result = calculateCouponDiscount(fixedCoupon, subtotal);
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(50);
  });

  it('rejects fixed coupon when subtotal is below minOrderAmount (100)', () => {
    const subtotal = 80;
    const result = calculateCouponDiscount(fixedCoupon, subtotal);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('100');
  });

  it('caps discount amount to subtotal if fixed discount exceeds subtotal', () => {
    const bigFixedCoupon = {
      ...fixedCoupon,
      discountValue: 200,
      minOrderAmount: 50,
    };
    const subtotal = 120;
    const result = calculateCouponDiscount(bigFixedCoupon, subtotal);
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(120); // capped at subtotal
  });
});
