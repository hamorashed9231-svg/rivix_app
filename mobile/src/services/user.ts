import { api } from './api';

export interface UserAddress {
  id: string;
  label: string;
  lat: number;
  lng: number;
  details: string;
  streetName?: string | null;
  buildingNumber?: string | null;
  floor?: string | null;
  apartment?: string | null;
  landmark?: string | null;
  phone?: string | null;
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
  label?: string;
  details?: string;
  lat: number;
  lng: number;
  streetName?: string;
  buildingNumber?: string;
  floor?: string;
  apartment?: string;
  landmark?: string;
  phone?: string;
}): Promise<UserAddress | null> => {
  try {
    const response = await api.post('/api/customer/addresses', addressData);
    return response.data.address || null;
  } catch (error) {
    console.error('Error adding user address:', error);
    return null;
  }
};

// Delete user address
export const deleteUserAddress = async (id: string): Promise<boolean> => {
  try {
    await api.delete(`/api/customer/addresses?id=${encodeURIComponent(id)}`);
    return true;
  } catch (error) {
    console.error('Error deleting user address:', error);
    return false;
  }
};
