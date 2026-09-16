import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRestaurant } from '@/context/RestaurantContext';
import { useLanguage } from '@/context/LanguageContext';
import { fetchOrderTracking, submitOrderReview, OrderDetails } from '@/services/orders';

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { primaryColor, restaurant } = useRestaurant();
  const { language, isRTL } = useLanguage();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Review states
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);

  const loadOrderDetails = async () => {
    if (!id) return;
    const data = await fetchOrderTracking(id as string);
    setOrder(data);
    setLoading(false);
  };

  useEffect(() => {
    loadOrderDetails();
    // Poll every 10 seconds for live order status update
    const interval = setInterval(() => {
      loadOrderDetails();
    }, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const handleSubmitReview = async () => {
    if (!order || !restaurant?.id) return;
    setSubmittingReview(true);

    const success = await submitOrderReview({
      orderId: order.id,
      restaurantId: restaurant.id,
      rating,
      comment,
    });

    setSubmittingReview(false);
    if (success) {
      setReviewSubmitted(true);
      Alert.alert(
        language === 'ar' ? 'تم بنجاح' : 'Success',
        language === 'ar' ? 'شكراً لتقييمك للطلب!' : 'Thank you for rating your order!'
      );
    } else {
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'فشل إرسال التقييم، حاول مجدداً.' : 'Failed to submit review.'
      );
    }
  };

  const STEPS = [
    { key: 'pending', label: language === 'ar' ? 'تم استلام الطلب' : 'Order Placed' },
    { key: 'accepted', label: language === 'ar' ? 'تم قبول الطلب' : 'Order Accepted' },
    { key: 'preparing', label: language === 'ar' ? 'جاري التحضير' : 'Preparing Food' },
    { key: 'ready', label: language === 'ar' ? 'جاهز للتسليم' : 'Ready' },
    { key: 'out_for_delivery', label: language === 'ar' ? 'خرج للتوصيل' : 'Out for Delivery' },
    { key: 'delivered', label: language === 'ar' ? 'تم التوصيل' : 'Delivered' },
  ];

  const getStepIndex = (status: string) => {
    return STEPS.findIndex((s) => s.key === status);
  };

  const currentStepIdx = order ? getStepIndex(order.status) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={primaryColor} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: primaryColor, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'ar' ? 'تتبع الطلب' : 'Track Order'} #{id?.slice(-6).toUpperCase()}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      ) : !order ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            {language === 'ar' ? 'الطلب غير موجود' : 'Order not found'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Cancellation Banner */}
          {order.status === 'cancelled' && (
            <View style={styles.cancelledBox}>
              <Text style={styles.cancelledTitle}>
                ❌ {language === 'ar' ? 'تم إلغاء هذا الطلب' : 'Order Cancelled'}
              </Text>
              {order.cancellationReason && (
                <Text style={styles.cancelledReason}>
                  {language === 'ar' ? 'سبب الإلغاء: ' : 'Reason: '}
                  {order.cancellationReason}
                </Text>
              )}
            </View>
          )}

          {/* Timeline Status Tracker */}
          {order.status !== 'cancelled' && (
            <View style={styles.card}>
              <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {language === 'ar' ? 'حالة الطلب الحالية' : 'Order Status'}
              </Text>
              <View style={styles.timelineContainer}>
                {STEPS.map((step, idx) => {
                  const isCompleted = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;

                  return (
                    <View key={step.key} style={[styles.stepRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={styles.stepIndicatorContainer}>
                        <View
                          style={[
                            styles.stepCircle,
                            isCompleted && { backgroundColor: primaryColor },
                            isCurrent && styles.activeStepCircle,
                          ]}
                        >
                          <Text style={styles.stepCircleText}>{isCompleted ? '✓' : idx + 1}</Text>
                        </View>
                        {idx < STEPS.length - 1 && (
                          <View
                            style={[
                              styles.stepLine,
                              idx < currentStepIdx && { backgroundColor: primaryColor },
                            ]}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.stepLabel,
                          isCompleted && styles.completedStepLabel,
                          isCurrent && { color: primaryColor, fontWeight: 'bold' },
                        ]}
                      >
                        {step.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Items Summary */}
          <View style={styles.card}>
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'الأصناف المطلوبة' : 'Order Items'}
            </Text>

            {order.items?.map((item, index) => (
              <View key={index} style={[styles.itemRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {item.quantity}x {item.menuItem?.name || (language === 'ar' ? 'صنف' : 'Item')}
                  </Text>
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <Text style={[styles.itemOptionsText, { textAlign: isRTL ? 'right' : 'left' }]}>
                      {item.selectedOptions.map((opt: any) => opt.name).join(' • ')}
                    </Text>
                  )}
                  {item.notes ? (
                    <Text style={[styles.itemNotes, { textAlign: isRTL ? 'right' : 'left' }]}>
                      📝 {item.notes}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.itemPrice}>
                  {item.price * item.quantity} {language === 'ar' ? 'ج.م' : 'EGP'}
                </Text>
              </View>
            ))}

            <View style={styles.cardDivider} />

            <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={styles.summaryLabel}>{language === 'ar' ? 'تكلفة التوصيل' : 'Delivery Fee'}</Text>
              <Text style={styles.summaryValue}>
                {order.deliveryFee ?? 0} {language === 'ar' ? 'ج.م' : 'EGP'}
              </Text>
            </View>

            <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={styles.totalLabel}>{language === 'ar' ? 'الإجمالي الكلي' : 'Total Amount'}</Text>
              <Text style={[styles.totalValue, { color: primaryColor }]}>
                {order.totalPrice} {language === 'ar' ? 'ج.م' : 'EGP'}
              </Text>
            </View>
          </View>

          {/* Delivery Details */}
          {order.deliveryAddress && (
            <View style={styles.card}>
              <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                📍 {language === 'ar' ? 'عنوان التوصيل' : 'Delivery Address'}
              </Text>
              <Text style={[styles.addressText, { textAlign: isRTL ? 'right' : 'left' }]}>
                {order.deliveryAddress.details}
              </Text>
            </View>
          )}

          {/* Order Rating & Review Form (If Delivered) */}
          {order.status === 'delivered' && !reviewSubmitted && (
            <View style={styles.card}>
              <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                ⭐ {language === 'ar' ? 'تقييم الطلب' : 'Rate Your Order'}
              </Text>
              <Text style={[styles.ratingSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {language === 'ar' ? 'كيف كانت تجربتك مع هذا الطلب؟' : 'How was your experience?'}
              </Text>

              {/* Star Rating Buttons */}
              <View style={[styles.starsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <Text style={styles.starIcon}>{star <= rating ? '⭐' : '☆'}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[styles.commentInput, { textAlign: isRTL ? 'right' : 'left' }]}
                placeholder={
                  language === 'ar'
                    ? 'أكتب ملاحظاتك وتقييمك هنا (اختياري)...'
                    : 'Write your comments here (optional)...'
                }
                multiline
                numberOfLines={3}
                value={comment}
                onChangeText={setComment}
              />

              <TouchableOpacity
                style={[styles.submitReviewBtn, { backgroundColor: primaryColor }]}
                onPress={handleSubmitReview}
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitReviewText}>
                    {language === 'ar' ? 'إرسال التقييم' : 'Submit Review'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {reviewSubmitted && (
            <View style={styles.reviewedBox}>
              <Text style={styles.reviewedText}>
                ✅ {language === 'ar' ? 'تم إرسال تقييمك بنجاح. شكراً لك!' : 'Thank you for your review!'}
              </Text>
            </View>
          )}
        </ScrollView>
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
    fontSize: 17,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  cancelledBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  cancelledTitle: {
    color: '#991B1B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelledReason: {
    color: '#B91C1C',
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  timelineContainer: {
    paddingVertical: 8,
  },
  stepRow: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepIndicatorContainer: {
    alignItems: 'center',
    width: 32,
    marginRight: 12,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  activeStepCircle: {
    borderWidth: 3,
    borderColor: '#93C5FD',
  },
  stepCircleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginTop: -2,
    marginBottom: -2,
  },
  stepLabel: {
    fontSize: 14,
    color: '#64748B',
    paddingTop: 4,
  },
  completedStepLabel: {
    color: '#1E293B',
    fontWeight: '600',
  },
  itemRow: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  itemOptionsText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  itemNotes: {
    fontSize: 12,
    color: '#D97706',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginLeft: 8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  summaryRow: {
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addressText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  ratingSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  starsRow: {
    gap: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
  starIcon: {
    fontSize: 32,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#F8FAFC',
    marginBottom: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitReviewBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitReviewText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  reviewedBox: {
    backgroundColor: '#D1FAE5',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  reviewedText: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
