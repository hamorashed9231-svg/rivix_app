import React from 'react';
import { View, ActivityIndicator, Image, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { RestaurantProvider, useRestaurant } from '@/context/RestaurantContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { LanguageProvider } from '@/context/LanguageContext';

function RootLayoutContent() {
  const { loading, restaurant, primaryColor } = useRestaurant();

  if (loading) {
    return (
      <View style={styles.splashContainer}>
        {restaurant?.logo ? (
          <Image source={{ uri: restaurant.logo }} style={styles.logo} resizeMode="contain" />
        ) : (
          <Text style={[styles.splashTitle, { color: primaryColor }]}>
            {restaurant?.name || 'Rivix Mobile'}
          </Text>
        )}
        <ActivityIndicator size="large" color={primaryColor} style={styles.spinner} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <RestaurantProvider>
        <AuthProvider>
          <CartProvider>
            <RootLayoutContent />
          </CartProvider>
        </AuthProvider>
      </RestaurantProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 24,
  },
  splashTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  spinner: {
    marginTop: 16,
  },
});
