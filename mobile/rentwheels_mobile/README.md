# RentWheels Mobile

App móvil cliente de **RentWheels**, marketplace de renta de vehículos. Esta fase implementa la experiencia completa del usuario con datos mock y almacenamiento local, sin conexión a APIs reales.

## Descripción

RentWheels Mobile permite explorar un catálogo de vehículos, agregarlos al carrito con fechas de renta, crear reservas locales y gestionar cancelaciones de reservas pendientes. Incluye pantalla de inicio, perfil básico y navegación inferior tipo app de producción.

## Flujo implementado

1. **Inicio** — Hero de marca, propuesta de valor, beneficios y pasos de “Cómo funciona”.
2. **Catálogo** — Lista de vehículos mock con estado visual y acciones según disponibilidad.
3. **Detalle** — Información completa del vehículo, selector de fechas y agregar al carrito.
4. **Carrito** — Items persistidos localmente, total estimado y creación de reserva.
5. **Mis reservas** — Listado local con cancelación solo para reservas `pendiente`.
6. **Perfil** — Datos mock del cliente con login/logout visual (sin auth real).

## Dependencias

| Paquete | Uso |
|---------|-----|
| `go_router` | Navegación declarativa y bottom navigation con `StatefulShellRoute` |
| `provider` | Estado global de carrito y reservas |
| `shared_preferences` | Persistencia local de carrito y reservas |
| `intl` | Formato de fechas y moneda |

## Qué funciona con mock / local

- **Vehículos**: `MockVehicleService` + `lib/mocks/mock_vehicles.dart`
- **Carrito**: `LocalCartService` → `shared_preferences`
- **Reservas**: `LocalReservationService` → `shared_preferences`
- **Perfil / auth**: estado visual en memoria, sin backend

## Pendiente para APIs reales

- Reemplazar `MockVehicleService` por cliente GraphQL/gRPC/API Gateway
- Sincronizar carrito y reservas con backend
- Autenticación real (JWT, OAuth, etc.)
- Validación de disponibilidad en tiempo real
- Eventos internos vía RabbitMQ (confirmaciones, cambios de estado)
- Imágenes desde CDN o storage del backend

## Estructura

```
lib/
├── main.dart
├── app/           # App, rutas y tema
├── features/      # Pantallas por feature
├── shared/        # Modelos, servicios, estado y widgets
└── mocks/         # Datos mock de vehículos
```

## Comandos

```bash
flutter pub get
flutter analyze
flutter run -d chrome
```

Para dispositivo físico o emulador:

```bash
flutter run
```

## Pruebas manuales recomendadas

1. Abrir Inicio y pulsar “Buscar vehículo” → debe ir al Catálogo.
2. Agregar un vehículo disponible al carrito desde catálogo o detalle.
3. Verificar que un vehículo no disponible muestra botón deshabilitado.
4. Crear reserva desde Carrito → redirección a Mis reservas + SnackBar.
5. Cancelar una reserva pendiente con confirmación.
6. Verificar que reservas no pendientes no muestran botón cancelar.
7. Cerrar y reabrir la app (Chrome) → carrito y reservas persisten.
