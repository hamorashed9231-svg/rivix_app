import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRestaurant } from '@/context/RestaurantContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import axios from 'axios';
import Constants from 'expo-constants';

interface ActiveComplaint {
  id: string;
  subject: string | null;
  message: string;
  type: string;
  imageUrl: string | null;
  reply: string | null;
  repliedAt: string | null;
  status: string;
  createdAt: string;
}

export default function CustomerSupportScreen() {
  const router = useRouter();
  const { restaurant, primaryColor } = useRestaurant();
  const { user } = useAuth();
  const { language, isRTL } = useLanguage();

  const [messageType, setMessageType] = useState<'inquiry' | 'complaint'>('inquiry');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [checkingLock, setCheckingLock] = useState(true);
  const [activeComplaint, setActiveComplaint] = useState<ActiveComplaint | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [recentMessages, setRecentMessages] = useState<ActiveComplaint[]>([]);

  const [loading, setLoading] = useState(false);

  const apiBaseUrl =
    Constants.expoConfig?.extra?.apiBaseUrl || 'https://restaurant-platform-ecru.vercel.app';

  const checkActiveComplaintStatus = async () => {
    if (!user?.id || !restaurant?.slug) {
      setCheckingLock(false);
      return;
    }

    try {
      const res = await axios.get(`${apiBaseUrl}/api/customer/messages/active`, {
        params: { restaurantSlug: restaurant.slug },
        headers: { 'x-user-id': user.id },
      });

      if (res.data) {
        setActiveComplaint(res.data.activeComplaint || null);
        setIsLocked(!!res.data.isLocked);
        setRecentMessages(res.data.recentMessages || []);
      }
    } catch (err) {
      console.warn('[Support] Error checking active complaint:', err);
    } finally {
      setCheckingLock(false);
    }
  };

  useEffect(() => {
    checkActiveComplaintStatus();
  }, [user?.id, restaurant?.slug]);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      Alert.alert(
        language === 'ar' ? 'تنبيه' : 'Warning',
        language === 'ar' ? 'يرجى إدخال نص الرسالة قبل الإرسال' : 'Please enter your message before sending.'
      );
      return;
    }

    setLoading(true);
    try {
      const payload = {
        restaurantId: restaurant?.id,
        restaurantSlug: restaurant?.slug,
        type: messageType,
        subject: subject.trim(),
        message: message.trim(),
        imageUrl: imageUrl.trim() || undefined,
      };

      const res = await axios.post(`${apiBaseUrl}/api/customer/messages`, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...(user?.id ? { 'x-user-id': user.id } : {}),
        },
      });

      if (res.data?.success) {
        setSubject('');
        setMessage('');
        setImageUrl('');
        Alert.alert(
          language === 'ar' ? 'تم الإرسال بنجاح 🎉' : 'Sent Successfully 🎉',
          messageType === 'complaint'
            ? (language === 'ar'
                ? 'تم استلام شكواك وسيقوم فريق الدعم بمراجعتها والرد عليها قريبًا.'
                : 'Your complaint was received. Our team will reply shortly.')
            : (language === 'ar'
                ? 'تم إرسال استفسارك لطاقم العمل بالمطعم بنجاح.'
                : 'Your inquiry was sent to the restaurant staff.')
        );
        await checkActiveComplaintStatus();
      } else {
        Alert.alert(
          language === 'ar' ? 'خطأ' : 'Error',
          res.data?.error || (language === 'ar' ? 'حدث خطأ أثناء إرسال الرسالة' : 'Failed to send message.')
        );
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error ||
        (language === 'ar' ? 'تعذر الاتصال بالسيرفر. يرجى المحاولة لاحقاً.' : 'Could not connect to server.');

      if (err?.response?.data?.activeComplaint) {
        setActiveComplaint(err.response.data.activeComplaint);
        setIsLocked(true);
      }

      Alert.alert(language === 'ar' ? 'تنبيه الرسائل' : 'Message Notice', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={primaryColor} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: primaryColor, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'ar' ? 'تواصل معنا وخدمة العملاء' : 'Contact Us & Support'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Info Banner */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            💬 {language === 'ar' ? `خدمة دعم مطعم ${restaurant?.name || ''}` : `Support for ${restaurant?.name || 'Restaurant'}`}
          </Text>
          <Text style={styles.infoSubtitle}>
            {language === 'ar'
              ? 'أرسل استفسارك أو شكواك وسيتلقاها فريق خدمة العملاء وطاقم العمل مباشرة.'
              : 'Send your inquiry or complaint directly to the restaurant support team.'}
          </Text>
        </View>

        {checkingLock ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={primaryColor} />
            <Text style={styles.loadingText}>
              {language === 'ar' ? 'جاري التحقق من حالة الشكاوى والتواصل...' : 'Checking support status...'}
            </Text>
          </View>
        ) : isLocked && activeComplaint ? (
          /* COMPLAINT LOCK BANNER */
          <View style={styles.lockCard}>
            <View style={styles.lockBadgeRow}>
              <Text style={styles.lockBadgeText}>⚠️ {language === 'ar' ? 'شكوى قيد المراجعة' : 'Pending Complaint'}</Text>
              <Text style={styles.statusPill}>{language === 'ar' ? 'قيد المراجعة' : 'Under Review'}</Text>
            </View>

            <Text style={styles.lockTitle}>
              {language === 'ar'
                ? 'لديك شكوى قيد المراجعة، سيتم الرد عليها قريبًا'
                : 'You have an open complaint under review. We will reply shortly.'}
            </Text>

            <View style={styles.complaintDetailBox}>
              {activeComplaint.subject ? (
                <Text style={styles.complaintSubject}>
                  📌 {language === 'ar' ? 'الموضوع: ' : 'Subject: '} {activeComplaint.subject}
                </Text>
              ) : null}
              <Text style={styles.complaintMessage}>{activeComplaint.message}</Text>

              {activeComplaint.imageUrl ? (
                <View style={styles.attachedImageContainer}>
                  <Text style={styles.attachedLabel}>🖼️ {language === 'ar' ? 'الصورة المرفقة:' : 'Attached Image:'}</Text>
                  <Image source={{ uri: activeComplaint.imageUrl }} style={styles.attachedImage} resizeMode="cover" />
                </View>
              ) : null}

              <Text style={styles.complaintDate}>
                🕒 {new Date(activeComplaint.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
              </Text>
            </View>

            <Text style={styles.lockNoticeFooter}>
              🔒 {language === 'ar'
                ? 'لا يمكن تقديم رسالة جديدة حتى يقوم طاقم العمل بمراجعة والرد على الشكوى الحالية.'
                : 'New messages are locked until staff reviews and replies to your active complaint.'}
            </Text>
          </View>
        ) : (
          /* COMPOSE MESSAGE FORM */
          <View style={styles.formCard}>
            {/* Type Selector (Inquiry vs Complaint) */}
            <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'نوع الرسالة *' : 'Message Type *'}
            </Text>
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[
                  styles.typeTab,
                  messageType === 'inquiry' && { backgroundColor: primaryColor, borderColor: primaryColor },
                ]}
                onPress={() => setMessageType('inquiry')}
              >
                <Text
                  style={[
                    styles.typeTabText,
                    messageType === 'inquiry' && styles.typeTabTextActive,
                  ]}
                >
                  💬 {language === 'ar' ? 'استفسار عام' : 'General Inquiry'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeTab,
                  messageType === 'complaint' && { backgroundColor: '#E11D48', borderColor: '#E11D48' },
                ]}
                onPress={() => setMessageType('complaint')}
              >
                <Text
                  style={[
                    styles.typeTabText,
                    messageType === 'complaint' && styles.typeTabTextActive,
                  ]}
                >
                  ⚠️ {language === 'ar' ? 'تقديم شكوى' : 'File a Complaint'}
                </Text>
              </TouchableOpacity>
            </View>

            {messageType === 'complaint' && (
              <View style={styles.complaintWarningBanner}>
                <Text style={styles.complaintWarningText}>
                  ℹ️ {language === 'ar'
                    ? 'عند تقديم الشكوى، سيتم قفل إرسال رسائل جديدة مؤقتًا لحين رد فريق العمل عليها.'
                    : 'Filing a complaint locks new messages until staff reviews and replies.'}
                </Text>
              </View>
            )}

            {/* Subject Field */}
            <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'موضوع الرسالة (اختياري)' : 'Subject (Optional)'}
            </Text>
            <TextInput
              style={[styles.textInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={language === 'ar' ? 'مثال: استفسار عن الطلب أو ملاحظة' : 'e.g., Question about my order'}
              placeholderTextColor="#94A3B8"
              value={subject}
              onChangeText={setSubject}
            />

            {/* Message Field */}
            <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'نص الرسالة *' : 'Message *'}
            </Text>
            <TextInput
              style={[styles.textInput, styles.textArea, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={language === 'ar' ? 'اكتب تفاصيل الرسالة هنا...' : 'Write your detailed message here...'}
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />

            {/* Optional Photo Attachment for Complaints */}
            {messageType === 'complaint' && (
              <>
                <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  📸 {language === 'ar' ? 'إرفاق صورة مع الشكوى (رابط أو رفع صورة)' : 'Attach Photo with Complaint (URL)'}
                </Text>
                <TextInput
                  style={[styles.textInput, { textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={language === 'ar' ? 'ضع رابط الصورة المعبرة عن الشكوى (إن وجد)' : 'Enter image URL (optional)'}
                  placeholderTextColor="#94A3B8"
                  value={imageUrl}
                  onChangeText={setImageUrl}
                />
              </>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: messageType === 'complaint' ? '#E11D48' : primaryColor },
              ]}
              onPress={handleSendMessage}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {messageType === 'complaint'
                    ? (language === 'ar' ? '🚨 إرسال الشكوى للفريق' : 'Submit Complaint to Team')
                    : (language === 'ar' ? '🚀 إرسال الاستفسار للطاقم' : 'Send Inquiry to Staff')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* History / Staff Replies Card */}
        {recentMessages.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>📜 {language === 'ar' ? 'سجل تواصلك السابق' : 'Recent Support History'}</Text>
            {recentMessages.map((msg) => (
              <View key={msg.id} style={styles.historyItem}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyType}>
                    {msg.type === 'complaint' ? '⚠️ شكوى' : '💬 استفسار'}
                  </Text>
                  <Text
                    style={[
                      styles.historyStatus,
                      msg.status === 'resolved' ? styles.statusResolved : styles.statusPending,
                    ]}
                  >
                    {msg.status === 'resolved'
                      ? (language === 'ar' ? 'تم الحل والرد' : 'Resolved')
                      : (language === 'ar' ? 'قيد المراجعة' : 'Under Review')}
                  </Text>
                </View>

                <Text style={styles.historyMessage}>{msg.message}</Text>

                {msg.reply && (
                  <View style={styles.staffReplyBox}>
                    <Text style={styles.staffReplyHeader}>✅ {language === 'ar' ? 'رد فريق الدعم:' : 'Staff Reply:'}</Text>
                    <Text style={styles.staffReplyText}>{msg.reply}</Text>
                    {msg.repliedAt && (
                      <Text style={styles.staffReplyTime}>
                        🕒 {new Date(msg.repliedAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  infoCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  infoSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
  },
  lockCard: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  lockBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockBadgeText: {
    color: '#BE123C',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusPill: {
    backgroundColor: '#FFE4E6',
    color: '#9F1239',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lockTitle: {
    color: '#881337',
    fontSize: 15,
    fontWeight: 'bold',
  },
  complaintDetailBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderColor: '#FDA4AF',
    borderWidth: 1,
  },
  complaintSubject: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: 'bold',
  },
  complaintMessage: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
  },
  attachedImageContainer: {
    marginTop: 6,
    gap: 6,
  },
  attachedLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: 'bold',
  },
  attachedImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
  },
  complaintDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  lockNoticeFooter: {
    fontSize: 12,
    color: '#9F1239',
    lineHeight: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  typeTabText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
  },
  typeTabTextActive: {
    color: '#FFFFFF',
  },
  complaintWarningBanner: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  complaintWarningText: {
    color: '#BE123C',
    fontSize: 12,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
  },
  textInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    minHeight: 110,
  },
  submitButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  historyItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  historyStatus: {
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusResolved: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  historyMessage: {
    fontSize: 13,
    color: '#334155',
  },
  staffReplyBox: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
    gap: 4,
  },
  staffReplyHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#047857',
  },
  staffReplyText: {
    fontSize: 13,
    color: '#065F46',
  },
  staffReplyTime: {
    fontSize: 10,
    color: '#10B981',
  },
});
