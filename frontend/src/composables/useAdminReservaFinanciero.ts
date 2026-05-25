import { isAxiosError } from 'axios';
import { adminApi, bookingApi } from '@/api/api';
import { unwrapApiList } from '@/lib/api-unwrap';
import {
  normalizeAdminFacturaDetalle,
  normalizeAdminPagoDetalle,
  normalizeRegistrarPagoResponse,
} from '@/mappers/admin.mapper';
import { normalizePaymentResponse, paymentStatusLabel } from '@/mappers/reserva.mapper';
import type {
  AdminFactura,
  AdminPago,
  AdminReservaRow,
  RegistrarPagoRequest,
  RegistrarPagoResponse,
  ResumenPagoReserva,
} from '@/types/admin';

const MSG_PAGOS = 'No se pudieron cargar los pagos de esta reserva.';
const MSG_FACTURAS = 'No se pudieron cargar las facturas de esta reserva.';
const MSG_RESUMEN = 'No se pudo cargar el resumen de pago.';

const EPSILON_MONTO = 0.01;

export class FinancieroAdminError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'FinancieroAdminError';
  }
}

function messageFromResponseData(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const record = data as Record<string, unknown>;

  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message;
  }

  const error = record.error;
  if (error && typeof error === 'object') {
    const msg = (error as { message?: string }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }

  return undefined;
}

function extractErrorMessage(err: unknown, fallback: string): FinancieroAdminError {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    const backendMsg = messageFromResponseData(err.response?.data);

    if (!err.response) {
      return new FinancieroAdminError('No se pudo conectar con el servidor.');
    }

    return new FinancieroAdminError(backendMsg ?? fallback, status);
  }

  if (err instanceof Error) {
    return new FinancieroAdminError(err.message);
  }

  return new FinancieroAdminError(fallback);
}

function assertSuccessWrapper(data: unknown, fallback: string): void {
  if (
    data &&
    typeof data === 'object' &&
    'success' in data &&
    (data as { success?: boolean }).success === false
  ) {
    const record = data as { error?: { message?: string }; message?: string };
    throw new FinancieroAdminError(
      record.error?.message ?? record.message ?? fallback,
    );
  }
}

