import type { Router } from 'vue-router';
import { getRoleFromToken } from '@/lib/jwt';
import { getToken } from '@/lib/auth-storage';
import { useAuthStore } from '@/stores/auth';

export function setupRouterGuards(router: Router): void {
  router.beforeEach((to, _from, next) => {
    const authStore = useAuthStore();
    const token = authStore.token ?? getToken();
    const userRole = authStore.userRole ?? getRoleFromToken(token);

    const isPublic = to.matched.some((record) => record.meta.public);
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
    const requiredRole = [...to.matched].reverse().find((record) => record.meta.role)?.meta.role;

    if ((to.name === 'login' || to.name === 'register') && token) {
      next(userRole === 'ADMIN' ? { name: 'admin-dashboard' } : { name: 'marketplace' });
      return;
    }

    if (isPublic) {
      next();
      return;
    }

    if (requiresAuth && !token) {
      next({ name: 'login', query: { redirect: to.fullPath } });
      return;
    }

    if (requiredRole && userRole !== requiredRole) {
      if (requiredRole === 'ADMIN' && userRole === 'CLIENTE') {
        next({ name: 'no-autorizado' });
        return;
      }
      next({ name: 'marketplace' });
      return;
    }

    next();
  });
}
