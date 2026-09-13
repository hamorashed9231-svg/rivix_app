import { api, setStoredToken, removeStoredToken, getStoredToken } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/api/mobile/auth/login', {
    email,
    password,
  });

  if (response.data?.token) {
    await setStoredToken(response.data.token);
  }

  return response.data;
};

export const register = async (
  name: string,
  phone: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/api/mobile/auth/register', {
    name,
    phone,
    email,
    password,
  });

  if (response.data?.token) {
    await setStoredToken(response.data.token);
  }

  return response.data;
};

export const getProfile = async (): Promise<User> => {
  const response = await api.get<{ user: User }>('/api/mobile/profile');
  return response.data.user;
};

export const logout = async (): Promise<void> => {
  await removeStoredToken();
};

export { getStoredToken };
