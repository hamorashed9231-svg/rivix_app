import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import { MenuItem } from '@/context/RestaurantContext';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';

interface ItemDetailModalProps {
  visible: boolean;
  item: MenuItem | null;
  primaryColor?: string;
  onClose: () => void;
}

export function ItemDetailModal({
  visible,
  item,
  primaryColor = '#2196F3',
  onClose,
}: ItemDetailModalProps) {
  if (!item) return null;

  const { addToCart } = useCart();
  const { t, language, isRTL } = useLanguage();

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({});
  const [imageError, setImageError] = useState<boolean>(false);

  const fallbackPlaceholder = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop';
  const imageUrl = (!imageError && item.image) ? item.image : fallbackPlaceholder;

  const hasDiscount = item.originalPrice && item.originalPrice > item.price;
  const discountPercent = hasDiscount
    ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100)
    : 0;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(item, selectedOptions);
    }
    onClose();
    setQuantity(1);
    setSelectedOptions({});
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.contentCard}>
          {/* Header Bar */}
          <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Product Image */}
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.productImage}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
              {hasDiscount && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>خصم {discountPercent}%</Text>
                </View>
              )}
            </View>

            {/* Title & Description */}
            <View style={styles.infoSection}>
              <Text style={[styles.itemName, { textAlign: isRTL ? 'right' : 'left' }]}>
                {item.name}
              </Text>
              
              <View style={[styles.priceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.priceText, { color: primaryColor }]}>
                  {item.price} {t('currency')}
                </Text>
                {hasDiscount && (
                  <Text style={styles.originalPriceText}>
                    {item.originalPrice} {t('currency')}
                  </Text>
                )}
              </View>

              {item.description ? (
                <Text style={[styles.descriptionText, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {item.description}
                </Text>
              ) : null}
            </View>

            {/* Option Groups Choices (Dynamic if present) */}
            {item.optionGroups && item.optionGroups.length > 0 ? (
              <View style={styles.optionsSection}>
                {item.optionGroups.map((group: any) => (
                  <View key={group.id || group.name} style={styles.optionGroupCard}>
                    <Text style={[styles.groupTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                      {group.name} {group.isRequired ? '*' : ''}
                    </Text>
                    {group.options?.map((opt: any) => {
                      const isSelected = selectedOptions[group.name]?.id === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id || opt.name}
                          style={[
                            styles.optionItemRow,
                            isSelected && { borderColor: primaryColor, backgroundColor: '#F0F9FF' },
                            { flexDirection: isRTL ? 'row-reverse' : 'row' }
                          ]}
                          onPress={() => setSelectedOptions({ ...selectedOptions, [group.name]: opt })}
                        >
                          <Text style={styles.radioIcon}>{isSelected ? '🔘' : '⚪'}</Text>
                          <Text style={styles.optionName}>{opt.name}</Text>
                          {opt.price > 0 && (
                            <Text style={styles.optionPrice}>+{opt.price} {t('currency')}</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            ) : null}

            {/* Quantity Selector */}
            <View style={[styles.quantitySection, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={styles.quantityLabel}>
                {language === 'ar' ? 'الكمية:' : 'Quantity:'}
              </Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQuantity(quantity + 1)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer Add to Cart Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.addToCartBtn, { backgroundColor: primaryColor }]}
              onPress={handleAddToCart}
              activeOpacity={0.85}
            >
              <Text style={styles.addToCartBtnText}>
                {language === 'ar' ? 'إضافة إلى السلة' : 'Add to Cart'} ({(item.price * quantity).toFixed(0)} {t('currency')})
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    flex: 1,
    textAlign: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoSection: {
    gap: 8,
  },
  itemName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  priceRow: {
    alignItems: 'center',
    gap: 10,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  originalPriceText: {
    fontSize: 15,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  descriptionText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  optionsSection: {
    gap: 12,
  },
  optionGroupCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  optionItemRow: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  radioIcon: {
    fontSize: 14,
  },
  optionName: {
    fontSize: 14,
    color: '#334155',
    flex: 1,
  },
  optionPrice: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },
  quantitySection: {
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
  },
  quantityLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    minWidth: 24,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  addToCartBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  addToCartBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
