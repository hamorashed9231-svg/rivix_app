import { api } from '@/services/api';

export interface AppliedCouponData {
  id?: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  minOrderAmount?: number;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: AppliedCouponData;
  message?: string;
  error?: string;
}

export const validateCouponCode = async (
  code: string,
  subtotal: number,
  restaurantId?: string,
  cartItems?: any[]
): Promise<CouponValidationResult> => {
  if (!code || !code.trim()) {
    return {
      valid: false,
      error: 'يرجى إدخال كود الخصم أولاً',
    };
  }

  try {
    const response = await api.post('/api/coupons/validate', {
      code: code.trim(),
      subtotal,
      restaurantId,
      cartItems,
    });

    if (response.data?.valid) {
      return {
        valid: true,
        coupon: response.data.coupon,
        message: response.data.message || 'تم تطبيق الخصم بنجاح',
      };
    } else {
      return {
        valid: false,
        error: response.data?.error || 'كود الخصم غير صالح',
      };
    }
  } catch (err: any) {
    const errorMsg =
      err.response?.data?.error || err.message || 'حدث خطأ أثناء فحص كود الخصم';
    return {
      valid: false,
      error: errorMsg,
    };
  }
};
