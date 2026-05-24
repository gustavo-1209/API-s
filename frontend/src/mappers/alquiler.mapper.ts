import { unwrapApiData } from '@/lib/api-unwrap';
import { asRecord, getNumber, getString } from '@/mappers/admin.mapper';
import type { IniciarAlquilerResponse, RegistrarDevolucionResponse } from '@/types/admin';

function resolveReservaId(r: Record<string, unknown>): string {
  const direct = getString(r, ['reservaId']);
  if (direct) return direct;

  const reserva = r.reserva;
  if (reserva && typeof reserva === 'object') {
    return getString(reserva as Record<string, unknown>, ['id', 'reservaId']);
  }

  return '';
}

export function normalizeIniciarAlquilerResponse(body: unknown): IniciarAlquilerResponse {
  const raw = asRecord(unwrapApiData<unknown>(body));
  const id = getString(raw, ['id']);
  const reservaId = resolveReservaId(raw);

  if (!id) {
    throw new Error('Respuesta inválida al iniciar el alquiler.');
  }

  const kmSalida = getNumber(raw, ['kmSalida']);

  return {
    id,
    reservaId,
    kmSalida: kmSalida ?? undefined,
    status: getString(raw, ['status']) || undefined,
  };
}

export function normalizeRegistrarDevolucionResponse(body: unknown): RegistrarDevolucionResponse {
  const raw = asRecord(unwrapApiData<unknown>(body));
  const id = getString(raw, ['id']);
  const alquilerId = getString(raw, ['alquilerId']);

  if (!id) {
    throw new Error('Respuesta inválida al registrar la devolución.');
  }

  return {
    id,
    alquilerId: alquilerId || undefined,
  };
}
