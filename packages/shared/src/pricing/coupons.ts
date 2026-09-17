import { CouponData, CouponValidationResult, CartItemForDiscount } from '../types/index';

export function calculateCouponDiscount(
  coupon: CouponData,
  subtotal: number,
  targetRestaurantId?: string | null,
  cartItems?: CartItemForDiscount[]
): CouponValidationResult {
  if (!coupon.isActive) {
    return { valid: false, error: 'كود الخصم غير صالح أو ملغى' };
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, error: 'انتهت صلاحية كود الخصم هذا' };
  }

  if (subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      error: `الحد الأدنى لاستخدام هذا الكوبون هو ${coupon.minOrderAmount} ج.م`,
    };
  }

  if (coupon.restaurantId && targetRestaurantId && coupon.restaurantId !== targetRestaurantId) {
    return { valid: false, error: 'هذا الكوبون غير مخصص لطلبات هذا المطعم' };
  }

  let applicableSubtotal = subtotal;

  // Item-level targeted coupon check
  if (coupon.targetScope === 'item' && coupon.targetMenuItemId) {
    if (!cartItems || cartItems.length === 0) {
      return { valid: false, error: 'هذا الكوبون ينطبق على صنف محدد غير موجود في سلتك' };
    }

    const targetedItems = cartItems.filter(
      (item) => item.menuItemId === coupon.targetMenuItemId
    );

    if (targetedItems.length === 0) {
      return { valid: false, error: 'الصنف المخصص لهذا الكوبون غير موجود في عربة تسوقك' };
    }

    applicableSubtotal = targetedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = applicableSubtotal * (coupon.discountValue / 100);
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else {
    discountAmount = Math.min(coupon.discountValue, applicableSubtotal);
  }

  return {
    valid: true,
    discountAmount: Math.round(discountAmount * 100) / 100,
    targetScope: coupon.targetScope || 'order',
    targetMenuItemId: coupon.targetMenuItemId,
  };
}
