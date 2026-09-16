import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRestaurant } from '@/context/RestaurantContext';
import { useLanguage } from '@/context/LanguageContext';
import { fetchCustomerOrders, OrderDetails } from '@/services/orders';

export default function MyOrdersScreen() {
  const router = useRouter();
  const { primaryColor } = useRestaurant();
  const { language, isRTL } = useLanguage();

  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadOrders = async () => {
    const data = await fetchCustomerOrders();
    setOrders(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getStatusBadge = (status: string) => {
    let label = status;
    let bg = '#E2E8F0';
    let textColor = '#334155';

    switch (status) {
      case 'pending':
        label = language === 'ar' ? 'قيد الانتظار' : 'Pending';
        bg = '#FEF3C7';
        textColor = '#D97706';
        break;
      case 'accepted':
        label = language === 'ar' ? 'تم القبول' : 'Accepted';
        bg = '#DBEAFE';
        textColor = '#2563EB';
        break;
      case 'preparing':
        label = language === 'ar' ? 'جاري التحضير' : 'Preparing';
        bg = '#F3E8FF';
        textColor = '#9333EA';
        break;
      case 'ready':
        label = language === 'ar' ? 'جاهز للتسليم' : 'Ready';
        bg = '#DCFCE7';
        textColor = '#16A34A';
        break;
      case 'out_for_delivery':
        label = language === 'ar' ? 'خرج للتوصيل' : 'Out for Delivery';
        bg = '#E0E7FF';
        textColor = '#4F46E5';
        break;
      case 'delivered':
        label = language === 'ar' ? 'تم التوصيل' : 'Delivered';
        bg = '#D1FAE5';
        textColor = '#059669';
        break;
      case 'cancelled':
        label = language === 'ar' ? 'ملغي' : 'Cancelled';
        bg = '#FEE2E2';
        textColor = '#DC2626';
        break;
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
      </View>
    );
  };

  const renderOrderItem = ({ item }: { item: OrderDetails }) => {
    const dateStr = new Date(item.createdAt).toLocaleDateString(
      language === 'ar' ? 'ar-EG' : 'en-US',
      { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    );

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/orders/${item.id}` as any)}
        activeOpacity={0.8}
      >
        <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.orderId}>#{item.id.slice(-6).toUpperCase()}</Text>
          {getStatusBadge(item.status)}
        </View>

        <View style={styles.cardDivider} />

        <View style={[styles.cardRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.branchName}>
            {item.branch?.name || (language === 'ar' ? 'المطعم' : 'Restaurant')}
          </Text>
          <Text style={styles.totalPrice}>
            {item.totalPrice} {language === 'ar' ? 'ج.م' : 'EGP'}
          </Text>
        </View>

        <View style={[styles.cardFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.dateText}>{dateStr}</Text>
          <Text style={[styles.detailsLink, { color: primaryColor }]}>
            {language === 'ar' ? 'التفاصيل والتتبع ←' : 'Details & Track →'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={primaryColor} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: primaryColor, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{language === 'ar' ? 'طلباتي' : 'My Orders'}</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primaryColor]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                {language === 'ar' ? 'لا توجد طلبات بعد' : 'No orders yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {language === 'ar'
                  ? 'قم بإجراء طلبك الأول من المنيو الآن!'
                  : 'Place your first order from our menu now!'}
              </Text>
              <TouchableOpacity
                style={[styles.shopButton, { backgroundColor: primaryColor }]}
                onPress={() => router.push('/home')}
              >
                <Text style={styles.shopButtonText}>
                  {language === 'ar' ? 'تصفح المنيو' : 'Browse Menu'}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 6,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  cardRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  branchName: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  cardFooter: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  detailsLink: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  shopButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  shopButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
