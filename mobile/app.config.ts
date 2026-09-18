import { ExpoConfig, ConfigContext } from 'expo/config';
import fs from 'fs';
import path from 'path';

export default ({ config }: ConfigContext): ExpoConfig => {
  const slug = process.env.EXPO_PUBLIC_RESTAURANT_SLUG || 'am-eissa';
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '');
  const rawAppName = process.env.EXPO_PUBLIC_APP_NAME || 'عم عيسى';
  
  // Ensure "مطعم" prefix/suffix is removed for exact display name
  const appName = rawAppName.replace(/^مطعم\s+/, '').replace(/\s+مطعم$/, '').trim();

  const androidPackage = process.env.EXPO_PUBLIC_ANDROID_PACKAGE || `com.rivix.${cleanSlug || 'ameissa'}`;
  const iosBundleId = process.env.EXPO_PUBLIC_IOS_BUNDLE_ID || `com.rivix.${cleanSlug || 'ameissa'}`;
  const scheme = process.env.EXPO_PUBLIC_SCHEME || `rivix${cleanSlug || 'ameissa'}`;

  // Dynamic per-restaurant icon resolution logic
  const projectRoot = __dirname;
  const restaurantIconPng = `./assets/restaurants/${slug}/icon.png`;
  const restaurantIconJpg = `./assets/restaurants/${slug}/icon.jpg`;

  let selectedIcon = './assets/images/logo.jpg';
  if (fs.existsSync(path.join(projectRoot, restaurantIconPng))) {
    selectedIcon = restaurantIconPng;
  } else if (fs.existsSync(path.join(projectRoot, restaurantIconJpg))) {
    selectedIcon = restaurantIconJpg;
  }

  return {
    ...config,
    name: appName,
    slug: slug,
    version: '1.0.0',
    orientation: 'portrait',
    icon: selectedIcon,
    scheme: scheme,
    userInterfaceStyle: 'automatic',
    splash: {
      image: selectedIcon,
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: iosBundleId,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          `نحتاج موقعك لتحديد عنوان التوصيل بدقة وحساب المسافة من أقرب فرع لمطعم ${appName}`,
      },
    },
    android: {
      package: androidPackage,
      adaptiveIcon: {
        foregroundImage: selectedIcon,
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
      favicon: selectedIcon,
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        'expo-notifications',
        {
          icon: selectedIcon,
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
