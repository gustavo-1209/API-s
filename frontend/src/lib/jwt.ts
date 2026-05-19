export type UserRole = 'ADMIN' | 'CLIENTE';

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/** Decodifica el payload del JWT (sin verificar firma; solo para guards de UI). */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );

    const payload = JSON.parse(json) as JwtPayload;
    if (!payload.id || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getRoleFromToken(token: string | null): UserRole | null {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (payload?.role === 'ADMIN' || payload?.role === 'CLIENTE') {
    return payload.role;
  }
  return null;
}
