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
  return process.env.EXPO_PUBLIC_RESTAURANT_SLUG || 'demo-restaurant';
};

export const getRestaurantData = async (): Promise<RestaurantData> => {
  const slug = getRestaurantSlug();
  const response = await api.get<RestaurantData>(`/api/mobile/restaurants/${slug}`);
  return response.data;
};
