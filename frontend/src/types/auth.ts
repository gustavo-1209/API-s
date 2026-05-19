import type { AuthUser } from '@/stores/auth';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  user: AuthUser;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
