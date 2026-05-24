import { isAxiosError } from 'axios';
import { bookingApi } from '@/api/api';
import {
  normalizeCrearAlquilerResponse,
  normalizeRegistrarDevolucionResponse,
} from '@/mappers/alquiler.mapper';
import type {
  CrearAlquilerRequest,
  CrearAlquilerResponse,
  RegistrarDevolucionRequest,
  RegistrarDevolucionResponse,
} from '@/types/admin';
import type { ReservaApiResponse } from '@/types/reserva';

export class AlquilerServiceError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'AlquilerServiceError';
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

function extractErrorMessage(err: unknown, fallback: string): AlquilerServiceError {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    const backendMsg = messageFromResponseData(err.response?.data);

    if (status === 401) {
      return new AlquilerServiceError('Tu sesión expiró. Vuelve a iniciar sesión.', 401);
    }
    if (!err.response) {
      return new AlquilerServiceError('No se pudo conectar con el servidor de reservas.');
    }

    return new AlquilerServiceError(backendMsg ?? fallback, status);
  }

  if (err instanceof Error) {
    return new AlquilerServiceError(err.message);
  }

  return new AlquilerServiceError(fallback);
}

function assertSuccessWrapper(data: unknown, fallback: string): void {
  if (
    data &&
    typeof data === 'object' &&
    'success' in data &&
    (data as ReservaApiResponse<unknown>).success === false
  ) {
    const wrapped = data as ReservaApiResponse<unknown>;
    throw new AlquilerServiceError(wrapped.error?.message ?? wrapped.message ?? fallback);
  }
}

export function mensajeErrorIniciarAlquiler(err: AlquilerServiceError): string {
  if (err.status === 400) {
    return err.message || 'Datos inválidos. Revisa el kilometraje de salida.';
  }
  if (err.status === 404) {
    return 'Reserva no encontrada.';
  }
  if (err.status === 422) {
    return (
      err.message ||
      'La reserva no está confirmada o no se puede iniciar el alquiler en este momento.'
    );
  }
  if (err.status === 409) {
    return err.message || 'Ya existe un alquiler para esta reserva.';
  }
  return err.message || 'No se pudo iniciar el alquiler. Intenta de nuevo.';
}

export function mensajeErrorRegistrarDevolucion(err: AlquilerServiceError): string {
  if (err.status === 400) {
    return err.message || 'Datos inválidos. Revisa kilometraje y estado del vehículo.';
  }
  if (err.status === 404) {
    return 'Alquiler no encontrado.';
  }
  if (err.status === 422) {
    return (
      err.message ||
      'El alquiler no está activo o no se puede registrar la devolución en este momento.'
    );
  }
  if (err.status === 409) {
    return err.message || 'Este alquiler ya tiene una devolución registrada.';
  }
  return err.message || 'No se pudo registrar la devolución. Intenta de nuevo.';
}

export async function registrarDevolucion(
  payload: RegistrarDevolucionRequest,
): Promise<RegistrarDevolucionResponse> {
  const body: Record<string, unknown> = {
    alquilerId: payload.alquilerId,
    kmEntrada: payload.kmEntrada,
    estadoVehiculo: payload.estadoVehiculo,
    cargoExtra: payload.cargoExtra ?? 0,
  };

  if (payload.observaciones?.trim()) {
    body.observaciones = payload.observaciones.trim();
  }

  try {
    const { data } = await bookingApi.post<unknown>('/devoluciones', body);

    assertSuccessWrapper(data, 'No se pudo registrar la devolución.');
    return normalizeRegistrarDevolucionResponse(data);
  } catch (err: unknown) {
    if (err instanceof AlquilerServiceError) throw err;
    throw extractErrorMessage(err, 'No se pudo registrar la devolución. Intenta de nuevo.');
  }
}

export async function iniciarAlquiler(
  payload: CrearAlquilerRequest,
): Promise<CrearAlquilerResponse> {
  const body: Record<string, unknown> = {
    reservaId: payload.reservaId,
    kmSalida: payload.kmSalida,
    fechaInicio: payload.fechaInicio ?? new Date().toISOString(),
  };

  if (payload.observaciones?.trim()) {
    body.observaciones = payload.observaciones.trim();
  }

  try {
    const { data } = await bookingApi.post<unknown>('/alquileres', body);

    assertSuccessWrapper(data, 'No se pudo iniciar el alquiler.');
    return normalizeCrearAlquilerResponse(data);
  } catch (err: unknown) {
    if (err instanceof AlquilerServiceError) throw err;
    throw extractErrorMessage(err, 'No se pudo iniciar el alquiler. Intenta de nuevo.');
  }
}
