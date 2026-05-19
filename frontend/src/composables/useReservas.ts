import { isAxiosError } from 'axios';
import { api } from '@/api/api';
import {
  mapReservaFormToSnakeCase,
  mapSnakeToReservaCreateBody,
} from '@/mappers/reserva.mapper';
import type {
  ReservaApiResponse,
  ReservaCreada,
  ReservaFormModel,
  ReservaSnakePayload,
} from '@/types/reserva';

export class ReservaServiceError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ReservaServiceError';
  }
}

function extractErrorMessage(err: unknown): ReservaServiceError {
  if (isAxiosError(err)) {
    const data = err.response?.data as ReservaApiResponse<unknown> | undefined;
    const code = data?.error?.code;
    const message =
      data?.error?.message ??
      data?.message ??
      err.message ??
      'No se pudo confirmar la reserva.';

    return new ReservaServiceError(message, code, err.response?.status);
  }

  if (err instanceof Error) {
    return new ReservaServiceError(err.message);
  }

  return new ReservaServiceError('Error inesperado al confirmar la reserva.');
}

export function mapFormToSnakePayload(form: ReservaFormModel): ReservaSnakePayload {
  return mapReservaFormToSnakeCase(form);
}

export async function crearReserva(form: ReservaFormModel): Promise<ReservaCreada> {
  const snakePayload = mapReservaFormToSnakeCase(form);
  const apiBody = mapSnakeToReservaCreateBody(snakePayload);

  try {
    const { data } = await api.post<ReservaApiResponse<ReservaCreada>>('/reservas', apiBody);
    if (!data.success || !data.data) {
      throw new ReservaServiceError(
        data.error?.message ?? 'Respuesta inválida del servidor de reservas.',
        data.error?.code,
      );
    }
    return data.data;
  } catch (err: unknown) {
    throw extractErrorMessage(err);
  }
}

/** Mensaje amigable para solapamiento o indisponibilidad. */
export function mensajeErrorReserva(err: ReservaServiceError): string {
  if (err.code === 'CONFLICT' || err.status === 409) {
    return 'El vehículo ya tiene una reserva activa en las fechas seleccionadas. Elige otro rango.';
  }
  if (err.code === 'VEHICLE_NOT_AVAILABLE' || err.status === 422) {
    return 'El vehículo no está disponible para reservar en este momento.';
  }
  if (err.message.toLowerCase().includes('disponible')) {
    return err.message;
  }
  if (err.message.toLowerCase().includes('fecha')) {
    return err.message;
  }
  return err.message;
}
