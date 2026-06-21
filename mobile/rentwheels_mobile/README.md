# RentWheels Mobile



App móvil cliente de **RentWheels** con autenticación real, catálogo GraphQL y reservas.



## API Gateway



**URL base:** `https://bus-service.politebay-268e19e8.eastus.azurecontainerapps.io`



| Recurso | URL |

|---------|-----|

| Cliente REST | `/api/v1/gustavobenalcazar/cliente` |

| GraphQL | `/graphql` |



## Autenticación cliente (real)



| Acción | Método | Endpoint |

|--------|--------|----------|

| Login | `POST` | `/api/v1/gustavobenalcazar/cliente/auth/login` |

| Registro | `POST` | `/api/v1/gustavobenalcazar/cliente/auth/register` |



La sesión (token, clienteId, nombre, email) se guarda en `shared_preferences`.



## GraphQL conectado



| Operación | Uso |

|-----------|-----|

| `vehiculosDisponibles` | Catálogo |

| `vehiculo(id)` | Detalle |

| `disponibilidadVehiculo(id)` | Validación pre-reserva |

| `crearReserva(input)` | Crear reserva (requiere sesión) |



Las peticiones GraphQL envían `Authorization: Bearer <token>` cuando hay sesión activa.



## Sincronización de catálogo



### Ocultamiento optimista (tras reservar)



1. El `vehicleId` se guarda en `rentwheels_reserved_vehicle_ids`.

2. El vehículo desaparece de inmediato en la UI.

3. Se refresca `vehiculosDisponibles` desde GraphQL.



### GraphQL como fuente de verdad (al refrescar)



Al cargar o actualizar el catálogo:



1. Se consulta `vehiculosDisponibles`.

2. Se reconcilian los IDs ocultos localmente.

3. Si un vehículo oculto localmente **vuelve a aparecer** en GraphQL con `disponible == true` y `status == DISPONIBLE`, se elimina de la lista local y **vuelve a mostrarse**.



Esto permite que, cuando el panel admin completa una reserva/devolución y el backend marca el vehículo como DISPONIBLE, Flutter lo muestre de nuevo al pulsar **Actualizar**, al volver al catálogo, o al iniciar/cerrar sesión.



### Cancelación local



Al cancelar una reserva **pendiente** (solo local), se elimina el `vehicleId` de la lista oculta y se recarga el catálogo.



**Pendiente futuro:** WebSocket `vehiculo:actualizado` y cancelación real en backend.



## Limpiar datos locales (pruebas)



En **Perfil → Limpiar datos locales** se borran:



- Carrito

- Reservas locales

- Vehículos ocultos localmente



No cierra la sesión. Pide confirmación antes de ejecutar.



## Qué sigue local



- **Carrito** → `shared_preferences`

- **Mis reservas** → local (pendiente `misReservas(clienteId)`)

- **Cancelar reserva** → solo local



## Comandos



```bash

flutter pub get

flutter analyze

flutter test

flutter run -d chrome --dart-define=API_GATEWAY_URL=https://bus-service.politebay-268e19e8.eastus.azurecontainerapps.io

```



## Pruebas manuales



1. Reservar vehículo → desaparece del catálogo.

2. Desde admin web, completar reserva/devolución hasta que el vehículo esté DISPONIBLE.

3. En Flutter, pulsar **Actualizar** en catálogo → el vehículo debe volver a aparecer.

4. Cancelar reserva pendiente local → vehículo vuelve al catálogo.

5. Perfil → **Limpiar datos locales** → carrito y reservas vacíos, catálogo reconciliado.

