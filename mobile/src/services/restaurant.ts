import Constants from 'expo-constants';
import { api } from '@/services/api';

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
  isAvailable?: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface RestaurantData {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  description?: string;
  phone?: string;
  address?: string;
  menu?: MenuItem[];
  categories?: MenuCategory[];
}

export const getRestaurantSlug = (): string => {
  return (
    Constants.expoConfig?.extra?.restaurantSlug ||
    process.env.EXPO_PUBLIC_RESTAURANT_SLUG ||
    'am-eissa'
  );
};

export const getRestaurantData = async (): Promise<RestaurantData> => {
  const slug = getRestaurantSlug();
  const fullUrl = `${api.defaults.baseURL}/api/mobile/restaurants/${slug}`;
  console.log('[DEBUG_RUNTIME_URL] Full Request URL:', fullUrl);
  console.log('[DEBUG_SLUG] Restaurant Slug:', slug);
  console.log('[DEBUG_BASE_URL] Base URL:', api.defaults.baseURL);

  try {
    const response = await api.get<RestaurantData>(`/api/mobile/restaurants/${slug}`);
    return response.data;
  } catch (err: any) {
    console.error('[DEBUG_AXIOS_ERROR] Request failed:', {
      url: fullUrl,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      message: err.message,
    });
    throw err;
  }
};
