import { unwrapApiData } from '@/lib/api-unwrap';
import type {
  CrearReservaResponse,
  PaymentResponse,
  PagoResumenItem,
  PaymentStatus,
  ReservaDetalleResponse,
  ReservaEstado,
} from '@/types/reserva';

export function calcularDiasReserva(fechaInicio: string, fechaFin: string): number {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const ms = fin.getTime() - inicio.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function calcularTotalReserva(precioDia: number, dias: number): number {
  if (!Number.isFinite(precioDia) || dias <= 0) return 0;
  return Math.round(precioDia * dias * 100) / 100;
}

function asRecord(raw: unknown): Record<string, unknown> {
  return raw !== null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

function getString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function getNumber(record: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (value === null || value === undefined) continue;
    const n = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function getAmount(record: Record<string, unknown>, keys: string[]): number | string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (value === null || value === undefined) continue;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function mapReservaCore(raw: Record<string, unknown>): {
  id: string;
  codigoReserva?: string;
  vehiculoId?: string;
  clienteId?: string;
  agenciaId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  diasTotal?: number;
  totalAmount?: number | string;
  status?: ReservaEstado;
} {
  const id = getString(raw, ['id', 'reservaId']);
  const statusRaw = getString(raw, ['status', 'estado']);

  return {
    id,
    codigoReserva: getString(raw, ['codigoReserva', 'codigo']) || undefined,
    vehiculoId: getString(raw, ['vehiculoId', 'veh_id']) || undefined,
    clienteId: getString(raw, ['clienteId', 'usuarioId', 'cli_id']) || undefined,
    agenciaId: getString(raw, ['agenciaId', 'age_id']) || undefined,
    fechaInicio: getString(raw, ['fechaInicio', 'res_fecha_inicio']) || undefined,
    fechaFin: getString(raw, ['fechaFin', 'res_fecha_fin']) || undefined,
    diasTotal: getNumber(raw, ['diasTotal', 'dias_total']),
    totalAmount: getAmount(raw, ['totalAmount', 'res_total', 'total']),
    status: (statusRaw || undefined) as ReservaEstado | undefined,
  };
}

/** Normaliza POST /reservas. */
export function normalizeCrearReservaResponse(body: unknown): CrearReservaResponse {
  const raw = asRecord(unwrapApiData<unknown>(body));
  const core = mapReservaCore(raw);

  if (!core.id) {
    throw new Error('Respuesta inválida del servidor de reservas.');
  }

  return {
    id: core.id,
    codigoReserva: core.codigoReserva,
    vehiculoId: core.vehiculoId,
    clienteId: core.clienteId,
    fechaInicio: core.fechaInicio,
    fechaFin: core.fechaFin,
    diasTotal: core.diasTotal,
    totalAmount: core.totalAmount,
    status: core.status ?? 'PENDIENTE',
  };
}

/** Normaliza GET /reservas/{id}. */
export function normalizeReservaDetalleResponse(body: unknown): ReservaDetalleResponse {
  const raw = asRecord(unwrapApiData<unknown>(body));
  const core = mapReservaCore(raw);

  if (!core.id) {
    throw new Error('Respuesta inválida al consultar la reserva.');
  }

  return {
    id: core.id,
    codigoReserva: core.codigoReserva,
    vehiculoId: core.vehiculoId,
    clienteId: core.clienteId,
    agenciaId: core.agenciaId,
    fechaInicio: core.fechaInicio,
    fechaFin: core.fechaFin,
    diasTotal: core.diasTotal,
    totalAmount: core.totalAmount,
    status: core.status ?? 'PENDIENTE',
  };
}

function mapPagoItem(raw: unknown): PagoResumenItem | null {
  const r = asRecord(raw);
  const id = getString(r, ['id']);
  if (!id) return null;

  return {
    id,
    monto: r.monto as number | string | undefined,
    metodoPago: getString(r, ['metodoPago', 'metodo']) || undefined,
    referencia: getString(r, ['referencia']) || undefined,
    status: getString(r, ['status', 'estado']) || undefined,
  };
}

/** Normaliza GET /payment/{reservaId}. */
export function normalizePaymentResponse(body: unknown, reservaId: string): PaymentResponse {
  const raw = asRecord(unwrapApiData<unknown>(body));

  const statusRaw = getString(raw, ['status', 'estado']) || 'SIN_PAGOS';
  const totalPagado = getNumber(raw, ['totalPagado', 'total_pagado']) ?? 0;

  const pagosRaw = raw.pagos;
  const pagos = Array.isArray(pagosRaw)
    ? pagosRaw.map(mapPagoItem).filter((p): p is PagoResumenItem => p !== null)
    : [];

  return {
    reservaId: getString(raw, ['reservaId']) || reservaId,
    status: statusRaw as PaymentStatus,
    totalPagado,
    pagos,
  };
}

/** Etiqueta legible del estado de pago. */
export function paymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case 'SIN_PAGOS':
      return 'Sin pagos registrados';
    case 'PENDIENTE':
      return 'Pago pendiente';
    case 'COMPLETADO':
      return 'Pago completado';
    case 'PARCIAL':
      return 'Pago parcial';
    default:
      return status;
  }
}

/** Mensaje orientado al usuario según estado de pago. */
export function paymentStatusHint(status: PaymentStatus): string {
  if (status === 'SIN_PAGOS') {
    return 'La reserva fue creada y queda pendiente de pago o confirmación.';
  }
  if (status === 'PENDIENTE') {
    return 'Hay un pago registrado que aún está pendiente de completarse.';
  }
  if (status === 'COMPLETADO') {
    return 'El pago asociado a esta reserva fue registrado como completado.';
  }
  if (status === 'PARCIAL') {
    return 'Se registró un pago parcial. Puede requerirse un saldo adicional.';
  }
  return 'Consulta el estado de pago con el equipo de RentWheels si tienes dudas.';
}