/** Convierte montos formateados ($72.00) o numéricos a número. */
export function parseMonedaDisplay(value: string | number | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = String(value ?? '')
    .trim()
    .replace(/[^\d.,-]/g, '')
    .replace(',', '.');
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

export function totalReservaNumero(reserva: AdminReservaRow): number {
  return parseMonedaDisplay(reserva.total);
}

export function calcularMontoPendiente(
  reserva: AdminReservaRow,
  resumen: ResumenPagoReserva | null,
): number | null {
  const total = totalReservaNumero(reserva);
  if (total <= 0) return null;

  const pagado = resumen?.totalPagadoNumero ?? 0;
  const pendiente = Math.round((total - pagado) * 100) / 100;
  return pendiente > EPSILON_MONTO ? pendiente : 0;
}

export function esPagoCompleto(
  reserva: AdminReservaRow,
  resumen: ResumenPagoReserva | null,
): boolean {
  if (resumen?.status === 'COMPLETADO') return true;

  const total = totalReservaNumero(reserva);
  if (total <= 0) return false;

  const pagado = resumen?.totalPagadoNumero ?? 0;
  return pagado >= total - EPSILON_MONTO;
}

export function puedeRegistrarPagoReserva(
  reserva: AdminReservaRow,
  resumen: ResumenPagoReserva | null,
): boolean {
  if (reserva.estado.trim().toUpperCase() === 'CANCELADA') return false;
  return !esPagoCompleto(reserva, resumen);
}

function resolveSectionError(err: unknown, fallback: string): string {
  if (isAxiosError(err) && !err.response) {
    return 'No se pudo conectar con el servidor.';
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  return fallback;
}

function formatTotalPagado(value: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export async function obtenerPagosPorReserva(reservaId: string): Promise<AdminPago[]> {
  const { data } = await adminApi.get<unknown>('/pagos', {
    params: { reservaId, page: 1, limit: 100 },
  });

  const rawList = unwrapApiList<unknown>(data);
  return rawList
    .map(normalizeAdminPagoDetalle)
    .filter((row): row is AdminPago => row !== null);
}

export async function obtenerFacturasPorReserva(reservaId: string): Promise<AdminFactura[]> {
  const { data } = await adminApi.get<unknown>('/facturas', {
    params: { reservaId, page: 1, limit: 100 },
  });

  const rawList = unwrapApiList<unknown>(data);
  return rawList
    .map(normalizeAdminFacturaDetalle)
    .filter((row): row is AdminFactura => row !== null);
}

/** Resumen booking; devuelve null si falla (no lanza). */
export async function obtenerResumenPago(reservaId: string): Promise<ResumenPagoReserva | null> {
  try {
    const { data } = await bookingApi.get<unknown>(`/payment/${reservaId}`);
    const payment = normalizePaymentResponse(data, reservaId);

    return {
      reservaId: payment.reservaId,
      status: payment.status,
      statusLabel: paymentStatusLabel(payment.status),
      totalPagado: formatTotalPagado(payment.totalPagado),
      totalPagadoNumero: payment.totalPagado,
      cantidadPagos: payment.pagos.length,
    };
  } catch {
    return null;
  }
}

export interface CargarDetalleFinancieroResult {
  pagos: AdminPago[];
  pagosError: string | null;
  facturas: AdminFactura[];
  facturasError: string | null;
  resumenPago: ResumenPagoReserva | null;
  resumenPagoError: string | null;
}

/** Carga pagos, facturas y resumen en paralelo; errores aislados por sección. */
export async function cargarDetalleFinancieroReserva(
  reservaId: string,
): Promise<CargarDetalleFinancieroResult> {
  const [pagosSettled, facturasSettled, resumenSettled] = await Promise.allSettled([
    obtenerPagosPorReserva(reservaId),
    obtenerFacturasPorReserva(reservaId),
    obtenerResumenPago(reservaId),
  ]);

  let pagos: AdminPago[] = [];
  let pagosError: string | null = null;
  if (pagosSettled.status === 'fulfilled') {
    pagos = pagosSettled.value;
  } else {
    pagosError = resolveSectionError(pagosSettled.reason, MSG_PAGOS);
  }

  let facturas: AdminFactura[] = [];
  let facturasError: string | null = null;
  if (facturasSettled.status === 'fulfilled') {
    facturas = facturasSettled.value;
  } else {
    facturasError = resolveSectionError(facturasSettled.reason, MSG_FACTURAS);
  }

  let resumenPago: ResumenPagoReserva | null = null;
  let resumenPagoError: string | null = null;
  if (resumenSettled.status === 'fulfilled') {
    resumenPago = resumenSettled.value;
    if (!resumenPago) {
      resumenPagoError = MSG_RESUMEN;
    }
  } else {
    resumenPagoError = resolveSectionError(resumenSettled.reason, MSG_RESUMEN);
  }

  return {
    pagos,
    pagosError,
    facturas,
    facturasError,
    resumenPago,
    resumenPagoError,
  };
}

/** Recarga solo pagos y resumen booking (tras registrar pago). */
export async function recargarPagosYResumenReserva(
  reservaId: string,
): Promise<Pick<CargarDetalleFinancieroResult, 'pagos' | 'pagosError' | 'resumenPago' | 'resumenPagoError'>> {
  const [pagosSettled, resumenSettled] = await Promise.allSettled([
    obtenerPagosPorReserva(reservaId),
    obtenerResumenPago(reservaId),
  ]);

  let pagos: AdminPago[] = [];
  let pagosError: string | null = null;
  if (pagosSettled.status === 'fulfilled') {
    pagos = pagosSettled.value;
  } else {
    pagosError = resolveSectionError(pagosSettled.reason, MSG_PAGOS);
  }

  let resumenPago: ResumenPagoReserva | null = null;
  let resumenPagoError: string | null = null;
  if (resumenSettled.status === 'fulfilled') {
    resumenPago = resumenSettled.value;
    if (!resumenPago) {
      resumenPagoError = MSG_RESUMEN;
    }
  } else {
    resumenPagoError = resolveSectionError(resumenSettled.reason, MSG_RESUMEN);
  }

  return { pagos, pagosError, resumenPago, resumenPagoError };
}

export async function registrarPagoReserva(
  payload: RegistrarPagoRequest,
): Promise<RegistrarPagoResponse> {
  try {
    const { data } = await adminApi.post<unknown>('/pagos', payload);
    assertSuccessWrapper(data, 'No se pudo registrar el pago.');
    return normalizeRegistrarPagoResponse(data);
  } catch (err: unknown) {
    if (err instanceof FinancieroAdminError) throw err;
    throw extractErrorMessage(err, 'No se pudo registrar el pago. Intenta de nuevo.');
  }
}

export function mensajeErrorRegistrarPago(err: FinancieroAdminError): string {
  if (err.status === 401 || err.status === 403) {
    return 'Tu sesión expiró o no tienes permisos para registrar pagos.';
  }
  if (err.status === 404) {
    return 'Reserva no encontrada.';
  }
  if (err.status === 422) {
    return err.message || 'No se puede registrar el pago para esta reserva o el monto no es válido.';
  }
  if (err.status === 400) {
    return err.message || 'Datos inválidos para registrar el pago.';
  }
  return err.message || 'No se pudo registrar el pago. Intenta de nuevo.';
}
