import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { decodeJwtPayload, getRoleFromToken, type UserRole } from '@/lib/jwt';
import { clearToken, getToken, setToken } from '@/lib/auth-storage';

export interface AuthUser {
  id: string;
  email: string;
  nombres?: string;
  apellidos?: string;
  role?: UserRole;
}

function hydrateUserFromToken(storedToken: string | null): AuthUser | null {
  if (!storedToken) return null;
  const payload = decodeJwtPayload(storedToken);
  if (!payload) return null;
  return { id: payload.id, email: payload.email, role: payload.role };
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getToken());
  const user = ref<AuthUser | null>(hydrateUserFromToken(token.value));

  const isAuthenticated = computed(() => Boolean(token.value));

  const userRole = computed<UserRole | null>(() => {
    if (user.value?.role) return user.value.role;
    return getRoleFromToken(token.value);
  });

  const isAdmin = computed(() => userRole.value === 'ADMIN');

  function setSession(newToken: string, authUser?: AuthUser | null): void {
    token.value = newToken;
    setToken(newToken);
    const roleFromJwt = getRoleFromToken(newToken);
    if (authUser) {
      user.value = {
        ...authUser,
        role: authUser.role ?? roleFromJwt ?? 'CLIENTE',
      };
    } else if (roleFromJwt) {
      user.value = { id: '', email: '', role: roleFromJwt };
    }
  }

  function clearSession(): void {
    token.value = null;
    user.value = null;
    clearToken();
  }

  return {
    token,
    user,
    userRole,
    isAdmin,
    isAuthenticated,
    setSession,
    clearSession,
  };
});
