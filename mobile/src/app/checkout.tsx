import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRestaurant } from '@/context/RestaurantContext';
import { useCart } from '@/context/CartContext';

export default function CheckoutScreen() {
  const router = useRouter();
  const { primaryColor } = useRestaurant();
  const { getTotal, getItemCount } = useCart();

  const total = getTotal();
  const count = getItemCount();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backButtonText, { color: primaryColor }]}>← عودة</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إتمام الطلب</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.icon}>⏳</Text>
        <Text style={styles.title}>إتمام الطلب - قريباً</Text>
        <Text style={styles.subtitle}>
          سيتوفر خيار تحديد العنوان وطريقة الدفع وإرسال الطلب في الخطوة القادمة.
        </Text>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>ملخص الطلب الحالي:</Text>
          <Text style={styles.summaryText}>عدد العناصر: {count}</Text>
          <Text style={[styles.summaryTotal, { color: primaryColor }]}>
            الإجمالي: {total} جنيه
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.homeButton, { backgroundColor: primaryColor }]}
          onPress={() => router.replace('/home')}
          activeOpacity={0.8}
        >
          <Text style={styles.homeButtonText}>العودة للمنيو</Text>
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
    flexDirection: 'row-reverse',
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  icon: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  summaryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 6,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#475569',
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  homeButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  homeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
