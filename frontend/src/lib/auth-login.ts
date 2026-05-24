import { isAxiosError } from 'axios';
import { adminApi, clientApi } from '@/api/api';
import {
  normalizeAuthResponse,
  type AuthApiResponse,
  type LoginPayload,
} from '@/types/auth';
import type { AuthSessionData } from '@/types/auth';

/**
 * Intenta login admin; si falla con 401, intenta login cliente.
 * No envía role desde el frontend.
 */
export async function loginWithAdminOrClient(payload: LoginPayload): Promise<AuthSessionData> {
  try {
    const { data } = await adminApi.post<AuthApiResponse>('/auth/login', payload);
    return normalizeAuthResponse(data);
  } catch (adminErr: unknown) {
    if (!isAxiosError(adminErr) || adminErr.response?.status !== 401) {
      throw adminErr;
    }

    const { data } = await clientApi.post<AuthApiResponse>('/auth/login', payload);
    return normalizeAuthResponse(data);
  }
}
