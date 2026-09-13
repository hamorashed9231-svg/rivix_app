import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useRestaurant } from '@/context/RestaurantContext';
import { useAuth } from '@/context/AuthContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { restaurant, primaryColor, secondaryColor } = useRestaurant();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  const restaurantName = restaurant?.name || 'مطعمنا';
  const logoUri = restaurant?.logo;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {logoUri ? (
          <Image source={{ uri: logoUri }} style={styles.logo} resizeMode="contain" />
        ) : (
          <View style={[styles.placeholderLogo, { backgroundColor: primaryColor }]}>
            <Text style={styles.placeholderLogoText}>{restaurantName.charAt(0)}</Text>
          </View>
        )}

        <Text style={styles.title}>مرحباً بك في {restaurantName}</Text>
        <Text style={styles.subtitle}>
          {restaurant?.description || 'استمتع بأشهى المأكولات واطلب وجبتك المفضلة بسهولة'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: primaryColor }]}
          onPress={() => router.push('/login')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>تسجيل الدخول</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: secondaryColor }]}
          onPress={() => router.push('/register')}
          activeOpacity={0.8}
        >
          <Text style={[styles.secondaryButtonText, { color: secondaryColor }]}>إنشاء حساب</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 24,
  },
  placeholderLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  placeholderLogoText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#718096',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
