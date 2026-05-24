/** Catálogo: seguro (Booking Gateway). */
export interface Seguro {
  id: string;
  nombre?: string;
  descripcion?: string | null;
  precio?: number | string | null;
}

/** Catálogo: tarifa (Booking Gateway). */
export interface Tarifa {
  id: string;
  nombre?: string;
  descripcion?: string | null;
  monto?: number | string | null;
}

/** Catálogo: canal de venta (Booking Gateway). */
export interface CanalVenta {
  id: string;
  nombre?: string;
  codigo?: string | null;
}

/** Body de POST /reservas (Booking Gateway). */
export interface CrearReservaRequest {
  vehiculoId: string;
  clienteId: string;
  seguroId: string;
  tarifaId: string;
  canalVentaId: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface CrearReservaResponse {
  id: string;
  codigoReserva?: string;
  vehiculoId?: string;
  clienteId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  status?: string;
  totalAmount?: number | string;
}

export interface ReservaApiError {
  code?: string;
  message?: string;
}

export interface ReservaApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: ReservaApiError;
  message?: string;
}

/** @deprecated Solo usado por integraciones legacy; la reserva usa CrearReservaRequest. */
export interface ReservaFormModel {
  clienteId: string;
  vehiculoId: string;
  agenciaId: string;
  fechaInicio: string;
  fechaFin: string;
  total: number;
}
