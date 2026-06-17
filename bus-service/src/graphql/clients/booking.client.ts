export interface BookingClientHeaders {
  authorization?: string;
  idempotencyKey?: string;
  correlationId?: string;
}

export interface VehiculoDto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precioPorDia: number;
  moneda: string;
  categoria: string | null;
  agenciaId: string | null;
  disponible: boolean;
  status: string;
  imagenUrl: string | null;
}

export interface DisponibilidadVehiculoDto {
  vehiculoId: string;
  disponible: boolean;
  status: string;
  mensaje: string;
}

export interface ReservaDto {
  id: string;
  codigoReserva: string | null;
  vehiculoId: string | null;
  clienteId: string | null;
  agenciaId: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  diasTotal: number | null;
  totalAmount: number;
  status: string | null;
}

interface ApiError {
  code?: string;
  message?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  correlationId?: string;
}

function inventarioBaseUrl(): string {
  return (process.env.INVENTARIO_SERVICE_URL ?? 'http://localhost:3002').replace(/\/$/, '');
}

function operacionesBaseUrl(): string {
  return (process.env.OPERACIONES_SERVICE_URL ?? 'http://localhost:3004').replace(/\/$/, '');
}

function bookingV1Prefix(): string {
  return '/api/v1/gustavobenalcazar';
}

function buildHeaders(headers?: BookingClientHeaders): Record<string, string> {
  const result: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (headers?.authorization) {
    result.Authorization = headers.authorization;
  }
  if (headers?.idempotencyKey) {
    result['X-Idempotency-Key'] = headers.idempotencyKey;
  }
  if (headers?.correlationId) {
    result['X-Correlation-Id'] = headers.correlationId;
  }

  return result;
}

async function parseJsonResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const text = await response.text();
  if (!text) {
    return { success: false, error: { code: 'EMPTY_RESPONSE', message: 'Respuesta vacía del upstream' } };
  }

  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      error: { code: 'INVALID_JSON', message: 'Respuesta JSON inválida del upstream' },
    };
  }
}

function normalizeVehiculo(raw: Record<string, unknown>): VehiculoDto {
  return {
    id: String(raw.id ?? ''),
    nombre: String(raw.nombre ?? ''),
    descripcion: raw.descripcion != null ? String(raw.descripcion) : null,
    precioPorDia: Number(raw.precioPorDia ?? raw.precioDia ?? 0),
    moneda: String(raw.moneda ?? 'USD'),
    categoria: raw.categoria != null ? String(raw.categoria) : null,
    agenciaId: raw.agenciaId != null ? String(raw.agenciaId) : null,
    disponible: Boolean(raw.disponible),
    status: String(raw.status ?? ''),
    imagenUrl: raw.imagenUrl != null ? String(raw.imagenUrl) : null,
  };
}

function normalizeReserva(raw: Record<string, unknown>): ReservaDto {
  return {
    id: String(raw.id ?? ''),
    codigoReserva: raw.codigoReserva != null ? String(raw.codigoReserva) : null,
    vehiculoId: raw.vehiculoId != null ? String(raw.vehiculoId) : null,
    clienteId: raw.clienteId != null ? String(raw.clienteId) : null,
    agenciaId: raw.agenciaId != null ? String(raw.agenciaId) : null,
    fechaInicio: raw.fechaInicio != null ? String(raw.fechaInicio) : null,
    fechaFin: raw.fechaFin != null ? String(raw.fechaFin) : null,
    diasTotal: raw.diasTotal != null ? Number(raw.diasTotal) : null,
    totalAmount: Number(raw.totalAmount ?? 0),
    status: raw.status != null ? String(raw.status) : null,
  };
}

export async function fetchVehiculosDisponibles(
  headers?: BookingClientHeaders,
): Promise<VehiculoDto[]> {
  const url = `${inventarioBaseUrl()}${bookingV1Prefix()}/vehiculos/booking`;

  const response = await fetch(url, { headers: buildHeaders(headers) });
  const body = await parseJsonResponse<{ data: Record<string, unknown>[] }>(response);

  if (!response.ok || !body.success || !body.data) {
    throw new Error(body.error?.message ?? `Error al listar vehículos (${response.status})`);
  }

  const items = Array.isArray(body.data.data) ? body.data.data : [];
  return items.map((item) => normalizeVehiculo(item));
}

export async function fetchVehiculoById(
  id: string,
  headers?: BookingClientHeaders,
): Promise<VehiculoDto> {
  const url = `${inventarioBaseUrl()}${bookingV1Prefix()}/vehiculos/booking/${id}`;

  const response = await fetch(url, { headers: buildHeaders(headers) });
  const body = await parseJsonResponse<Record<string, unknown>>(response);

  if (!response.ok || !body.success || !body.data) {
    throw new Error(body.error?.message ?? `Vehículo no encontrado (${response.status})`);
  }

  return normalizeVehiculo(body.data);
}

export async function fetchDisponibilidadVehiculo(
  id: string,
  headers?: BookingClientHeaders,
): Promise<DisponibilidadVehiculoDto> {
  const url = `${inventarioBaseUrl()}${bookingV1Prefix()}/vehiculos/booking/${id}/disponibilidad`;

  const response = await fetch(url, { headers: buildHeaders(headers) });
  const body = await parseJsonResponse<DisponibilidadVehiculoDto>(response);

  if (!response.ok || !body.success || !body.data) {
    throw new Error(body.error?.message ?? `Disponibilidad no disponible (${response.status})`);
  }

  return body.data;
}

export async function createReservaV2(
  input: {
    vehiculoId: string;
    clienteId: string;
    fechaInicio: string;
    fechaFin: string;
    agenciaId?: string;
  },
  headers: BookingClientHeaders,
): Promise<{ reserva: ReservaDto; correlationId?: string }> {
  const url = `${operacionesBaseUrl()}/api/v2/gustavobenalcazar/reservas/booking`;

  const response = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(headers),
    body: JSON.stringify(input),
  });

  const body = await parseJsonResponse<Record<string, unknown>>(response);

  if (!response.ok || !body.success || !body.data) {
    throw new Error(body.error?.message ?? `No se pudo crear la reserva (${response.status})`);
  }

  return {
    reserva: normalizeReserva(body.data),
    correlationId: body.correlationId ?? headers.correlationId,
  };
}

/**
 * Cancelación vía booking V1 (operaciones).
 * Fase posterior: migrar a endpoint V2 con eventos RabbitMQ dedicados.
 */
export async function cancelarReservaBookingV1(
  reservaId: string,
  headers?: BookingClientHeaders,
): Promise<ReservaDto> {
  const url = `${operacionesBaseUrl()}${bookingV1Prefix()}/reservas/booking/${reservaId}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: buildHeaders(headers),
    body: JSON.stringify({ status: 'CANCELADA' }),
  });

  const body = await parseJsonResponse<Record<string, unknown>>(response);

  if (!response.ok || !body.success || !body.data) {
    throw new Error(body.error?.message ?? `No se pudo cancelar la reserva (${response.status})`);
  }

  return normalizeReserva(body.data);
}
