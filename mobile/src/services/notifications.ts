import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const SEEN_PROMOS_KEY = '@seen_promo_notifications_v1';

// Configure notification handling behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Registers device for push notifications and returns Expo Push Token string.
 */
export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device. Simulators/emulators are not supported.');
    return null;
  }

  if (Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient') {
    console.warn('Push notifications are not supported in Expo Go. Skipping token registration.');
    return null;
  }

  try {
    // Configure default Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2196F3',
        sound: 'default',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== Notifications.PermissionStatus.GRANTED) {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
      console.warn('Push notification permission denied by user.');
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    console.log('Expo Push Token obtained:', tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.warn('Push notification registration skipped:', error);
    return null;
  }
};

/**
 * Registers push token and syncs it with the backend server so Call Center Manager / Owner
 * broadcasts reach this device.
 */
export const registerAndSyncPushToken = async (
  restaurantSlug?: string | null,
  userId?: string | null
): Promise<string | null> => {
  try {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      await api.post('/api/mobile/notifications', {
        token,
        platform: Platform.OS,
        restaurantSlug: restaurantSlug || undefined,
        userId: userId || undefined,
      });
    }
    return token;
  } catch (error) {
    console.warn('Failed to sync push token with server:', error);
    return null;
  }
};

export interface PromoNotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  couponCode?: string | null;
  createdAt: string;
}

/**
 * Fetches latest promotional notifications (offers/discounts) from backend and triggers
 * native local notification banner for any unseen broadcast.
 */
export const checkAndTriggerPromoNotifications = async (
  restaurantSlug?: string | null
): Promise<PromoNotificationItem[]> => {
  try {
    const response = await api.get('/api/mobile/notifications', {
      params: restaurantSlug ? { restaurantSlug } : undefined,
    });
    const notifications: PromoNotificationItem[] = response.data?.notifications || [];
    if (notifications.length === 0) return [];

    const rawSeen = await AsyncStorage.getItem(SEEN_PROMOS_KEY);
    const seenIds: string[] = rawSeen ? JSON.parse(rawSeen) : [];
    const seenSet = new Set(seenIds);

    const newPromos = notifications.filter((n) => !seenSet.has(n.id));
    if (newPromos.length > 0) {
      // Trigger local push notification for the newest unseen promo
      const latest = newPromos[0];
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: latest.title,
            body: latest.body,
            sound: 'default',
            data: {
              promoId: latest.id,
              couponCode: latest.couponCode || null,
              type: latest.type,
            },
          },
          trigger: null,
        });
      } catch (scheduleErr) {
        console.warn('Could not schedule local promo notification:', scheduleErr);
      }

      const updatedSeen = Array.from(new Set([...seenIds, ...newPromos.map((n) => n.id)])).slice(-50);
      await AsyncStorage.setItem(SEEN_PROMOS_KEY, JSON.stringify(updatedSeen));
    }

    return notifications;
  } catch (error) {
    console.warn('Error checking promo notifications:', error);
    return [];
  }
};

