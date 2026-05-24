import type { AuthUser } from '@/stores/auth';
import type { UserRole } from '@/lib/jwt';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  user: AuthUser;
  /** Rol en raíz (formato B o dentro de `data` en formato A). */
  role?: UserRole;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/** Respuesta envuelta (formato A) o plana (formato B). */
export type LoginApiResponse = ApiResponse<LoginResponseData> | LoginResponseData;

function isWrappedLoginResponse(
  body: LoginApiResponse,
): body is ApiResponse<LoginResponseData> {
  return 'success' in body && 'data' in body;
}

/** Normaliza formato A/B y fusiona `role` raíz en `user.role` si aplica. */
export function normalizeLoginResponse(body: LoginApiResponse): LoginResponseData {
  const raw = isWrappedLoginResponse(body) ? body.data : body;
  const user: AuthUser = { ...raw.user };

  if (raw.role && !user.role) {
    user.role = raw.role;
  }

  return { token: raw.token, user, role: raw.role };
}
