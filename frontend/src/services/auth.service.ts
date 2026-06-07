import api from './api';
import { AuthResponse, User } from '@/types/auth.types';
import { ApiResponse } from '@/types/api.types';

export const authService = {
  async login(credentials: Record<string, string>): Promise<AuthResponse> {
    const res = await api.post<ApiResponse<any>>('/auth/login', credentials);
    return {
      user: res.data.data.user,
      accessToken: res.data.data.token || res.data.data.accessToken,
    };
  },
  async register(userData: Record<string, any>): Promise<AuthResponse> {
    const res = await api.post<ApiResponse<any>>('/auth/register', userData);
    return {
      user: res.data.data.user,
      accessToken: res.data.data.token || res.data.data.accessToken,
    };
  },
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
  async getMe(): Promise<User> {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data.data!;
  },
};
