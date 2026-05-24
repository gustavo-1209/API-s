import type { AuthUser } from '@/stores/auth';
import type { UserRole } from '@/lib/jwt';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  telefono: string;
}

export interface AuthSessionData {
  token: string;
  user: AuthUser;
  /** Rol en raíz (formato alternativo). */
  role?: UserRole;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/** Respuesta envuelta (formato A) o plana (formato B). */
export type AuthApiResponse = ApiResponse<AuthSessionData> | AuthSessionData;

/** @deprecated Usar AuthApiResponse */
export type LoginApiResponse = AuthApiResponse;

function isWrappedAuthResponse(body: AuthApiResponse): body is ApiResponse<AuthSessionData> {
  return 'success' in body && 'data' in body;
}

/** Normaliza login/register: `{ success, data: { user, token } }` o plano. */
export function normalizeAuthResponse(body: AuthApiResponse): AuthSessionData {
  const raw = isWrappedAuthResponse(body) ? body.data : body;
  const user: AuthUser = { ...raw.user };

  if (raw.role && !user.role) {
    user.role = raw.role;
  }

  if (!user.role) {
    user.role = 'CLIENTE';
  }

  return { token: raw.token, user, role: raw.role };
}

/** Alias para compatibilidad con login existente. */
export function normalizeLoginResponse(body: AuthApiResponse): AuthSessionData {
  return normalizeAuthResponse(body);
}
