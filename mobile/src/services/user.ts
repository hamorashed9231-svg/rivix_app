import { api } from './api';

export interface UserAddress {
  id: string;
  label: string;
  lat: number;
  lng: number;
  details: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

// Fetch user addresses list
export const fetchUserAddresses = async (): Promise<UserAddress[]> => {
  try {
    const response = await api.get('/api/customer/addresses');
    return response.data.addresses || [];
  } catch (error) {
    console.error('Error fetching user addresses:', error);
    return [];
  }
};

// Add new user address
export const addUserAddress = async (addressData: {
  label: string;
  details: string;
  lat: number;
  lng: number;
}): Promise<UserAddress | null> => {
  try {
    const response = await api.post('/api/customer/addresses', addressData);
    return response.data.address || null;
  } catch (error) {
    console.error('Error adding user address:', error);
    return null;
  }
};
