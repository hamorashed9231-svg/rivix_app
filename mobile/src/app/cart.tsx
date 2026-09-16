import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRestaurant } from '@/context/RestaurantContext';
import { useCart, CartItem } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';

const FALLBACK_ITEM_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';

export default function CartScreen() {
  const router = useRouter();
  const { primaryColor } = useRestaurant();
  const { items, updateQuantity, removeItem, getTotal, clearCart } = useCart();
  const { t, isRTL } = useLanguage();

  const subtotal = getTotal();

  const renderCartItem = ({ item }: { item: CartItem }) => {
    return (
      <View style={[styles.cartCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Image
          source={{ uri: item.image || FALLBACK_ITEM_IMAGE }}
          style={styles.itemImage}
          resizeMode="cover"
        />

        <View style={styles.itemDetails}>
          <View style={[styles.itemHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.itemName, { textAlign: isRTL ? 'right' : 'left' }]}>{item.name}</Text>
            <TouchableOpacity
              onPress={() => removeItem(item.menuItemId)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteText}>🗑️</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.itemPrice, { color: primaryColor, textAlign: isRTL ? 'right' : 'left' }]}>
            {item.price} {t('currency')}
          </Text>

          <View style={[styles.quantityContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => updateQuantity(item.menuItemId, item.quantity - 1)}
            >
              <Text style={styles.qtyButtonText}>-</Text>
            </TouchableOpacity>

            <Text style={styles.quantityText}>{item.quantity}</Text>

            <TouchableOpacity
              style={[styles.qtyButton, { backgroundColor: primaryColor }]}
              onPress={() => updateQuantity(item.menuItemId, item.quantity + 1)}
            >
              <Text style={[styles.qtyButtonText, { color: '#FFFFFF' }]}>+</Text>
            </TouchableOpacity>

            <Text style={[styles.itemTotalPrice, isRTL ? { marginRight: 'auto' } : { marginLeft: 'auto' }]}>
              {t('total')}: {item.price * item.quantity} {t('currency')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={[styles.backButtonText, { color: primaryColor }]}>
              {isRTL ? '← عودة' : '← Back'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('cartTitle')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>{t('emptyCartTitle')}</Text>
          <Text style={styles.emptySubtitle}>{t('emptyCartSubtitle')}</Text>
          <TouchableOpacity
            style={[styles.browseButton, { backgroundColor: primaryColor }]}
            onPress={() => router.replace('/home')}
            activeOpacity={0.8}
          >
            <Text style={styles.browseButtonText}>{t('browseMenu')}</Text>
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
        <Text style={styles.headerTitle}>{t('cartTitle')}</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearAllText}>{t('clearCart')}</Text>
        </TouchableOpacity>
      </View>

      {/* Cart Items List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.menuItemId}
        renderItem={renderCartItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Summary Bar */}
      <View style={styles.bottomBar}>
        <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.summaryLabel}>{t('subtotal')}:</Text>
          <Text style={[styles.summaryValue, { color: primaryColor }]}>
            {subtotal} {t('currency')}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.checkoutButton, { backgroundColor: primaryColor }]}
          onPress={() => router.push('/checkout')}
          activeOpacity={0.8}
        >
          <Text style={styles.checkoutButtonText}>{t('proceedToCheckout')}</Text>
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
  clearAllText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  cartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  itemImage: {
    width: 75,
    height: 75,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  deleteText: {
    fontSize: 16,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  quantityContainer: {
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  quantityText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
    minWidth: 16,
    textAlign: 'center',
  },
  itemTotalPrice: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  browseButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  summaryRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  checkoutButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
