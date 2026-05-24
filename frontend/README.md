# RentWheels — Frontend (Vue 3)

Frontend del **marketplace** de alquiler de vehículos y del **panel administrativo** de RentWheels. Todas las peticiones HTTP pasan por **bus-service** (API Gateway); el cliente no se conecta directamente a los microservicios internos.

## Stack

- Vue 3 + TypeScript
- Vite
- Tailwind CSS
- Pinia
- Vue Router
- Axios

## Arquitectura

```
┌─────────────┐     ┌──────────────┐     ┌────────────────────────────────────┐
│  Vue 3 SPA  │ ──► │  bus-service │ ──► │  Microservicios (vía gateway)      │
│  (frontend) │     │  (gateway)   │     │  auth, inventario, operaciones,    │
└─────────────┘     └──────────────┘     │  financiero, org, mantenimiento…   │
                                         └────────────────────────────────────┘
```

| Cliente Axios | Prefijo gateway | Uso principal |
|---------------|-----------------|---------------|
| `adminApi` | `/admin` | Login admin, panel administrativo (lectura) |
| `clientApi` | `/cliente` | Registro e inicio de sesión de clientes |
| `bookingApi` | `/booking` | Marketplace, reservas, disponibilidad, pagos |

Los alias `api` y `apiClient` apuntan temporalmente a `bookingApi` por compatibilidad con código legacy.

## Variables de entorno

Copia `frontend/.env.example` a `frontend/.env` y ajusta las URLs según tu despliegue. **No subas `.env` al repositorio** (está en `.gitignore`).

| Variable | Descripción |
|----------|-------------|
| `VITE_ADMIN_API_BASE_URL` | Base URL del prefijo **admin** en bus-service |
| `VITE_BOOKING_API_BASE_URL` | Base URL del prefijo **booking** en bus-service |
| `VITE_CLIENT_API_BASE_URL` | Base URL del prefijo **cliente** en bus-service |

Ejemplo (sustituye el host por el de tu entorno):

```env
VITE_ADMIN_API_BASE_URL=https://<bus-service>/api/v1/<tenant>/admin
VITE_BOOKING_API_BASE_URL=https://<bus-service>/api/v1/<tenant>/booking
VITE_CLIENT_API_BASE_URL=https://<bus-service>/api/v1/<tenant>/cliente
```

## Comandos

Desde la carpeta `frontend/`:

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # vue-tsc + bundle en dist/
npm run preview  # vista previa del build de producción
```

## Rutas principales

| Área | Rutas |
|------|--------|
| **Cliente** | `/` o `/marketplace`, `/login`, `/register` o `/registro`, `/reserva/:vehiculoId`, `/no-autorizado` o `/unauthorized` |
| **Admin** | `/admin`, `/admin/vehiculos`, `/admin/reservas`, `/admin/pagos`, `/admin/facturas`, `/admin/mantenimientos`, `/admin/kardex` |

## Módulos implementados

| Módulo | Descripción |
|--------|-------------|
| **Login** | Admin vía `adminApi`; cliente vía `clientApi` (fallback si admin responde 401) |
| **Registro cliente** | Alta pública en `/register` → `clientApi` `/auth/register` |
| **Marketplace** | Catálogo de vehículos (`bookingApi` / inventario) |
| **Reserva cliente** | Detalle del vehículo, catálogos (seguro, tarifa, canal), **crear reserva** (`POST /reservas`), consulta de detalle (`GET /reservas/{id}`) y estado de pago (`GET /payment/{id}`), verificación opcional de disponibilidad (`GET /vehiculos/{id}/disponibilidad`), mensajes amigables ante conflicto por reserva activa |
| **Panel admin** | Dashboard con indicadores |
| **Tablas admin (solo lectura)** | Vehículos, reservas, pagos, facturas, mantenimientos, kardex |

**Fuera de alcance en esta entrega:** CRUD admin, `PATCH /reservas`, `POST /alquileres`, `POST /devoluciones`.

### Flujo de reserva (textos en UI)

- Formulario: **«Crear reserva»**
- Éxito: **«Reserva creada correctamente»** (estado típico del backend: **PENDIENTE**)
- Pago sin registros: **«Sin pagos registrados»** con mensaje de pendiente de pago o confirmación

## Despliegue

### Docker

Imagen multi-stage en `frontend/Dockerfile`: build con Node 20 y runtime **nginx** sirviendo `dist/`.

```bash
cd frontend
docker build \
  --build-arg VITE_ADMIN_API_BASE_URL=<url-admin> \
  --build-arg VITE_BOOKING_API_BASE_URL=<url-booking> \
  --build-arg VITE_CLIENT_API_BASE_URL=<url-cliente> \
  -t rentwheels-frontend .
```

Las variables `VITE_*` se inyectan en **tiempo de build** (no en runtime).

### GitHub Actions

Workflow `.github/workflows/frontend.yml`:

- Disparo: push a `main` (cambios en `frontend/` o el workflow) o `workflow_dispatch`
- Build y push de imagen al Azure Container Registry configurado en secrets del repositorio
- Mismos `build-arg` `VITE_*` que en Docker

## Usuarios de prueba

Las credenciales dependen del **seed o configuración del entorno** (auth-service / base de datos). **No incluyas contraseñas reales en este repositorio** si es público.

| Rol | Cómo obtener acceso |
|-----|---------------------|
| **Cliente** | Registro en `/register` o cuenta de prueba definida en tu entorno |
| **Admin** | Usuario administrador del entorno (consulta documentación interna o seed de `auth-service`) |

## Desarrollo local

1. Configura `frontend/.env` apuntando al **bus-service** desplegado (o proxy local).
2. No apuntes el frontend a puertos internos de microservicios.
3. En modo `dev`, el panel admin puede registrar en consola las **keys** del primer registro de cada endpoint (`logApiKeysInDev`) para depurar mapeos — **sin tokens ni contraseñas**.

## Seguridad

- `.env` y `.env.local` están ignorados por Git.
- No hay `console.log` de tokens ni datos sensibles en producción; los logs de depuración admin solo corren con `import.meta.env.DEV`.
