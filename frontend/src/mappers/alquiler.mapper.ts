import { unwrapApiData } from '@/lib/api-unwrap';
import type { CrearAlquilerResponse, RegistrarDevolucionResponse } from '@/types/admin';

function asRecord(raw: unknown): Record<string, unknown> {
  return raw !== null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

function getString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function getNumber(record: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (value === null || value === undefined) continue;
    const n = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/** Normaliza POST /alquileres. */
export function normalizeCrearAlquilerResponse(body: unknown): CrearAlquilerResponse {
  const raw = asRecord(unwrapApiData<unknown>(body));
  const id = getString(raw, ['id']);

  if (!id) {
    throw new Error('Respuesta inválida al iniciar el alquiler.');
  }

  return {
    id,
    reservaId: getString(raw, ['reservaId']) || undefined,
    kmSalida: getNumber(raw, ['kmSalida']),
    fechaInicio: getString(raw, ['fechaInicio']) || undefined,
    status: getString(raw, ['status']) || undefined,
    observaciones:
      typeof raw.observaciones === 'string' ? raw.observaciones : null,
  };
}

/** Normaliza POST /devoluciones. */
export function normalizeRegistrarDevolucionResponse(body: unknown): RegistrarDevolucionResponse {
  const raw = asRecord(unwrapApiData<unknown>(body));
  const id = getString(raw, ['id']);

  if (!id) {
    throw new Error('Respuesta inválida al registrar la devolución.');
  }

  return {
    id,
    alquilerId: getString(raw, ['alquilerId']) || undefined,
    kmEntrada: getNumber(raw, ['kmEntrada']),
    estadoVehiculo: getString(raw, ['estadoVehiculo']) || undefined,
    cargoExtra: getNumber(raw, ['cargoExtra']),
    observaciones:
      typeof raw.observaciones === 'string' ? raw.observaciones : null,
  };
}
