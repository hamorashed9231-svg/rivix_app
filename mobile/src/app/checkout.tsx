import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRestaurant } from '@/context/RestaurantContext';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';

export default function CheckoutScreen() {
  const router = useRouter();
  const { primaryColor } = useRestaurant();
  const { getTotal, getItemCount, clearCart } = useCart();
  const { t, isRTL } = useLanguage();

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'vodafone' | 'instapay'>('cash');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const total = getTotal();
  const count = getItemCount();

  const handlePlaceOrder = () => {
    setIsSubmitted(true);
    clearCart();
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
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            📍 {t('deliveryAddress')}
          </Text>
          <View style={styles.addressBox}>
            <Text style={[styles.addressText, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'العنوان الرئيسي (المنزل - الإسكندرية)' : 'Main Address (Home - Alexandria)'}
            </Text>
          </View>
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
            <Text style={styles.summaryLabel}>{t('deliveryFee')}:</Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>{t('freeDelivery')}</Text>
          </View>

          <View style={[styles.divider]} />

          <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.totalLabel}>{t('total')}:</Text>
            <Text style={[styles.totalValue, { color: primaryColor }]}>
              {total} {t('currency')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, { backgroundColor: primaryColor }]}
          onPress={handlePlaceOrder}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmButtonText}>{t('confirmOrder')}</Text>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  addressBox: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 10,
  },
  addressText: {
    fontSize: 14,
    color: '#334155',
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
});
