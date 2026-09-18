import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useRestaurant } from '@/context/RestaurantContext';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { fetchUserAddresses, UserAddress } from '@/services/user';
import { createCustomerOrder } from '@/services/orders';
import { calculateDeliveryForCustomer, isInvalidLocation } from '@/services/delivery';
import { validateCouponCode } from '@/services/coupon';

export default function CheckoutScreen() {
  const router = useRouter();
  const { restaurant, branches, primaryColor } = useRestaurant();
  const {
    items,
    getTotal,
    getItemCount,
    clearCart,
    appliedCoupon,
    discountAmount,
    couponCode,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const { t, language, isRTL } = useLanguage();

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'vodafone' | 'instapay'>('cash');
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState<string>(couponCode || '');
  const [validatingCoupon, setValidatingCoupon] = useState<boolean>(false);

  useEffect(() => {
    if (couponCode) {
      setCouponInput(couponCode);
    }
  }, [couponCode]);

  const subtotal = getTotal();
  const count = getItemCount();

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      Alert.alert(
        language === 'ar' ? 'تنبيه' : 'Validation',
        language === 'ar' ? 'يرجى إدخال كود الخصم أولاً' : 'Please enter a coupon code.'
      );
      return;
    }

    setValidatingCoupon(true);
    const result = await validateCouponCode(
      couponInput,
      subtotal,
      restaurant?.id,
      items
    );
    setValidatingCoupon(false);

    if (result.valid && result.coupon) {
      applyCoupon(result.coupon, result.coupon.discountAmount || 0, couponInput.trim());
      Alert.alert(
        language === 'ar' ? 'تم تطبيق الخصم' : 'Coupon Applied',
        result.message || (language === 'ar' ? 'تم تطبيق الخصم بنجاح' : 'Coupon applied successfully!')
      );
    } else {
      Alert.alert(
        language === 'ar' ? 'كود غير صالح' : 'Invalid Coupon',
        result.error || (language === 'ar' ? 'كود الخصم غير صالح' : 'Coupon code is invalid')
      );
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponInput('');
  };

  useEffect(() => {
    async function loadData() {
      setLoadingAddresses(true);
      const list = await fetchUserAddresses();
      setAddresses(list);
      if (list.length > 0) {
        setSelectedAddress(list[0]);
      }
      setLoadingAddresses(false);
    }
    loadData();
  }, []);

  // Calculate delivery fee dynamically based on selected address & active branch
  const isAddressInvalid = !selectedAddress || isInvalidLocation(selectedAddress.lat, selectedAddress.lng);
  
  const deliveryResult = (!isAddressInvalid && selectedAddress && branches.length > 0)
    ? calculateDeliveryForCustomer(selectedAddress.lat, selectedAddress.lng, branches)
    : null;

  const deliveryFee = deliveryResult?.isWithinRadius ? deliveryResult.deliveryFee : 0;
  const isDeliverable = deliveryResult?.isWithinRadius ?? false;
  const finalTotal = Math.max(0, subtotal - discountAmount) + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!selectedAddress || isAddressInvalid) {
      Alert.alert(
        language === 'ar' ? 'تحديد الموقع مطلوب' : 'Location Required',
        language === 'ar'
          ? 'من فضلك حدد موقعك على الخريطة لحساب رسوم التوصيل'
          : 'Please pick your location on the map to calculate delivery fees.',
        [
          {
            text: language === 'ar' ? 'تحديد الموقع الآن' : 'Set Location Now',
            onPress: () => router.push('/profile/addresses'),
          },
          { text: language === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    if (!isDeliverable) {
      Alert.alert(
        language === 'ar' ? 'خارج نطاق التوصيل' : 'Out of Delivery Range',
        deliveryResult?.reason || (language === 'ar' ? 'عذراً، موقعك يقع خارج نطاق التوصيل المتاح' : 'Address outside delivery zone')
      );
      return;
    }

    setSubmitting(true);
    const orderItems = items.map((item) => ({
      id: item.id,
      menuItemId: item.id,
      quantity: item.quantity,
      price: item.price,
      notes: item.notes,
    }));

    const response = await createCustomerOrder({
      restaurantId: restaurant?.id || '',
      items: orderItems,
      totalPrice: finalTotal,
      deliveryAddressId: selectedAddress.id,
      deliveryAddressDetails: selectedAddress.details,
      customerLat: selectedAddress.lat,
      customerLng: selectedAddress.lng,
      paymentMethod,
      couponCode: appliedCoupon?.code,
    });

    setSubmitting(false);

    if (response.success) {
      setIsSubmitted(true);
      clearCart();
    } else {
      Alert.alert(
        language === 'ar' ? 'خطأ في الطلب' : 'Order Error',
        response.error || (language === 'ar' ? 'حدث خطأ أثناء إرسال الطلب' : 'Failed to place order')
      );
    }
  };

  if (isSubmitted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successTitle}>{t('orderSuccessTitle')}</Text>
          <Text style={styles.successSubtitle}>{t('orderSuccessMessage')}</Text>

          <TouchableOpacity
            style={[styles.homeButton, { backgroundColor: primaryColor }]}
            onPress={() => router.replace('/home')}
            activeOpacity={0.85}
          >
            <Text style={styles.homeButtonText}>{t('backToHome')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backButtonText, { color: primaryColor }]}>
            {isRTL ? '← عودة' : '← Back'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('checkoutTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Delivery Address Section */}
        <View style={styles.sectionCard}>
          <View style={[styles.sectionHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.sectionTitle}>📍 {t('deliveryAddress')}</Text>
            <TouchableOpacity onPress={() => router.push('/profile/addresses')}>
              <Text style={[styles.changeAddrText, { color: primaryColor }]}>
                {language === 'ar' ? '+ تغيير / إضافة' : '+ Change / Add'}
              </Text>
            </TouchableOpacity>
          </View>

          {loadingAddresses ? (
            <ActivityIndicator color={primaryColor} />
          ) : addresses.length === 0 ? (
            <TouchableOpacity
              style={styles.warningBox}
              onPress={() => router.push('/profile/addresses')}
            >
              <Text style={styles.warningBoxText}>
                ⚠️ {language === 'ar' ? 'لا يوجد عنوان محفوظ. اضغط هنا لإضافة عنوانك وموقعك على الخريطة' : 'No saved address. Tap here to add your location.'}
              </Text>
            </TouchableOpacity>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.addressListScroll}>
              {addresses.map((addr) => {
                const isSelected = selectedAddress?.id === addr.id;
                const isInvalid = isInvalidLocation(addr.lat, addr.lng);
                return (
                  <TouchableOpacity
                    key={addr.id}
                    style={[
                      styles.addressCardChip,
                      isSelected && { borderColor: primaryColor, backgroundColor: '#F0F9FF' },
                      isInvalid && { borderColor: '#EF4444', backgroundColor: '#FEF2F2' }
                    ]}
                    onPress={() => setSelectedAddress(addr)}
                  >
                    <Text style={styles.addressChipLabel}>
                      {addr.label} {isInvalid ? '⚠️' : '📍'}
                    </Text>
                    <Text style={styles.addressChipDetails} numberOfLines={2}>
                      {addr.details}
                    </Text>
                    {isInvalid && (
                      <Text style={styles.invalidBadgeText}>
                        {language === 'ar' ? 'يتطلب تحديد الموقع' : 'Requires map location'}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {isAddressInvalid && (
            <TouchableOpacity
              style={styles.invalidAlertBanner}
              onPress={() => router.push('/profile/addresses')}
            >
              <Text style={styles.invalidAlertText}>
                ⚠️ {language === 'ar' ? 'من فضلك حدد موقعك على الخريطة لحساب رسوم التوصيل' : 'Please pick your location on the map to calculate delivery fees'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Method Section */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            💳 {t('paymentMethod')}
          </Text>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'cash' && { borderColor: primaryColor, backgroundColor: '#F0F9FF' },
              { flexDirection: isRTL ? 'row-reverse' : 'row' }
            ]}
            onPress={() => setPaymentMethod('cash')}
          >
            <Text style={styles.paymentRadio}>{paymentMethod === 'cash' ? '🔘' : '⚪'}</Text>
            <Text style={styles.paymentLabel}>💵 {t('cashOnDelivery')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'vodafone' && { borderColor: primaryColor, backgroundColor: '#F0F9FF' },
              { flexDirection: isRTL ? 'row-reverse' : 'row' }
            ]}
            onPress={() => setPaymentMethod('vodafone')}
          >
            <Text style={styles.paymentRadio}>{paymentMethod === 'vodafone' ? '🔘' : '⚪'}</Text>
            <Text style={styles.paymentLabel}>📱 {t('vodafoneCash')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'instapay' && { borderColor: primaryColor, backgroundColor: '#F0F9FF' },
              { flexDirection: isRTL ? 'row-reverse' : 'row' }
            ]}
            onPress={() => setPaymentMethod('instapay')}
          >
            <Text style={styles.paymentRadio}>{paymentMethod === 'instapay' ? '🔘' : '⚪'}</Text>
            <Text style={styles.paymentLabel}>⚡ {t('instaPay')}</Text>
          </TouchableOpacity>
        </View>

        {/* Coupon Discount Section */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            🏷️ {language === 'ar' ? 'كود الخصم / الكوبون' : 'Coupon Code'}
          </Text>

          {appliedCoupon ? (
            <View style={[styles.appliedCouponRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.appliedCouponCode}>🎉 {appliedCoupon.code}</Text>
                <Text style={styles.appliedCouponDiscount}>
                  {language === 'ar' ? 'تم تطبيق خصم بقيمة:' : 'Discount:'} -{discountAmount} {t('currency')}
                </Text>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon} style={styles.removeCouponBtn}>
                <Text style={styles.removeCouponText}>{language === 'ar' ? 'إزالة' : 'Remove'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.couponInputRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TextInput
                style={[styles.couponInput, { textAlign: isRTL ? 'right' : 'left' }]}
                placeholder={language === 'ar' ? 'أدخل كود الخصم (مثال: RIVIX20)' : 'Enter coupon code (e.g. RIVIX20)'}
                value={couponInput}
                onChangeText={setCouponInput}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.applyCouponBtn, { backgroundColor: primaryColor }]}
                onPress={handleApplyCoupon}
                disabled={validatingCoupon}
              >
                {validatingCoupon ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.applyCouponBtnText}>
                    {language === 'ar' ? 'تطبيق' : 'Apply'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Order Summary Section */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            📄 {t('orderSummary')}
          </Text>

          <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.summaryLabel}>{t('itemsCount')}:</Text>
            <Text style={styles.summaryValue}>{count}</Text>
          </View>

          <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.summaryLabel}>{t('subtotal') || 'المجموع الفرعي'}:</Text>
            <Text style={styles.summaryValue}>{subtotal} {t('currency')}</Text>
          </View>

          {discountAmount > 0 ? (
            <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.summaryLabel, { color: '#10B981', fontWeight: 'bold' }]}>
                {language === 'ar' ? 'خصم الكوبون:' : 'Coupon Discount:'}
              </Text>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                -{discountAmount} {t('currency')}
              </Text>
            </View>
          ) : null}

          <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.summaryLabel}>{t('deliveryFee')}:</Text>
            <Text style={[styles.summaryValue, { color: isAddressInvalid ? '#EF4444' : primaryColor }]}>
              {isAddressInvalid
                ? (language === 'ar' ? 'مطلوب تحديد الموقع' : 'Location required')
                : isDeliverable
                ? `${deliveryFee} ${t('currency')}`
                : (language === 'ar' ? 'خارج نطاق التوصيل' : 'Out of range')}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.totalLabel}>{t('total')}:</Text>
            <Text style={[styles.totalValue, { color: primaryColor }]}>
              {finalTotal} {t('currency')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            { backgroundColor: (isAddressInvalid || !isDeliverable) ? '#94A3B8' : primaryColor }
          ]}
          onPress={handlePlaceOrder}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>{t('confirmOrder')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  backButton: {},
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  changeAddrText: {
    fontSize: 13,
    fontWeight: '600',
  },
  addressListScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  addressCardChip: {
    width: 200,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 4,
  },
  addressChipLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  addressChipDetails: {
    fontSize: 12,
    color: '#64748B',
  },
  invalidBadgeText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 4,
  },
  warningBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  warningBoxText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
  invalidAlertBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
  },
  invalidAlertText: {
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  paymentOption: {
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  paymentRadio: {
    fontSize: 16,
  },
  paymentLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  summaryRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  confirmButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  homeButton: {
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
  },
  homeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  couponInputRow: {
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#F8FAFC',
  },
  applyCouponBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyCouponBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  appliedCouponRow: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  appliedCouponCode: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#065F46',
  },
  appliedCouponDiscount: {
    fontSize: 13,
    color: '#047857',
    marginTop: 2,
  },
  removeCouponBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  removeCouponText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
