import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRestaurant } from '@/context/RestaurantContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { primaryColor } = useRestaurant();
  const { user, logout } = useAuth();
  const { language, isRTL, toggleLanguage } = useLanguage();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
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
          {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarCircle, { backgroundColor: primaryColor }]}>
              <Text style={styles.avatarText}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || (language === 'ar' ? 'عميل ريفكس' : 'Rivix User')}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          {user?.phone ? <Text style={styles.userPhone}>📱 {user.phone}</Text> : null}
        </View>

        {/* Settings Links Card */}
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.menuRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={() => router.push('/orders')}
          >
            <Text style={styles.menuIcon}>📦</Text>
            <Text style={[styles.menuTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'أرشيف طلباتي وتتبع الشحنة' : 'My Orders & Order History'}
            </Text>
            <Text style={styles.arrowIcon}>{isRTL ? '←' : '→'}</Text>
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <TouchableOpacity
            style={[styles.menuRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={() => router.push('/profile/addresses')}
          >
            <Text style={styles.menuIcon}>📍</Text>
            <Text style={[styles.menuTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'عناويني المحفوظة والموقع' : 'Saved Addresses & Location'}
            </Text>
            <Text style={styles.arrowIcon}>{isRTL ? '←' : '→'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={() => router.push('/support')}
          >
            <Text style={styles.menuIcon}>💬</Text>
            <Text style={[styles.menuTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'تواصل معنا وخدمة العملاء' : 'Contact Us & Support'}
            </Text>
            <Text style={styles.arrowIcon}>{isRTL ? '←' : '→'}</Text>
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <TouchableOpacity
            style={[styles.menuRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={toggleLanguage}
          >
            <Text style={styles.menuIcon}>🌐</Text>
            <Text style={[styles.menuTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'تغيير اللغة (العربية / English)' : 'Change Language'}
            </Text>
            <Text style={styles.arrowIcon}>{language === 'ar' ? 'العربية' : 'English'}</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutButtonText}>
            🚪 {language === 'ar' ? 'تسجيل الخروج' : 'Log Out'}
          </Text>
        </TouchableOpacity>
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
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  userPhone: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginTop: 4,
  },
  menuRow: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuIcon: {
    fontSize: 20,
    marginHorizontal: 8,
  },
  menuTitle: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
  },
  arrowIcon: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
