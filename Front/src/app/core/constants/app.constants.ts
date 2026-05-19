/**
 * Constantes globales de la aplicación.
 *
 * Regla de negocio crítica:
 *   En el formulario de Registro existe un campo "adminCode" que sólo
 *   vive en el frontend. Si su valor coincide con ADMIN_CODE, la
 *   petición POST /api/v1/auth/register se envía con role = 'ADMIN'.
 *   En cualquier otro caso, role = 'CLIENTE'.
 */
export const ADMIN_CODE = 'PUCE2026';

/**
 * Claves del `localStorage`.
 *
 * Si una sesión previa quedó almacenada con un esquema diferente,
 * basta con que el usuario vuelva a iniciar sesión.
 */
export const STORAGE_KEYS = {
  token: 'urbancar.auth.token',
  user:  'urbancar.auth.user',
} as const;

export const ROLES = {
  ADMIN:   'ADMIN',
  CLIENTE: 'CLIENTE',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
