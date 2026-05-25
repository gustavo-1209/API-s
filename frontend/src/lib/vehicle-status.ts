/** Normaliza el status del inventario para comparaciones. */
export function normalizeVehicleStatus(status: string | null | undefined): string {
  return (status ?? '').trim().toUpperCase();
}

/** Etiqueta legible; no modifica el valor real del backend. */
export function vehicleStatusLabel(status: string | null | undefined): string {
  const s = normalizeVehicleStatus(status);
  switch (s) {
    case 'DISPONIBLE':
    case 'AVAILABLE':
      return 'Disponible';
    case 'RESERVADO':
      return 'En uso / reservado';
    case 'EN_USO':
      return 'En uso';
    case 'MANTENIMIENTO':
      return 'Mantenimiento';
    case 'INACTIVO':
      return 'Inactivo';
    case 'NO DISPONIBLE':
      return 'No disponible';
    default:
      return s || '—';
  }
}

/** Clases Tailwind para el badge de estado. */
export function vehicleStatusBadgeClass(status: string | null | undefined): string {
  const s = normalizeVehicleStatus(status);
  switch (s) {
    case 'DISPONIBLE':
    case 'AVAILABLE':
      return 'bg-emerald-100 text-emerald-800';
    case 'RESERVADO':
    case 'EN_USO':
      return 'bg-amber-100 text-amber-900';
    case 'MANTENIMIENTO':
      return 'bg-orange-100 text-orange-900';
    case 'INACTIVO':
      return 'bg-slate-100 text-slate-600';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

/** Solo DISPONIBLE / AVAILABLE permiten iniciar reserva en marketplace. */
export function isVehiculoReservable(status: string | null | undefined): boolean {
  const s = normalizeVehicleStatus(status);
  return s === 'DISPONIBLE' || s === 'AVAILABLE';
}

/** Campos mínimos para la UI del marketplace (tarjeta o DTO). */
export interface VehiculoMarketplaceUi {
  status?: string | null;
  disponible?: boolean;
  disponibleParaReserva?: boolean;
  reservaActiva?: boolean;
  motivoNoDisponible?: string | null;
}

/** Hay reserva en curso (PENDIENTE/CONFIRMADA) aunque inventario siga DISPONIBLE. */
export function vehiculoEnProcesoDeReserva(vehiculo: VehiculoMarketplaceUi): boolean {
  if (vehiculo.reservaActiva === true) return true;
  if (vehiculo.disponibleParaReserva === false) return true;
  return false;
}

/** Puede abrir el flujo de reserva desde el marketplace. */
export function isVehiculoReservableEnMarketplace(vehiculo: VehiculoMarketplaceUi): boolean {
  if (vehiculo.disponible === false) return false;
  if (vehiculoEnProcesoDeReserva(vehiculo)) return false;
  return isVehiculoReservable(vehiculo.status);
}

/** Texto del badge en la tarjeta del catálogo. */
export function vehicleMarketplaceLabel(vehiculo: VehiculoMarketplaceUi): string {
  if (vehiculoEnProcesoDeReserva(vehiculo)) {
    return 'En proceso de reserva';
  }
  const s = normalizeVehicleStatus(vehiculo.status);
  if (s === 'DISPONIBLE' || s === 'AVAILABLE') {
    return 'Disponible para consultar';
  }
  return vehicleStatusLabel(vehiculo.status);
}

/** Clases del badge en la tarjeta del catálogo. */
export function vehicleMarketplaceBadgeClass(vehiculo: VehiculoMarketplaceUi): string {
  if (vehiculoEnProcesoDeReserva(vehiculo)) {
    return 'bg-amber-100 text-amber-900';
  }
  const s = normalizeVehicleStatus(vehiculo.status);
  if (s === 'DISPONIBLE' || s === 'AVAILABLE') {
    return 'bg-emerald-100 text-emerald-800';
  }
  return vehicleStatusBadgeClass(vehiculo.status);
}

/** Etiqueta del botón principal de la tarjeta. */
export function vehicleMarketplaceButtonLabel(vehiculo: VehiculoMarketplaceUi): string {
  if (isVehiculoReservableEnMarketplace(vehiculo)) {
    return 'Ver disponibilidad';
  }
  if (vehiculoEnProcesoDeReserva(vehiculo)) {
    return 'No disponible para reservar';
  }
  const s = normalizeVehicleStatus(vehiculo.status);
  if (s === 'DISPONIBLE' || s === 'AVAILABLE') {
    return 'No disponible para reservar';
  }
  return vehicleMarketplaceLabel(vehiculo);
}

/**
 * Texto auxiliar bajo el botón o title del badge.
 * Prioriza motivoNoDisponible del backend; si no, mensaje genérico en bloqueo por reserva.
 */
export function vehicleMarketplaceMotivoHint(vehiculo: VehiculoMarketplaceUi): string | null {
  const motivo = vehiculo.motivoNoDisponible?.trim();
  if (motivo) return motivo;
  if (vehiculoEnProcesoDeReserva(vehiculo) && isVehiculoReservable(vehiculo.status)) {
    return 'No disponible para reservar';
  }
  return null;
}
