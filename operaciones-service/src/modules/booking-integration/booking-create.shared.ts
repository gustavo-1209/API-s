import prisma from '../../shared/database/prisma.js';
import { ReservaRepository } from '../reservas/reserva.repository.js';

const INVENTARIO_URL = process.env['INVENTARIO_SERVICE_URL'] ?? 'http://localhost:3002';

export interface ReservaBookingDto {
  id: string;
  codigoReserva: string | null;
  vehiculoId: string | null;
  clienteId: string | null;
  agenciaId: string | null;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  diasTotal: number | null;
  totalAmount: number;
  status: string | null;
}

export interface CreateReservaBookingBody {
  vehiculoId?: unknown;
  clienteId?: unknown;
  agenciaId?: unknown;
  fechaInicio?: unknown;
  fechaFin?: unknown;
}

type BookingErrorBody = {
  success: false;
  error: { code: string; message: string };
};

type BookingSuccessBody = {
  success: true;
  data: ReservaBookingDto;
  correlationId?: string;
};

export type CreateReservaBookingResponse =
  | { status: number; body: BookingSuccessBody }
  | { status: number; body: BookingErrorBody };

async function patchVehiculoStatus(
  vehiculoId: string,
  status: string,
  authHeader?: string,
): Promise<void> {
  const response = await fetch(
    `${INVENTARIO_URL}/api/v1/gustavobenalcazar/vehiculos/booking/${vehiculoId}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader ?? '',
      },
      body: JSON.stringify({ status }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[booking-integration] Error sincronizando estado del vehículo en inventario:', {
      vehiculoId,
      statusSolicitado: status,
      httpStatus: response.status,
      body: errorText,
    });
    throw new Error('No se pudo actualizar el vehículo en inventario');
  }
}

async function fetchVehiculo(vehiculoId: string): Promise<Record<string, unknown> | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);

  try {
    const res = await fetch(
      `${INVENTARIO_URL}/api/v1/gustavobenalcazar/vehiculos/booking/${vehiculoId}`,
      { signal: controller.signal },
    );

    if (!res.ok) return null;

    const body = (await res.json()) as { success: boolean; data: Record<string, unknown> };
    if (!body.success || !body.data) return null;

    const vehiculo = body.data;

    return {
      ...vehiculo,
      precioDia: vehiculo.precioDia ?? vehiculo.precioPorDia,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function generarCodigo(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `RES-${ts}-${rnd}`;
}

interface FechaError {
  error: string;
}
interface FechaOk {
  dias: number;
}
type FechaValidation = FechaError | FechaOk;

function validateFechas(rawInicio: unknown, rawFin: unknown): FechaValidation {
  if (typeof rawInicio !== 'string' || !rawInicio.trim()) {
    return { error: 'fechaInicio debe ser un string ISO 8601 válido' };
  }
  if (typeof rawFin !== 'string' || !rawFin.trim()) {
    return { error: 'fechaFin debe ser un string ISO 8601 válido' };
  }

  const dInicio = new Date(rawInicio);
  const dFin = new Date(rawFin);

  if (!Number.isFinite(dInicio.getTime())) {
    return { error: 'fechaInicio no es una fecha ISO 8601 válida' };
  }
  if (!Number.isFinite(dFin.getTime())) {
    return { error: 'fechaFin no es una fecha ISO 8601 válida' };
  }

  const hoy = new Date();
  hoy.setUTCHours(0, 0, 0, 0);
  if (dInicio < hoy) {
    return { error: 'fechaInicio no puede ser una fecha pasada' };
  }
  if (dFin <= dInicio) {
    return { error: 'fechaFin debe ser estrictamente posterior a fechaInicio' };
  }

  const dias = Math.ceil((dFin.getTime() - dInicio.getTime()) / 86_400_000);
  return { dias };
}

export function toReservaBookingDto(reserva: {
  id: string;
  codigoReserva: string | null;
  vehiculoId: string | null;
  usuarioId: string | null;
  agenciaId: string | null;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  diasTotal: number | null;
  totalAmount: unknown;
  status: string | null;
}): ReservaBookingDto {
  return {
    id: reserva.id,
    codigoReserva: reserva.codigoReserva,
    vehiculoId: reserva.vehiculoId,
    clienteId: reserva.usuarioId,
    agenciaId: reserva.agenciaId,
    fechaInicio: reserva.fechaInicio,
    fechaFin: reserva.fechaFin,
    diasTotal: reserva.diasTotal,
    totalAmount: Number(reserva.totalAmount),
    status: reserva.status,
  };
}

/**
 * Lógica compartida de creación de reserva booking (equivalente a V1).
 * Usada por la API V2; la ruta V1 conserva su implementación original intacta.
 */
export async function createReservaBooking(
  reservaRepo: ReservaRepository,
  body: CreateReservaBookingBody,
  authHeader?: string,
  options?: { correlationId?: string },
): Promise<CreateReservaBookingResponse> {
  const { vehiculoId, clienteId, agenciaId: bodyAgenciaId, fechaInicio, fechaFin } = body;

  if (!vehiculoId || !clienteId || !fechaInicio || !fechaFin) {
    return {
      status: 400,
      body: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'vehiculoId, clienteId, fechaInicio y fechaFin son requeridos',
        },
      },
    };
  }

  const fechaResult = validateFechas(fechaInicio, fechaFin);
  if ('error' in fechaResult) {
    return {
      status: 400,
      body: {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: fechaResult.error },
      },
    };
  }
  const { dias } = fechaResult;

  const vehiculo = await fetchVehiculo(String(vehiculoId));
  if (!vehiculo) {
    return {
      status: 404,
      body: {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Vehiculo ${String(vehiculoId)} no encontrado`,
        },
      },
    };
  }

  if (vehiculo.status !== 'DISPONIBLE') {
    return {
      status: 422,
      body: {
        success: false,
        error: {
          code: 'VEHICLE_NOT_AVAILABLE',
          message: 'El vehículo no está disponible',
        },
      },
    };
  }

  const precioDia = Number(vehiculo.precioDia);
  if (!Number.isFinite(precioDia) || precioDia <= 0) {
    return {
      status: 422,
      body: {
        success: false,
        error: {
          code: 'VEHICLE_PRICE_MISSING',
          message: 'El vehículo no tiene precio por día configurado',
        },
      },
    };
  }

  const conflicto = await prisma.reserva.findFirst({
    where: {
      vehiculoId: String(vehiculoId),
      status: { notIn: ['CANCELADA', 'COMPLETADA'] },
    },
  });
  if (conflicto) {
    return {
      status: 409,
      body: {
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'El vehículo ya tiene una reserva activa',
        },
      },
    };
  }

  const agenciaId = bodyAgenciaId ?? vehiculo.agenciaId;
  if (!agenciaId) {
    return {
      status: 400,
      body: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No se pudo determinar agenciaId del vehículo',
        },
      },
    };
  }

  const precioBase = precioDia * dias;
  const fechaInicioDate = String(fechaInicio).split('T')[0]!;
  const fechaFinDate = String(fechaFin).split('T')[0]!;

  const reserva = await reservaRepo.create({
    usuarioId: String(clienteId),
    vehiculoId: String(vehiculoId),
    agenciaId: String(agenciaId),
    fechaInicio: fechaInicioDate,
    fechaFin: fechaFinDate,
    diasTotal: dias,
    precioBase,
    precioExtras: 0,
    precioSeguro: 0,
    totalAmount: precioBase,
    codigoReserva: generarCodigo(),
    status: 'CONFIRMADA',
  });

  try {
    await patchVehiculoStatus(String(vehiculoId), 'RESERVADO', authHeader);
  } catch (syncErr) {
    console.error('[booking-integration] Reserva creada pero falló sincronización del vehículo:', {
      correlationId: options?.correlationId,
      reservaId: reserva.id,
      vehiculoId: String(vehiculoId),
      syncErr,
    });
  }

  return {
    status: 201,
    body: {
      success: true,
      correlationId: options?.correlationId,
      data: toReservaBookingDto(reserva),
    },
  };
}
