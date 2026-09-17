import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const slug = process.env.EXPO_PUBLIC_RESTAURANT_SLUG || 'am-eissa';
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '');
  const appName = process.env.EXPO_PUBLIC_APP_NAME || 'مطعم عم عيسى';
  const androidPackage = process.env.EXPO_PUBLIC_ANDROID_PACKAGE || `com.rivix.${cleanSlug || 'ameissa'}`;
  const iosBundleId = process.env.EXPO_PUBLIC_IOS_BUNDLE_ID || `com.rivix.${cleanSlug || 'ameissa'}`;
  const scheme = process.env.EXPO_PUBLIC_SCHEME || `rivix${cleanSlug || 'ameissa'}`;

  return {
    ...config,
    name: appName,
    slug: slug,
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: scheme,
    userInterfaceStyle: 'automatic',
    ios: {
      supportsTablet: true,
      bundleIdentifier: iosBundleId,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'نحتاج موقعك لتحديد عنوان التوصيل بدقة وحساب المسافة من أقرب فرع لمطعم عم عيسى',
      },
    },
    android: {
      package: androidPackage,
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'POST_NOTIFICATIONS',
      ],
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        'expo-notifications',
        {
          icon: './assets/images/icon.png',
          color: '#f37f20',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://restaurant-platform-ecru.vercel.app',
      restaurantSlug: slug,
      appName: appName,
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || '9fa21e7c-d00e-46b4-ac63-459b9f763647',
      },
    },
  };
};
