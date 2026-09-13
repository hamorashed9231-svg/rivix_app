import { api } from './api';

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
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
}

export const getRestaurantSlug = (): string => {
  return process.env.EXPO_PUBLIC_RESTAURANT_SLUG || 'demo-restaurant';
};

export const getRestaurantData = async (): Promise<RestaurantData> => {
  const slug = getRestaurantSlug();
  const response = await api.get<RestaurantData>(`/api/mobile/restaurants/${slug}`);
  return response.data;
};
