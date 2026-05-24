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

export type ReservaEstado =
  | 'PENDIENTE'
  | 'CONFIRMADA'
  | 'ACTIVA'
  | 'COMPLETADA'
  | 'CANCELADA'
  | (string & {});

export type PaymentStatus =
  | 'SIN_PAGOS'
  | 'PENDIENTE'
  | 'COMPLETADO'
  | 'PARCIAL'
  | (string & {});

export interface CrearReservaResponse {
  id: string;
  codigoReserva?: string;
  vehiculoId?: string;
  clienteId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  status?: ReservaEstado;
  totalAmount?: number | string;
  diasTotal?: number;
}

/** Detalle de GET /reservas/{id}. */
export interface ReservaDetalleResponse {
  id: string;
  codigoReserva?: string;
  vehiculoId?: string;
  clienteId?: string;
  agenciaId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  diasTotal?: number;
  totalAmount?: number | string;
  status: ReservaEstado;
}

export interface PagoResumenItem {
  id: string;
  monto?: number | string;
  metodoPago?: string;
  referencia?: string;
  status?: string;
}

/** Resumen de GET /payment/{reservaId}. */
export interface PaymentResponse {
  reservaId: string;
  status: PaymentStatus;
  totalPagado: number;
  pagos: PagoResumenItem[];
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
