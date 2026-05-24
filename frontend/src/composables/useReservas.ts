import { isAxiosError } from 'axios';
import { bookingApi } from '@/api/api';
import {
  normalizeCrearReservaResponse,
  normalizePaymentResponse,
  normalizeReservaDetalleResponse,
} from '@/mappers/reserva.mapper';
import { normalizeVehiculoDisponibilidadResponse } from '@/mappers/vehiculo-marketplace.mapper';
import type {
  ConfirmarReservaRequest,
  CrearReservaRequest,
  CrearReservaResponse,
  PaymentResponse,
  ReservaApiResponse,
  ReservaDetalleResponse,
} from '@/types/reserva';
import type { VehiculoDisponibilidadResponse } from '@/types/vehiculo';

const MSG_RESERVA_ACTIVA_AMIGABLE =
  'Este vehículo ya tiene una reserva activa. Puedes volver al catálogo y elegir otro vehículo.';

const PATRON_RESERVA_ACTIVA = 'ya tiene una reserva activa';

export class ReservaServiceError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ReservaServiceError';
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

function extractErrorMessage(err: unknown, fallback: string): ReservaServiceError {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    const backendMsg = messageFromResponseData(err.response?.data);

    if (status === 401) {
      return new ReservaServiceError('Tu sesión expiró. Vuelve a iniciar sesión.', 401);
    }
    if (!err.response) {
      return new ReservaServiceError('No se pudo conectar con el servidor de reservas.');
    }
    if (status === 400 && backendMsg) {
      return new ReservaServiceError(backendMsg, 400);
    }

    return new ReservaServiceError(backendMsg ?? fallback, status);
  }

  if (err instanceof Error) {
    return new ReservaServiceError(err.message);
  }

  return new ReservaServiceError(fallback);
}

function assertSuccessWrapper(data: unknown, fallback: string): void {
  if (data && typeof data === 'object' && 'success' in data && (data as ReservaApiResponse<unknown>).success === false) {
    const wrapped = data as ReservaApiResponse<unknown>;
    throw new ReservaServiceError(wrapped.error?.message ?? wrapped.message ?? fallback);
  }
}

export async function crearReserva(body: CrearReservaRequest): Promise<CrearReservaResponse> {
  try {
    const { data } = await bookingApi.post<ReservaApiResponse<CrearReservaResponse> | CrearReservaResponse>(
      '/reservas',
      body,
    );

    assertSuccessWrapper(data, 'No se pudo crear la reserva.');

    return normalizeCrearReservaResponse(data);
  } catch (err: unknown) {
    if (err instanceof ReservaServiceError) throw err;
    throw extractErrorMessage(err, 'No se pudo crear la reserva. Intenta de nuevo.');
  }
}

export async function obtenerReserva(reservaId: string): Promise<ReservaDetalleResponse> {
  try {
    const { data } = await bookingApi.get<unknown>(`/reservas/${reservaId}`);
    assertSuccessWrapper(data, 'No se pudo obtener el detalle de la reserva.');
    return normalizeReservaDetalleResponse(data);
  } catch (err: unknown) {
    if (err instanceof ReservaServiceError) throw err;
    throw extractErrorMessage(err, 'No se pudo obtener el detalle de la reserva.');
  }
}

export async function confirmarReserva(reservaId: string): Promise<ReservaDetalleResponse> {
  const body: ConfirmarReservaRequest = { status: 'CONFIRMADA' };

  try {
    const { data } = await bookingApi.patch<unknown>(`/reservas/${reservaId}`, body);

    assertSuccessWrapper(data, 'No se pudo confirmar la reserva.');
    return normalizeReservaDetalleResponse(data);
  } catch (err: unknown) {
    if (err instanceof ReservaServiceError) throw err;
    throw extractErrorMessage(err, 'No se pudo confirmar la reserva. Intenta de nuevo.');
  }
}

export function mensajeErrorConfirmarReserva(err: ReservaServiceError): string {
  if (err.status === 404) {
    return 'Reserva no encontrada.';
  }
  if (err.status === 422) {
    return (
      err.message ||
      'No se puede confirmar esta reserva en su estado actual. Solo las reservas PENDIENTE pueden confirmarse.'
    );
  }
  if (err.status === 400) {
    return err.message || 'Estado inválido.';
  }
  return err.message || 'No se pudo confirmar la reserva. Intenta de nuevo.';
}

export async function consultarPago(reservaId: string): Promise<PaymentResponse> {
  try {
    const { data } = await bookingApi.get<unknown>(`/payment/${reservaId}`);
    assertSuccessWrapper(data, 'No se pudo consultar el estado de pago.');
    return normalizePaymentResponse(data, reservaId);
  } catch (err: unknown) {
    if (err instanceof ReservaServiceError) throw err;
    throw extractErrorMessage(err, 'No se pudo consultar el estado de pago.');
  }
}

export function esErrorReservaActiva(err: ReservaServiceError): boolean {
  return err.message.trim().toLowerCase().includes(PATRON_RESERVA_ACTIVA);
}

export function mensajeErrorReserva(err: ReservaServiceError): string {
  if (esErrorReservaActiva(err)) {
    return MSG_RESERVA_ACTIVA_AMIGABLE;
  }
  return err.message;
}

/**
 * Consulta disponibilidad en inventario. Si el endpoint falla, devuelve null
 * (no bloquear el flujo; la validación definitiva queda en POST /reservas).
 */
export async function verificarDisponibilidadVehiculo(
  vehiculoId: string,
): Promise<VehiculoDisponibilidadResponse | null> {
  try {
    const { data } = await bookingApi.get<unknown>(`/vehiculos/${vehiculoId}/disponibilidad`);
    assertSuccessWrapper(data, 'No se pudo verificar disponibilidad.');
    return normalizeVehiculoDisponibilidadResponse(data);
  } catch {
    return null;
  }
}
