import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, AppState, Modal } from 'react-native';
import * as Updates from 'expo-updates';
import { usePathname } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';
import { useRestaurant } from '@/context/RestaurantContext';

export function AutoUpdateChecker() {
  const [updating, setUpdating] = useState<boolean>(false);
  const pathname = usePathname();
  const { language } = useLanguage();
  const { primaryColor } = useRestaurant();

  const isCheckoutScreen = pathname?.includes('checkout');

  const checkAndApplyUpdate = async () => {
    // Never run update check in dev mode or if expo-updates is disabled
    if (__DEV__ || !Updates.isEnabled) {
      return;
    }

    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        // If user is currently on checkout screen, defer auto-reload to avoid disrupting order placement
        if (isCheckoutScreen) {
          console.log('OTA update available, but user is on checkout. Deferring reload.');
          return;
        }

        setUpdating(true);
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      }
    } catch (error) {
      console.warn('Error checking or applying OTA update:', error);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    // Check on initial app mount
    checkAndApplyUpdate();

    // Check whenever app returns to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkAndApplyUpdate();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [pathname]);

  if (updating) {
    return (
      <Modal transparent visible animationType="fade" statusBarTranslucent>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <ActivityIndicator size="large" color={primaryColor || '#F37F20'} />
            <Text style={styles.text}>
              {language === 'ar' ? 'جاري التحديث لأحدث نسخة...' : 'Updating to latest version...'}
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingVertical: 22,
    borderRadius: 16,
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  text: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
  },
});
