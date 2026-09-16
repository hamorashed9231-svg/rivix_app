import React, { useEffect, useState, useMemo } from 'react';
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
import { useLanguage } from '@/context/LanguageContext';
import { MenuItem } from '@/services/restaurant';
import { requestLocationPermission } from '@/services/location';
import { registerForPushNotificationsAsync } from '@/services/notifications';
import { TENANT_CONFIG } from '@/config/tenant';

const FALLBACK_ITEM_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';

export default function HomeScreen() {
  const router = useRouter();
  const { restaurant, primaryColor } = useRestaurant();
  const { user, isAuthenticated } = useAuth();
  const { addItem, getItemQuantity, getItemCount, getTotal } = useCart();
  const { t, isRTL, toggleLanguage, language } = useLanguage();

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

  // Parse items from restaurant context or fallback
  const rawItems: MenuItem[] = useMemo(() => {
    if (restaurant?.menu && restaurant.menu.length > 0) {
      return restaurant.menu;
    }
    return [
      {
        id: '1',
        name: language === 'ar' ? 'برجر كلاسيك لحم' : 'Classic Beef Burger',
        description: language === 'ar' ? 'شريحة لحم بقر مشوية مع جبنة شيدر، خس وطماطم' : 'Grilled beef patty with cheddar cheese, lettuce & tomato',
        price: 120,
        category: language === 'ar' ? 'البرجر' : 'Burgers',
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
      },
      {
        id: '2',
        name: language === 'ar' ? 'بطاطس مقلية بالجبنة' : 'Cheese Fries',
        description: language === 'ar' ? 'بطاطس مقرمشة مغطاة بالجبنة الذائبة' : 'Crispy fries topped with melted cheese sauce',
        price: 45,
        category: language === 'ar' ? 'الأطباق الجانبية' : 'Sides',
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
      },
    ];
  }, [restaurant?.menu, language]);

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
      <View style={[styles.card, !isAvailable && styles.disabledCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Image
          source={{ uri: item.image || FALLBACK_ITEM_IMAGE }}
          style={styles.cardImage}
          resizeMode="cover"
        />

        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{item.name}</Text>
          {item.description ? (
            <Text style={[styles.cardDescription, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={[styles.cardFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.cardPrice, { color: primaryColor }]}>
              {item.price} {t('currency')}
            </Text>

            {isAvailable ? (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: primaryColor }]}
                onPress={() => addItem(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.addButtonText}>
                  {currentQty > 0 ? `+ (${currentQty})` : `+ ${t('addToCart')}`}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {!isAvailable ? (
          <View style={[styles.unavailableBadge, isRTL ? { left: 12 } : { right: 12 }]}>
            <Text style={styles.unavailableText}>
              {language === 'ar' ? 'غير متاح حالياً' : 'Unavailable'}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={primaryColor} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: primaryColor, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.headerRight, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {restaurant?.logo ? (
            <Image source={{ uri: restaurant.logo }} style={styles.headerLogo} resizeMode="contain" />
          ) : (
            <View style={styles.headerLogoPlaceholder}>
              <Text style={[styles.headerLogoText, { color: primaryColor }]}>
                {(restaurant?.name || 'M').charAt(0)}
              </Text>
            </View>
          )}
          <View>
            <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {restaurant?.name || t('appName')}
            </Text>
            <Text style={[styles.headerSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('welcomeBack')} {user?.name || t('guestUser')} 👋
            </Text>
          </View>
        </View>

        {/* Header Action Buttons */}
        <View style={[styles.headerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {TENANT_CONFIG.isMultiVendor && (
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => router.push('/restaurants')}
              activeOpacity={0.8}
            >
              <Text style={styles.headerIconText}>🍽️</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push('/orders')}
            activeOpacity={0.8}
          >
            <Text style={styles.headerIconText}>📦</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push('/profile')}
            activeOpacity={0.8}
          >
            <Text style={styles.headerIconText}>👤</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.langToggleBtn}
            onPress={toggleLanguage}
            activeOpacity={0.8}
          >
            <Text style={styles.langToggleText}>{t('languageToggle')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories Horizontal Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabsScroll, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const label = cat === 'ALL' ? t('allCategories') : cat;

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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('noItemsFound')}</Text>
          </View>
        }
      />

      {/* Floating Cart Button */}
      {totalItemsCount > 0 ? (
        <View style={styles.floatingButtonWrapper}>
          <TouchableOpacity
            style={[
              styles.floatingCartButton,
              { backgroundColor: primaryColor, flexDirection: isRTL ? 'row-reverse' : 'row' }
            ]}
            onPress={() => router.push('/cart')}
            activeOpacity={0.9}
          >
            <View style={styles.cartBadge}>
              <Text style={[styles.cartBadgeText, { color: primaryColor }]}>
                {totalItemsCount}
              </Text>
            </View>

            <Text style={styles.floatingButtonText}>
              {totalItemsCount} {totalItemsCount === 1 ? t('itemCountSingle') : t('itemsCount')} - {subtotal} {t('currency')}
            </Text>

            <Text style={styles.floatingButtonAction}>
              {t('viewCart')} {isRTL ? '←' : '→'}
            </Text>
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
    paddingHorizontal: 18,
    paddingVertical: 14,
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  headerRight: {
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
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
  },
  langToggleBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  langToggleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
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
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 18,
  },
  cardFooter: {
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
  headerActions: {
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  headerIconText: {
    fontSize: 16,
  },
});
