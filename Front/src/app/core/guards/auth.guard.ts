import { inject } from '@angular/core';
import { Router, type CanActivateFn, type UrlTree } from '@angular/router';

import { AuthService } from '@core/services/auth.service';

/**
 * Permite el acceso a la ruta sólo si el usuario está autenticado.
 * En caso contrario redirige a /auth/login conservando el `returnUrl`.
 */
export const authGuard: CanActivateFn = (_route, state): boolean | UrlTree => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};
