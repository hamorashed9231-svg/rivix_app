import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useRestaurant } from '@/context/RestaurantContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { MenuItem } from '@/services/restaurant';
import { requestLocationPermission } from '@/services/location';
import { registerForPushNotificationsAsync } from '@/services/notifications';

const FALLBACK_ITEM_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';

export default function HomeScreen() {
  const router = useRouter();
  const { restaurant, primaryColor, secondaryColor } = useRestaurant();
  const { user, isAuthenticated } = useAuth();
  const { addItem, getItemQuantity, getItemCount, getTotal } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    if (isAuthenticated) {
      (async () => {
        const locationGranted = await requestLocationPermission();
        console.log('[Home] Location permission status:', locationGranted);

        const pushToken = await registerForPushNotificationsAsync();
        console.log('[Home] Push Token result:', pushToken);
      })();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  // Parse items and categories from restaurant context
  const rawItems: MenuItem[] = useMemo(() => {
    if (restaurant?.menu && restaurant.menu.length > 0) {
      return restaurant.menu;
    }
    // Fallback menu data if API hasn't loaded menu array yet
    return [
      {
        id: '1',
        name: 'برجر كلاسيك لحم',
        description: 'شريحة لحم بقر مشوية مع جبنة شيدر، خس، طماطم وصلصة خاصة',
        price: 120,
        category: 'البرجر',
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
      },
      {
        id: '2',
        name: 'دجاج كرسبي برجر',
        description: 'قطعة دجاج مقرمشة حارة مع مايونيز بالثوم وصوص رانش',
        price: 110,
        category: 'البرجر',
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=400',
      },
      {
        id: '3',
        name: 'بطاطس مقلية مع الجبنة',
        description: 'بطاطس مقرمشة مغطاة بصلصة الجبنة الذائبة وقطع هالابينو',
        price: 45,
        category: 'الأطباق الجانبية',
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
      },
      {
        id: '4',
        name: 'حلقات البصل المقرمشة',
        description: 'حلقات بصل ذهبية مقلية تقدم مع صوص الباربيكيو',
        price: 40,
        category: 'الأطباق الجانبية',
        isAvailable: false,
        image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400',
      },
      {
        id: '5',
        name: 'كولا باردة',
        description: 'مشروب غازي منعش 330 مل',
        price: 20,
        category: 'المشروبات',
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400',
      },
      {
        id: '6',
        name: 'عصير برتقال طازج',
        description: 'عصير برتقال طبيعي 100% بدون سكر مضاف',
        price: 35,
        category: 'المشروبات',
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400',
      },
    ];
  }, [restaurant?.menu]);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    rawItems.forEach((item) => {
      if (item.category) cats.add(item.category);
    });
    return ['ALL', ...Array.from(cats)];
  }, [rawItems]);

  // Filter items by category
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'ALL') return rawItems;
    return rawItems.filter((item) => item.category === selectedCategory);
  }, [rawItems, selectedCategory]);

  const totalItemsCount = getItemCount();
  const subtotal = getTotal();

  const renderMenuItem = ({ item }: { item: MenuItem }) => {
    const isAvailable = item.isAvailable !== false;
    const currentQty = getItemQuantity(item.id);

    return (
      <View style={[styles.card, !isAvailable && styles.disabledCard]}>
        <Image
          source={{ uri: item.image || FALLBACK_ITEM_IMAGE }}
          style={styles.cardImage}
          resizeMode="cover"
        />

        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.cardFooter}>
            <Text style={[styles.cardPrice, { color: primaryColor }]}>
              {item.price} جنيه
            </Text>

            {isAvailable ? (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: primaryColor }]}
                onPress={() => addItem(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.addButtonText}>
                  {currentQty > 0 ? `+ (${currentQty})` : '+ إضافة'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {!isAvailable ? (
          <View style={styles.unavailableBadge}>
            <Text style={styles.unavailableText}>غير متاح حالياً</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={primaryColor} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: primaryColor }]}>
        <View style={styles.headerRight}>
          {restaurant?.logo ? (
            <Image source={{ uri: restaurant.logo }} style={styles.headerLogo} resizeMode="contain" />
          ) : (
            <View style={styles.headerLogoPlaceholder}>
              <Text style={[styles.headerLogoText, { color: primaryColor }]}>
                {(restaurant?.name || 'م').charAt(0)}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.headerTitle}>{restaurant?.name || 'المطعم'}</Text>
            <Text style={styles.headerSubtitle}>أهلاً {user?.name || 'العميل'} 👋</Text>
          </View>
        </View>
      </View>

      {/* Categories Horizontal Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const label = cat === 'ALL' ? 'الكل' : cat;

            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.tab,
                  isSelected && { backgroundColor: primaryColor, borderColor: primaryColor },
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    isSelected && styles.selectedTabText,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Menu List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderMenuItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Cart Button */}
      {totalItemsCount > 0 ? (
        <View style={styles.floatingButtonWrapper}>
          <TouchableOpacity
            style={[styles.floatingCartButton, { backgroundColor: primaryColor }]}
            onPress={() => router.push('/cart')}
            activeOpacity={0.9}
          >
            <View style={styles.cartBadge}>
              <Text style={[styles.cartBadgeText, { color: primaryColor }]}>
                {totalItemsCount}
              </Text>
            </View>

            <Text style={styles.floatingButtonText}>
              {totalItemsCount} {totalItemsCount === 1 ? 'صنف' : 'أصناف'} - {subtotal} جنيه
            </Text>

            <Text style={styles.floatingButtonAction}>عرض العربة ←</Text>
          </TouchableOpacity>
        </View>
      ) : null}
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  headerRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
  },
  headerLogoPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    textAlign: 'right',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row-reverse',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
  },
  tabText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  selectedTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    flexDirection: 'row-reverse',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    padding: 12,
    gap: 12,
    position: 'relative',
  },
  disabledCard: {
    opacity: 0.55,
  },
  cardImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'right',
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 2,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  unavailableBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#EF4444',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  unavailableText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  floatingButtonWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  floatingCartButton: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  cartBadge: {
    backgroundColor: '#FFFFFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  floatingButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  floatingButtonAction: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
