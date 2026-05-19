# UrbanCar EC — Frontend (Angular 18 + Signals + Tailwind)

Aplicación marketplace + panel administrativo del sistema **UrbanCar EC**.
Construida con **Angular 18 (Standalone Components + Signals)**, **Tailwind CSS**
con paleta turquesa corporativa y **Lucide Angular** para los iconos.

## Stack

| Capa             | Tecnología                                 |
| ---------------- | ------------------------------------------ |
| Framework        | Angular 18 (standalone, OnPush, signals)   |
| Estilos          | Tailwind CSS 3.4 (paleta turquesa)         |
| Iconos           | lucide-angular                             |
| HTTP             | `HttpClient` + `withInterceptors`          |
| Estado de auth   | `signal<AuthUser \| null>` + `localStorage` |
| Routing          | Lazy `loadComponent` + functional guards   |

## Estructura

```text
src/
├── environments/                # apiUrl + adminCode
└── app/
    ├── app.component.ts         # Shell (navbar + outlet + footer)
    ├── app.config.ts            # Providers (router, http, lucide)
    ├── app.routes.ts            # Rutas + guards
    ├── core/
    │   ├── constants/app.constants.ts   # ADMIN_CODE = 'PUCE2026'
    │   ├── models/api.models.ts         # Tipos derivados de openapi.yaml
    │   ├── services/auth.service.ts     # Signals: currentUser, isAdmin…
    │   ├── interceptors/jwt.interceptor.ts
    │   └── guards/{auth,admin}.guard.ts
    ├── shared/components/{navbar,footer,paginator,...}/
    └── features/
        ├── auth/{login,register}/
        ├── home/
        ├── marketplace/
        ├── reserva/
        ├── client/
        └── admin/                       # Protegido por adminGuard
```

## Regla de negocio crítica — Registro

En `src/app/features/auth/register/register.component.ts` el formulario
incluye un campo **`adminCode`** que **sólo existe en el frontend** y nunca
se envía al backend.

`AuthService.register()` aplica la regla:

```ts
const role: Role = form.adminCode?.trim() === environment.adminCode
  ? 'ADMIN'
  : 'CLIENTE';
```

| `adminCode` ingresado | `role` enviado en `POST /api/v1/auth/register` |
| --------------------- | ---------------------------------------------- |
| `PUCE2026`            | `ADMIN`                                        |
| (cualquier otro)      | `CLIENTE`                                      |
| (vacío)               | `CLIENTE`                                      |

> El componente muestra en vivo la previsualización del rol
> (`willBeAdmin = computed(...)`) para feedback al usuario.

## Seguridad — Guards

| Ruta          | Guard         | Regla                                          |
| ------------- | ------------- | ---------------------------------------------- |
| `/cliente`    | `authGuard`   | Requiere sesión activa                         |
| `/reserva/:id`| `authGuard`   | Requiere sesión activa                         |
| `/admin`      | `adminGuard`  | Requiere sesión **y** `currentUser.role === 'ADMIN'` |

## JwtInterceptor

`src/app/core/interceptors/jwt.interceptor.ts` añade
`Authorization: Bearer <token>` a **toda** petición cuya URL contenga
`/api/v1/`. Si el backend responde **401**, ejecuta `logout()` y redirige
a `/auth/login`.

## LocalStorage — claves

| Clave                           | Contenido                                |
| ------------------------------- | ---------------------------------------- |
| `urbancar.auth.token`           | JWT emitido por el backend               |
| `urbancar.auth.user`            | Snapshot del `AuthUser` autenticado      |
| `urbancar.booking.criteria`     | Filtros de búsqueda persistentes         |

## Paleta turquesa corporativa (WCAG 2.2 AA)

Definida en `tailwind.config.js`:

| Token         | HEX       | Uso                                                | Contraste sobre blanco |
| ------------- | --------- | -------------------------------------------------- | ---------------------- |
| `primary`     | `#00CED1` | Color de marca · sólo decorativo                   | —                      |
| `primary-700` | `#007577` | Botones primarios + texto blanco encima            | 5.55 : 1 (AA)          |
| `primary-800` | `#005A5C` | Hover / acentos oscuros                            | 8.20 : 1 (AAA)         |
| `primary-900` | `#003E40` | Sidebar admin, encabezados oscuros                 | 12.2 : 1 (AAA)         |
| `dark`        | `#005A5C` | Footer                                             | AAA                    |
| `ink`         | `#0F172A` | Texto principal                                    | —                      |

> No se utilizan tonos verdes ni emojis en ninguna parte de la UI.
> Todos los iconos provienen de **lucide-angular**.

## Scripts

```bash
npm install              # instala dependencias
npm start                # ng serve --proxy-config proxy.conf.json (http://localhost:4200)
npm run build            # build producción
```

`proxy.conf.json` redirige `/api/v1` al backend (`http://localhost:3000`)
durante desarrollo, evitando CORS.

## Variables de entorno (front)

`src/environments/environment.ts`

```ts
export const environment = {
  production: false,
  apiUrl: '/api/v1',
  appName: 'UrbanCar EC',
  adminCode: 'PUCE2026',
};
```

`src/environments/environment.prod.ts`

```ts
export const environment = {
  production: true,
  apiUrl: 'https://api.urbancar.ec/api/v1',
  appName: 'UrbanCar EC',
  adminCode: 'PUCE2026',
};
```
