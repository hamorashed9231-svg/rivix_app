import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const slug = process.env.EXPO_PUBLIC_RESTAURANT_SLUG || 'demo-restaurant';
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '');
  const appName = process.env.EXPO_PUBLIC_APP_NAME || 'Rivix Restaurant';
  const androidPackage = process.env.EXPO_PUBLIC_ANDROID_PACKAGE || `com.rivix.${cleanSlug || 'app'}`;
  const iosBundleId = process.env.EXPO_PUBLIC_IOS_BUNDLE_ID || `com.rivix.${cleanSlug || 'app'}`;
  const scheme = process.env.EXPO_PUBLIC_SCHEME || `rivix${cleanSlug || 'app'}`;

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
          'نحتاج موقعك لتحديد عنوان التوصيل بدقة وحساب المسافة من أقرب فرع',
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
          color: '#2196F3',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000',
      restaurantSlug: slug,
      appName: appName,
    },
  };
};
