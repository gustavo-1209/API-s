import type { UserRole } from '@/lib/jwt';

export {};

declare module 'vue-router' {
  interface RouteMeta {
    /** Ruta accesible sin sesión (login, no autorizado). */
    public?: boolean;
    /** Requiere JWT válido en localStorage. */
    requiresAuth?: boolean;
    /** Rol mínimo requerido para acceder a la ruta. */
    role?: UserRole;
  }
}
