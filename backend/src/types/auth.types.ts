import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
