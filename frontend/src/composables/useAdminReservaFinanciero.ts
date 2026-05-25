import { isAxiosError } from 'axios';
import { adminApi, bookingApi } from '@/api/api';
import { unwrapApiList } from '@/lib/api-unwrap';
import {
  normalizeAdminFacturaDetalle,
  normalizeAdminPagoDetalle,
  normalizeConfirmarPagoResponse,
  normalizeGenerarFacturaResponse,
  normalizeRegistrarPagoResponse,
} from '@/mappers/admin.mapper';
import { normalizePaymentResponse, paymentStatusLabel } from '@/mappers/reserva.mapper';
import type {
  AdminFactura,
  AdminPago,
  AdminReservaRow,
  ConfirmarPagoRequest,
  ConfirmarPagoResponse,
  GenerarFacturaRequest,
  GenerarFacturaResponse,
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

export interface TotalesPagoReserva {
  totalReserva: number;
  totalPagadoConfirmado: number;
  totalPagadoPendiente: number;
  /** COMPLETADO + PENDIENTE (comprometido para registrar nuevos pagos). */
  totalPagadoComprometido: number;
  /** Cuánto aún se puede registrar (considera pendientes + confirmados). */
  saldoDisponibleParaRegistrar: number;
  /** Cuánto falta confirmar para facturar (solo COMPLETADO vs total). */
  saldoPendienteParaFacturar: number;
  /** @deprecated Alias de saldoPendienteParaFacturar */
  saldoPendiente: number;
  reservaPagadaCompleta: boolean;
}

/** Totales basados en la lista admin de pagos (COMPLETADO / PENDIENTE). */
export function calcularTotalesPagoReserva(
  reserva: AdminReservaRow,
  pagos: AdminPago[],
): TotalesPagoReserva {
  const totalReserva = totalReservaNumero(reserva);
  let totalPagadoConfirmado = 0;
  let totalPagadoPendiente = 0;

  for (const pago of pagos) {
    const monto = parseMonedaDisplay(pago.monto);
    const estado = normalizarEstadoPago(pago.estado);
    if (estado === 'COMPLETADO') {
      totalPagadoConfirmado += monto;
    } else if (estado === 'PENDIENTE') {
      totalPagadoPendiente += monto;
    }
  }

  totalPagadoConfirmado = Math.round(totalPagadoConfirmado * 100) / 100;
  totalPagadoPendiente = Math.round(totalPagadoPendiente * 100) / 100;
  const totalPagadoComprometido =
    Math.round((totalPagadoConfirmado + totalPagadoPendiente) * 100) / 100;
  const saldoDisponibleParaRegistrar = Math.max(
    0,
    Math.round((totalReserva - totalPagadoComprometido) * 100) / 100,
  );
  const saldoPendienteParaFacturar = Math.max(
    0,
    Math.round((totalReserva - totalPagadoConfirmado) * 100) / 100,
  );

  return {
    totalReserva,
    totalPagadoConfirmado,
    totalPagadoPendiente,
    totalPagadoComprometido,
    saldoDisponibleParaRegistrar,
    saldoPendienteParaFacturar,
    saldoPendiente: saldoPendienteParaFacturar,
    reservaPagadaCompleta:
      totalReserva > 0 && totalPagadoConfirmado >= totalReserva - EPSILON_MONTO,
  };
}

/** Monto sugerido al registrar un nuevo pago (comprometido incluye PENDIENTE). */
export function calcularMontoPendiente(
  reserva: AdminReservaRow,
  pagos: AdminPago[],
): number | null {
  const { totalReserva, saldoDisponibleParaRegistrar } = calcularTotalesPagoReserva(
    reserva,
    pagos,
  );
  if (totalReserva <= 0) return null;
  return saldoDisponibleParaRegistrar > EPSILON_MONTO ? saldoDisponibleParaRegistrar : 0;
}

/** Reserva pagada cuando la suma de pagos COMPLETADO cubre el total. */
export function esPagoCompleto(reserva: AdminReservaRow, pagos: AdminPago[]): boolean {
  return calcularTotalesPagoReserva(reserva, pagos).reservaPagadaCompleta;
}

export function puedeRegistrarPagoReserva(
  reserva: AdminReservaRow,
  pagos: AdminPago[],
): boolean {
  if (reserva.estado.trim().toUpperCase() === 'CANCELADA') return false;
  const { totalReserva, totalPagadoComprometido, saldoDisponibleParaRegistrar } =
    calcularTotalesPagoReserva(reserva, pagos);
  if (totalReserva <= 0) return saldoDisponibleParaRegistrar > EPSILON_MONTO;
  return (
    totalPagadoComprometido < totalReserva - EPSILON_MONTO &&
    saldoDisponibleParaRegistrar > EPSILON_MONTO
  );
}

export type EstadoFinancieroReserva =
  | 'sin-pagos'
  | 'pago-pendiente'
  | 'pago-parcial'
  | 'pago-completo';

export function estadoFinancieroReserva(
  reserva: AdminReservaRow,
  pagos: AdminPago[],
): EstadoFinancieroReserva {
  const { totalPagadoConfirmado, totalPagadoPendiente, reservaPagadaCompleta } =
    calcularTotalesPagoReserva(reserva, pagos);

  if (pagos.length === 0 && totalPagadoConfirmado <= 0 && totalPagadoPendiente <= 0) {
    return 'sin-pagos';
  }
  if (reservaPagadaCompleta) {
    return 'pago-completo';
  }
  if (totalPagadoConfirmado > 0) {
    return 'pago-parcial';
  }
  if (totalPagadoPendiente > 0) {
    return 'pago-pendiente';
  }
  return 'sin-pagos';
}

export function etiquetaEstadoFinancieroReserva(estado: EstadoFinancieroReserva): string {
  switch (estado) {
    case 'sin-pagos':
      return 'Sin pagos registrados';
    case 'pago-pendiente':
      return 'Pago pendiente';
    case 'pago-parcial':
      return 'Pago parcial';
    case 'pago-completo':
      return 'Pago completo';
  }
}

export type EstadoUiGenerarFactura =
  | 'oculto-cancelada'
  | 'sin-pagos'
  | 'pagos-pendientes-confirmar'
  | 'pago-incompleto'
  | 'ya-emitida'
  | 'permitido';

export function normalizarEstadoPago(estado: string): string {
  return estado.trim().toUpperCase();
}

export function esPagoEstadoPendiente(estado: string): boolean {
  return normalizarEstadoPago(estado) === 'PENDIENTE';
}

/** Suma montos de pagos con status COMPLETADO (lista admin). */
export function totalMontoPagosCompletados(pagos: AdminPago[]): number {
  return pagos
    .filter((p) => normalizarEstadoPago(p.estado) === 'COMPLETADO')
    .reduce((sum, p) => sum + parseMonedaDisplay(p.monto), 0);
}

export function hayPagosPendientesSinCompletar(pagos: AdminPago[]): boolean {
  if (pagos.length === 0) return false;
  return !pagos.some((p) => normalizarEstadoPago(p.estado) === 'COMPLETADO');
}

/** Pendientes cubren el total pero aún no están confirmados (bloqueo de factura). */
export function pendientesCubrenTotalSinConfirmar(
  reserva: AdminReservaRow,
  pagos: AdminPago[],
): boolean {
  const t = calcularTotalesPagoReserva(reserva, pagos);
  return (
    t.totalPagadoPendiente > 0 &&
    t.totalPagadoComprometido >= t.totalReserva - EPSILON_MONTO &&
    t.totalPagadoConfirmado < t.totalReserva - EPSILON_MONTO
  );
}

/** Factura solo si pagos COMPLETADO cubren el total de la reserva. */
export function facturaPermitidaPorPagosCompletados(
  reserva: AdminReservaRow,
  pagos: AdminPago[],
): boolean {
  const { totalPagadoConfirmado, reservaPagadaCompleta } = calcularTotalesPagoReserva(
    reserva,
    pagos,
  );
  return totalPagadoConfirmado > 0 && reservaPagadaCompleta;
}

export function tienePagosRegistrados(
  pagos: AdminPago[],
  resumen: ResumenPagoReserva | null,
): boolean {
  return pagos.length > 0 || (resumen?.cantidadPagos ?? 0) > 0;
}

export function estadoUiGenerarFactura(
  reserva: AdminReservaRow,
  resumen: ResumenPagoReserva | null,
  pagos: AdminPago[],
  facturas: AdminFactura[],
): EstadoUiGenerarFactura {
  if (reserva.estado.trim().toUpperCase() === 'CANCELADA') {
    return 'oculto-cancelada';
  }
  if (facturas.length > 0) {
    return 'ya-emitida';
  }
  if (!tienePagosRegistrados(pagos, resumen)) {
    return 'sin-pagos';
  }
  if (facturaPermitidaPorPagosCompletados(reserva, pagos)) {
    return 'permitido';
  }
  if (pendientesCubrenTotalSinConfirmar(reserva, pagos)) {
    return 'pagos-pendientes-confirmar';
  }
  if (hayPagosPendientesSinCompletar(pagos)) {
    return 'pagos-pendientes-confirmar';
  }
  return 'pago-incompleto';
}

export function mensajeUiGenerarFactura(
  estado: EstadoUiGenerarFactura,
  reserva?: AdminReservaRow,
  pagos?: AdminPago[],
): string | null {
  switch (estado) {
    case 'sin-pagos':
      return 'Registra un pago antes de generar la factura.';
    case 'pagos-pendientes-confirmar':
      if (reserva && pagos && pendientesCubrenTotalSinConfirmar(reserva, pagos)) {
        return 'Confirma los pagos pendientes antes de generar la factura.';
      }
      return 'Confirma el pago antes de generar la factura.';
    case 'pago-incompleto':
      return 'La factura se recomienda cuando el pago esté completo.';
    case 'ya-emitida':
      return 'Factura emitida';
    default:
      return null;
  }
}

export interface ValoresPorDefectoFactura {
  descripcion: string;
  cantidad: number;
  precioUnit: number;
  razonSocial: string;
  rucCliente: string;
  pagoId?: string;
}

export function buildValoresPorDefectoFactura(
  reserva: AdminReservaRow,
  pagos: AdminPago[],
): ValoresPorDefectoFactura {
  const precioUnit = totalReservaNumero(reserva);
  const ultimoPago = pagos.length > 0 ? pagos[pagos.length - 1] : undefined;
  const cliente = reserva.cliente.trim();
  const razonSocial = cliente && cliente !== '—' ? cliente : '';

  return {
    descripcion: `Servicio de alquiler - ${reserva.vehiculo} - Reserva ${reserva.codigo}`,
    cantidad: 1,
    precioUnit: precioUnit > 0 ? precioUnit : 0,
    razonSocial,
    rucCliente: '',
    pagoId: ultimoPago?.id,
  };
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

/** Recarga pagos, facturas y resumen (tras generar factura). */
export async function recargarDetalleFinancieroCompleto(
  reservaId: string,
): Promise<CargarDetalleFinancieroResult> {
  return cargarDetalleFinancieroReserva(reservaId);
}

export async function generarFacturaReserva(
  payload: GenerarFacturaRequest,
): Promise<GenerarFacturaResponse> {
  try {
    const { data } = await adminApi.post<unknown>('/facturas', payload);
    assertSuccessWrapper(data, 'No se pudo generar la factura.');
    return normalizeGenerarFacturaResponse(data);
  } catch (err: unknown) {
    if (err instanceof FinancieroAdminError) throw err;
    throw extractErrorMessage(err, 'No se pudo generar la factura. Intenta de nuevo.');
  }
}

export async function confirmarPago(pagoId: string): Promise<ConfirmarPagoResponse> {
  const body: ConfirmarPagoRequest = { status: 'COMPLETADO' };

  try {
    const { data } = await adminApi.patch<unknown>(`/pagos/${pagoId}`, body);
    assertSuccessWrapper(data, 'No se pudo confirmar el pago.');
    return normalizeConfirmarPagoResponse(data);
  } catch (err: unknown) {
    if (err instanceof FinancieroAdminError) throw err;
    throw extractErrorMessage(err, 'No se pudo confirmar el pago. Intenta de nuevo.');
  }
}

export function mensajeErrorConfirmarPago(err: FinancieroAdminError): string {
  if (err.status === 401 || err.status === 403) {
    return 'Tu sesión expiró o no tienes permisos para confirmar pagos.';
  }
  if (err.status === 404) {
    return 'Pago no encontrado.';
  }
  if (err.status === 422) {
    return err.message || 'No se puede confirmar este pago en su estado actual.';
  }
  if (err.status === 400) {
    return err.message || 'Datos inválidos para confirmar el pago.';
  }
  return err.message || 'No se pudo confirmar el pago. Intenta de nuevo.';
}

export function mensajeErrorGenerarFactura(err: FinancieroAdminError): string {
  if (err.status === 401 || err.status === 403) {
    return 'Tu sesión expiró o no tienes permisos para generar facturas.';
  }
  if (err.status === 404) {
    return 'Reserva o pago no encontrado.';
  }
  if (err.status === 422) {
    return err.message || 'No se puede generar la factura para esta reserva o ya existe una factura.';
  }
  if (err.status === 400) {
    return err.message || 'Datos inválidos para generar la factura.';
  }
  return err.message || 'No se pudo generar la factura. Intenta de nuevo.';
}
