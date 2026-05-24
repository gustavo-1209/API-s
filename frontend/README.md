# RentWheels — Frontend (Vue 3)

Frontend del marketplace y panel administrativo de **RentWheels**. Todas las peticiones HTTP pasan por **bus-service** (API Gateway); el cliente no se conecta directamente a microservicios internos.

## Stack

- Vue 3 + TypeScript
- Vite
- Tailwind CSS
- Pinia
- Vue Router
- Axios

## Arquitectura

```
Frontend (Vue)  →  bus-service  →  admin / booking
```

- **adminApi** (`VITE_ADMIN_API_BASE_URL`): autenticación admin, inventario y operaciones de administración.
- **clientApi** (`VITE_CLIENT_API_BASE_URL`): registro e inicio de sesión de clientes.
- **bookingApi** (`VITE_BOOKING_API_BASE_URL`): catálogo marketplace y reservas del cliente.

Los alias `api` y `apiClient` apuntan temporalmente a `bookingApi` por compatibilidad.

## Variables de entorno

Copia `.env.example` a `.env` y ajusta las URLs si cambia el despliegue. **No subas `.env` al repositorio.**

| Variable | Descripción |
|----------|-------------|
| `VITE_ADMIN_API_BASE_URL` | Base URL del prefijo admin en bus-service |
| `VITE_BOOKING_API_BASE_URL` | Base URL del prefijo booking en bus-service |
| `VITE_CLIENT_API_BASE_URL` | Base URL del prefijo cliente (registro/login) en bus-service |

Ejemplo en `.env.example`:

```env
VITE_ADMIN_API_BASE_URL=https://bus-service.example.com/api/v1/gustavobenalcazar/admin
VITE_BOOKING_API_BASE_URL=https://bus-service.example.com/api/v1/gustavobenalcazar/booking
```

## Comandos

```bash
npm install
npm run dev
npm run build
```

- **dev**: http://localhost:5173
- **build**: `vue-tsc` + bundle en `dist/`

## Rutas principales

| Área | Rutas |
|------|--------|
| Cliente | `/` o `/marketplace`, `/login`, `/register` o `/registro`, `/reserva/:vehiculoId`, `/no-autorizado` o `/unauthorized` |
| Admin | `/admin`, `/admin/vehiculos`, `/admin/reservas`, `/admin/pagos`, `/admin/facturas`, `/admin/mantenimientos`, `/admin/kardex` |

## Módulos implementados

| Módulo | Descripción |
|--------|-------------|
| **Login** | Autenticación admin (`adminApi`) y cliente (`clientApi`, fallback tras 401 admin) |
| **Registro cliente** | Alta pública vía `clientApi` → `/auth/register` |
| **Marketplace** | Catálogo de vehículos (Booking Gateway) |
| **Reserva cliente** | Detalle, catálogos (seguro, tarifa, canal) y creación de reserva |
| **Panel admin** | Dashboard con indicadores |
| **Tablas admin (lectura)** | Vehículos, reservas, pagos, facturas, mantenimientos, kardex |

> CRUD de administración no está incluido en esta entrega; el panel es solo consulta.

## Desarrollo local

Configura `.env` apuntando al bus-service desplegado o al proxy local. No apuntes el frontend a puertos internos de microservicios.

En modo `dev`, el panel admin puede registrar en consola las **keys** del primer registro de cada endpoint (sin datos sensibles) para depurar mapeos.
