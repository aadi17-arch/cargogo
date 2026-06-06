export type UserRole = 'SHIPPER' | 'DRIVER';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}
