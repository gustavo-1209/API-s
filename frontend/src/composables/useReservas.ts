import { isAxiosError } from 'axios';
import { bookingApi } from '@/api/api';
import { unwrapApiData } from '@/lib/api-unwrap';
import type {
  CrearReservaRequest,
  CrearReservaResponse,
  ReservaApiResponse,
} from '@/types/reserva';

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

function extractErrorMessage(err: unknown): ReservaServiceError {
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

    return new ReservaServiceError(
      backendMsg ?? 'No se pudo confirmar la reserva. Intenta de nuevo.',
      status,
    );
  }

  if (err instanceof Error) {
    return new ReservaServiceError(err.message);
  }

  return new ReservaServiceError('Error inesperado al confirmar la reserva.');
}

function normalizeCrearReservaResponse(body: unknown): CrearReservaResponse {
  const raw = unwrapApiData<Record<string, unknown>>(body);
  const id = String(raw.id ?? raw.reservaId ?? '');
  if (!id) {
    throw new ReservaServiceError('Respuesta inválida del servidor de reservas.');
  }

  return {
    id,
    codigoReserva:
      typeof raw.codigoReserva === 'string'
        ? raw.codigoReserva
        : typeof raw.codigo === 'string'
          ? raw.codigo
          : undefined,
    vehiculoId: typeof raw.vehiculoId === 'string' ? raw.vehiculoId : undefined,
    clienteId: typeof raw.clienteId === 'string' ? raw.clienteId : undefined,
    fechaInicio: typeof raw.fechaInicio === 'string' ? raw.fechaInicio : undefined,
    fechaFin: typeof raw.fechaFin === 'string' ? raw.fechaFin : undefined,
    status: typeof raw.status === 'string' ? raw.status : undefined,
    totalAmount: raw.totalAmount as number | string | undefined,
  };
}

export async function crearReserva(body: CrearReservaRequest): Promise<CrearReservaResponse> {
  try {
    const { data } = await bookingApi.post<ReservaApiResponse<CrearReservaResponse> | CrearReservaResponse>(
      '/reservas',
      body,
    );

    if (data && typeof data === 'object' && 'success' in data && data.success === false) {
      throw new ReservaServiceError(
        data.error?.message ?? data.message ?? 'No se pudo confirmar la reserva.',
      );
    }

    return normalizeCrearReservaResponse(data);
  } catch (err: unknown) {
    if (err instanceof ReservaServiceError) throw err;
    throw extractErrorMessage(err);
  }
}

export function mensajeErrorReserva(err: ReservaServiceError): string {
  return err.message;
}
