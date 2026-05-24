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
