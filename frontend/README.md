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

- **adminApi** (`VITE_ADMIN_API_BASE_URL`): autenticación, vehículos y operaciones de administración.
- **bookingApi** (`VITE_BOOKING_API_BASE_URL`): catálogo marketplace y reservas.

Los alias `api` y `apiClient` apuntan temporalmente a `bookingApi` por compatibilidad; en fases siguientes conviene migrar imports explícitos.

## Variables de entorno

Copia `.env.example` a `.env` y ajusta las URLs si cambia el despliegue:

| Variable | Descripción |
|----------|-------------|
| `VITE_ADMIN_API_BASE_URL` | Base URL del prefijo admin en bus-service |
| `VITE_BOOKING_API_BASE_URL` | Base URL del prefijo booking en bus-service |

Ejemplo:

```env
VITE_ADMIN_API_BASE_URL=https://bus-service.politebay-268e19e8.eastus.azurecontainerapps.io/api/v1/gustavobenalcazar/admin
VITE_BOOKING_API_BASE_URL=https://bus-service.politebay-268e19e8.eastus.azurecontainerapps.io/api/v1/gustavobenalcazar/booking
```

## Comandos

```bash
npm install
npm run dev
npm run build
```

- **dev**: servidor de desarrollo en http://localhost:5173
- **build**: comprobación TypeScript (`vue-tsc`) y bundle de producción en `dist/`

## Desarrollo local

Para desarrollo contra servicios locales, configura las variables en `.env` con las URLs del bus-service o del proxy que expongas; no apuntes el frontend a puertos internos de microservicios.
