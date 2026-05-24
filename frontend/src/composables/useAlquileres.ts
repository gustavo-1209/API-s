import { isAxiosError } from 'axios';
import { bookingApi } from '@/api/api';
import {
  normalizeIniciarAlquilerResponse,
  normalizeRegistrarDevolucionResponse,
} from '@/mappers/alquiler.mapper';
import type {
  IniciarAlquilerRequest,
  IniciarAlquilerResponse,
  RegistrarDevolucionRequest,
  RegistrarDevolucionResponse,
} from '@/types/admin';

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
    (data as { success?: boolean }).success === false
  ) {
    const record = data as { error?: { message?: string }; message?: string };
    throw new AlquilerServiceError(
      record.error?.message ?? record.message ?? fallback,
    );
  }
}

export async function iniciarAlquiler(
  payload: IniciarAlquilerRequest,
): Promise<IniciarAlquilerResponse> {
  try {
    const { data } = await bookingApi.post<unknown>('/alquileres', payload);
    assertSuccessWrapper(data, 'No se pudo iniciar el alquiler.');
    return normalizeIniciarAlquilerResponse(data);
  } catch (err: unknown) {
    if (err instanceof AlquilerServiceError) throw err;
    throw extractErrorMessage(err, 'No se pudo iniciar el alquiler. Intenta de nuevo.');
  }
}

export async function registrarDevolucion(
  payload: RegistrarDevolucionRequest,
): Promise<RegistrarDevolucionResponse> {
  try {
    const { data } = await bookingApi.post<unknown>('/devoluciones', payload);
    assertSuccessWrapper(data, 'No se pudo registrar la devolución.');
    return normalizeRegistrarDevolucionResponse(data);
  } catch (err: unknown) {
    if (err instanceof AlquilerServiceError) throw err;
    throw extractErrorMessage(err, 'No se pudo registrar la devolución. Intenta de nuevo.');
  }
}

export function mensajeErrorIniciarAlquiler(err: AlquilerServiceError): string {
  if (err.status === 404) {
    return 'Reserva no encontrada.';
  }
  if (err.status === 409) {
    return err.message || 'Ya existe un alquiler para esta reserva.';
  }
  if (err.status === 422) {
    return err.message || 'Solo se puede iniciar un alquiler de una reserva CONFIRMADA.';
  }
  if (err.status === 400) {
    return err.message || 'Datos inválidos para iniciar el alquiler.';
  }
  return err.message || 'No se pudo iniciar el alquiler. Intenta de nuevo.';
}

export function mensajeErrorRegistrarDevolucion(err: AlquilerServiceError): string {
  if (err.status === 404) {
    return 'Alquiler no encontrado.';
  }
  if (err.status === 409) {
    return err.message || 'Este alquiler ya tiene una devolución registrada.';
  }
  if (err.status === 422) {
    return err.message || 'El alquiler no está activo o no se puede registrar la devolución.';
  }
  if (err.status === 400) {
    return err.message || 'Datos inválidos para la devolución.';
  }
  return err.message || 'No se pudo registrar la devolución. Intenta de nuevo.';
}
