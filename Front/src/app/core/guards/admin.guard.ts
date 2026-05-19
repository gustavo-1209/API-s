import { inject } from '@angular/core';
import { Router, type CanActivateFn, type UrlTree } from '@angular/router';

import { AuthService } from '@core/services/auth.service';
import { ROLES } from '@core/constants/app.constants';

/**
 * Permite el acceso únicamente a usuarios autenticados con `role === 'ADMIN'`.
 * Aplicado a la ruta /admin y a sus hijas.
 *
 *   - No autenticado  → /auth/login (con returnUrl)
 *   - Autenticado != ADMIN → /  (home)
 */
export const adminGuard: CanActivateFn = (_route, state): boolean | UrlTree => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  if (auth.currentUser()?.role !== ROLES.ADMIN) {
    return router.createUrlTree(['/']);
  }

  return true;
};
