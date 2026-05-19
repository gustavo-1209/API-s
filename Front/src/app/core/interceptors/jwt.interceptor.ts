import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '@core/services/auth.service';

/**
 * JwtInterceptor (functional).
 *
 *  - Inyecta el header `Authorization: Bearer <token>` en TODA petición
 *    cuya URL incluya `/api/v1/`, siempre que exista un token activo.
 *  - Si el backend responde 401 → cierra sesión y redirige a /auth/login.
 *
 *  Las rutas públicas (`/auth/login`, `/auth/register`) tampoco se
 *  ven afectadas: si no hay token, no se añade el header.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const targetsApi = req.url.includes('/api/v1/');

  const authReq = (token && targetsApi)
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && targetsApi) {
        auth.logout('/auth/login');
      }
      return throwError(() => err);
    }),
  );
};
