# Urban Car — Frontend (Vue 3)

Catálogo marketplace conectado a `inventario-service`.

## Desarrollo

```bash
# Terminal 1 — backend
cd inventario-service
npm run dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

Abre http://localhost:5173. Las peticiones a `/api/*` se proxean a `http://localhost:3002/api/v1/gustavobenalcazar/*`.

## Endpoint

`GET /api/vehiculos/marketplace` → vehículos con `status: DISPONIBLE`.

## Producción (nginx)

Configura `VITE_API_BASE_URL=/api/v1` y construye con `npm run build`.
