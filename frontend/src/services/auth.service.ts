import api from './api';
import { AuthResponse, User } from '@/types/auth.types';
import { ApiResponse } from '@/types/api.types';

export const authService = {
  async login(credentials: Record<string, string>): Promise<AuthResponse> {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return res.data.data!;
  },
  async register(userData: Record<string, any>): Promise<AuthResponse> {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/register', userData);
    return res.data.data!;
  },
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
  async getMe(): Promise<User> {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data.data!;
  },
};
