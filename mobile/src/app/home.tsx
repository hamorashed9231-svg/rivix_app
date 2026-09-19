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
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
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
import { validateCouponCode } from '@/services/coupon';

import { ItemDetailModal } from '@/components/ItemDetailModal';

const FALLBACK_ITEM_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';

export default function HomeScreen() {
  const router = useRouter();
  const { restaurant, primaryColor } = useRestaurant();
  const { user, isAuthenticated } = useAuth();
  const {
    addItem,
    getItemQuantity,
    getItemCount,
    getTotal,
    appliedCoupon,
    discountAmount,
    couponCode,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const { t, isRTL, toggleLanguage, language } = useLanguage();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<MenuItem | null>(null);

  // Home coupon modal states
  const [showCouponModal, setShowCouponModal] = useState<boolean>(false);
  const [homeCouponInput, setHomeCouponInput] = useState<string>(couponCode || '');
  const [validatingHomeCoupon, setValidatingHomeCoupon] = useState<boolean>(false);

  useEffect(() => {
    if (couponCode) {
      setHomeCouponInput(couponCode);
    }
  }, [couponCode]);

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

  // Parse items from restaurant context and enrich with parent category name and id
  const rawItems: MenuItem[] = useMemo(() => {
    if (restaurant?.categories && restaurant.categories.length > 0) {
      return restaurant.categories.flatMap((cat: any) =>
        (cat.items || []).map((item: any) => ({
          ...item,
          category: item.category || cat.name,
          categoryId: item.categoryId || cat.id,
        }))
      );
    }
    if (restaurant?.menu && restaurant.menu.length > 0) {
      return restaurant.menu;
    }
    return [];
  }, [restaurant]);

  // Extract categories from API response categories array or rawItems, inserting OFFERS tab after ALL
  const categoryTabs = useMemo(() => {
    const defaultTabs = [
      { id: 'ALL', name: language === 'ar' ? 'الكل' : 'All' },
      { id: 'OFFERS', name: language === 'ar' ? '🏷️ العروض' : '🏷️ Offers' },
    ];

    if (restaurant?.categories && restaurant.categories.length > 0) {
      return [
        ...defaultTabs,
        ...restaurant.categories.map((c: any) => ({ id: c.name, name: c.name })),
      ];
    }
    const cats = new Set<string>();
    rawItems.forEach((item) => {
      if (item.category) cats.add(item.category);
    });
    return [
      ...defaultTabs,
      ...Array.from(cats).map((name) => ({ id: name, name })),
    ];
  }, [restaurant?.categories, rawItems, language]);

  // Filter items by category or OFFERS
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'ALL') return rawItems;
    if (selectedCategory === 'OFFERS') {
      return rawItems.filter(
        (item) => item.originalPrice && item.originalPrice > item.price
      );
    }
    return rawItems.filter(
      (item) => item.category === selectedCategory || item.categoryId === selectedCategory
    );
  }, [rawItems, selectedCategory]);

  const totalItemsCount = getItemCount();
  const subtotal = getTotal();

  const handleValidateHomeCoupon = async () => {
    if (!homeCouponInput.trim()) {
      Alert.alert(
        language === 'ar' ? 'تنبيه' : 'Validation',
        language === 'ar' ? 'يرجى إدخال كود الخصم أولاً' : 'Please enter a coupon code.'
      );
      return;
    }

    setValidatingHomeCoupon(true);
    const result = await validateCouponCode(
      homeCouponInput,
      subtotal,
      restaurant?.id
    );
    setValidatingHomeCoupon(false);

    if (result.valid && result.coupon) {
      applyCoupon(result.coupon, result.coupon.discountAmount || 0, homeCouponInput.trim());
      setShowCouponModal(false);
      Alert.alert(
        language === 'ar' ? 'تم تطبيق الخصم' : 'Coupon Applied',
        result.message || (language === 'ar' ? 'تم تطبيق الخصم بنجاح وسيظهر في صفحة إتمام الطلب' : 'Coupon applied successfully!')
      );
    } else {
      Alert.alert(
        language === 'ar' ? 'كود غير صالح' : 'Invalid Coupon',
        result.error || (language === 'ar' ? 'كود الخصم غير صالح' : 'Coupon code is invalid')
      );
    }
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => {
    const isAvailable = item.isAvailable !== false;
    const currentQty = getItemQuantity(item.id);
    const hasDiscount = !!(item.originalPrice && item.originalPrice > item.price);
    const discountPct = hasDiscount
      ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100)
      : 0;

    return (
      <TouchableOpacity
        style={[styles.card, !isAvailable && styles.disabledCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        onPress={() => isAvailable && setSelectedItemForDetail(item)}
        activeOpacity={0.88}
      >
        {/* Item Image with Discount & Availability Badges */}
        <View style={styles.cardImageWrapper}>
          <Image
            source={{ uri: item.image || FALLBACK_ITEM_IMAGE }}
            style={styles.cardImage}
            resizeMode="cover"
          />

          {hasDiscount && isAvailable ? (
            <View style={[styles.discountBadge, isRTL ? { right: 6 } : { left: 6 }]}>
              <Text style={styles.discountBadgeText}>
                🔥 -{discountPct}%
              </Text>
            </View>
          ) : null}
        </View>

        {/* Item Information */}
        <View style={styles.cardInfo}>
          <View>
            <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{item.name}</Text>
            {item.description ? (
              <Text style={[styles.cardDescription, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </View>

          {/* Pricing & Cart Action */}
          <View style={[styles.cardFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.priceContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.cardPrice, { color: primaryColor }]}>
                {item.price} <Text style={styles.currencyText}>{t('currency')}</Text>
              </Text>

              {hasDiscount ? (
                <Text style={styles.originalPriceText}>
                  {item.originalPrice} {t('currency')}
                </Text>
              ) : null}
            </View>

            {isAvailable ? (
              <TouchableOpacity
                style={[
                  styles.addButton,
                  { backgroundColor: primaryColor },
                  currentQty > 0 && styles.addButtonActive,
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  addItem(item);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.addButtonText}>
                  {currentQty > 0 ? `+ (${currentQty})` : `+ ${t('addToCart')}`}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.unavailableBadgeInline}>
                <Text style={styles.unavailableTextInline}>
                  {language === 'ar' ? 'غير متاح' : 'Sold Out'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
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

      {/* Coupon Entry Banner */}
      <TouchableOpacity
        style={[styles.couponBannerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        onPress={() => setShowCouponModal(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.couponBannerIcon}>🎟️</Text>
        <View style={{ flex: 1, marginHorizontal: 8 }}>
          <Text style={[styles.couponBannerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'عندك كود خصم؟' : 'Have a promo code?'}
          </Text>
          <Text style={[styles.couponBannerSubtitle, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
            {appliedCoupon
              ? (language === 'ar'
                  ? `تم تطبيق الكود: ${appliedCoupon.code} (خصم ${discountAmount} ${t('currency')})`
                  : `Applied: ${appliedCoupon.code} (-${discountAmount} ${t('currency')})`)
              : (language === 'ar' ? 'اضغط هنا لإدخال الكود والاستفادة بالخصم' : 'Tap here to enter promo code')}
          </Text>
        </View>
        <View style={[styles.couponBannerBadge, { backgroundColor: primaryColor }]}>
          <Text style={styles.couponBannerBadgeText}>
            {appliedCoupon
              ? (language === 'ar' ? 'مُطبق ✅' : 'Applied ✅')
              : (language === 'ar' ? 'إدخال' : 'Enter')}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Categories Horizontal Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabsScroll, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          {categoryTabs.map((cat) => {
            const isSelected = selectedCategory === cat.id;

            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.tab,
                  isSelected && [
                    styles.selectedTab,
                    { backgroundColor: primaryColor, borderColor: primaryColor, shadowColor: primaryColor },
                  ],
                ]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.tabText,
                    isSelected && styles.selectedTabText,
                  ]}
                >
                  {cat.name}
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
            <Text style={styles.emptyText}>
              {selectedCategory === 'OFFERS'
                ? (language === 'ar' ? 'لا توجد عروض حالياً' : 'No offers available currently')
                : t('noItemsFound')}
            </Text>
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

      {/* Product Detail Modal */}
      <ItemDetailModal
        visible={!!selectedItemForDetail}
        item={selectedItemForDetail}
        primaryColor={primaryColor}
        onClose={() => setSelectedItemForDetail(null)}
      />

      {/* Coupon Modal */}
      <Modal
        visible={showCouponModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowCouponModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.couponModalCard}>
            <View style={[styles.couponModalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={styles.couponModalTitle}>
                🎟️ {language === 'ar' ? 'إدخال كود الخصم' : 'Enter Promo Code'}
              </Text>
              <TouchableOpacity onPress={() => setShowCouponModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {appliedCoupon ? (
              <View style={styles.appliedBox}>
                <Text style={styles.appliedBoxTitle}>🎉 {appliedCoupon.code}</Text>
                <Text style={styles.appliedBoxSubtitle}>
                  {language === 'ar' ? 'تم تطبيق الخصم بنجاح:' : 'Discount applied:'} -{discountAmount} {t('currency')}
                </Text>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => {
                    removeCoupon();
                    setHomeCouponInput('');
                  }}
                >
                  <Text style={styles.removeBtnText}>
                    {language === 'ar' ? 'إزالة كود الخصم' : 'Remove Coupon'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.couponModalForm}>
                <TextInput
                  style={[styles.couponModalInput, { textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={language === 'ar' ? 'أدخل كود الخصم (مثال: RIVIX20)' : 'Enter coupon code (e.g. RIVIX20)'}
                  value={homeCouponInput}
                  onChangeText={setHomeCouponInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.couponModalSubmitBtn, { backgroundColor: primaryColor }]}
                  onPress={handleValidateHomeCoupon}
                  disabled={validatingHomeCoupon}
                >
                  {validatingHomeCoupon ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.couponModalSubmitText}>
                      {language === 'ar' ? 'تطبيق الخصم' : 'Apply Coupon'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    borderColor: '#F1F5F9',
  },
  tabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  tab: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  selectedTab: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  tabText: {
    fontSize: 13.5,
    color: '#475569',
    fontWeight: '600',
  },
  selectedTabText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 110,
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
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 12,
    gap: 12,
    position: 'relative',
  },
  disabledCard: {
    opacity: 0.6,
  },
  cardImageWrapper: {
    position: 'relative',
    width: 96,
    height: 96,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    backgroundColor: '#E11D48',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 21,
  },
  cardDescription: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 17.5,
  },
  cardFooter: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  priceContainer: {
    alignItems: 'baseline',
    gap: 6,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  currencyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  originalPriceText: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  addButton: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonActive: {
    transform: [{ scale: 1.02 }],
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  unavailableBadgeInline: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  unavailableTextInline: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
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
  couponBannerRow: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponBannerIcon: {
    fontSize: 20,
  },
  couponBannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
  },
  couponBannerSubtitle: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  couponBannerBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  couponBannerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  couponModalCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  couponModalHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  couponModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748B',
  },
  appliedBox: {
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    gap: 8,
  },
  appliedBoxTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#047857',
  },
  appliedBoxSubtitle: {
    fontSize: 14,
    color: '#065F46',
  },
  removeBtn: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  removeBtnText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 13,
  },
  couponModalForm: {
    gap: 12,
  },
  couponModalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  couponModalSubmitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  couponModalSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
