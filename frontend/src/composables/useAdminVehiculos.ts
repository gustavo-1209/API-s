import { isAxiosError } from 'axios';
import { adminApi } from '@/api/api';
import { useAdminVehiculosLookup } from '@/composables/useAdminVehiculosLookup';
import type { ActualizarVehiculoRequest, CrearVehiculoRequest } from '@/types/admin';

const MSG_CREAR = 'No se pudo crear el vehículo.';
const MSG_ACTUALIZAR = 'No se pudo actualizar el vehículo.';
const MSG_DESACTIVAR = 'No se pudo desactivar el vehículo.';

export class VehiculoAdminError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'VehiculoAdminError';
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

function extractErrorMessage(err: unknown, fallback: string): VehiculoAdminError {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    const backendMsg = messageFromResponseData(err.response?.data);

    if (!err.response) {
      return new VehiculoAdminError('No se pudo conectar con el servidor de administración.');
    }

    return new VehiculoAdminError(backendMsg ?? fallback, status);
  }

  if (err instanceof Error) {
    return new VehiculoAdminError(err.message);
  }

  return new VehiculoAdminError(fallback);
}

function assertSuccessWrapper(data: unknown, fallback: string): void {
  if (
    data &&
    typeof data === 'object' &&
    'success' in data &&
    (data as { success?: boolean }).success === false
  ) {
    const record = data as { error?: { message?: string }; message?: string };
    throw new VehiculoAdminError(
      record.error?.message ?? record.message ?? fallback,
    );
  }
}

export async function crearVehiculo(payload: CrearVehiculoRequest): Promise<void> {
  try {
    const { data } = await adminApi.post<unknown>('/vehiculos', payload);
    assertSuccessWrapper(data, MSG_CREAR);
  } catch (err: unknown) {
    if (err instanceof VehiculoAdminError) throw err;
    throw extractErrorMessage(err, MSG_CREAR);
  }
}

export async function actualizarVehiculo(
  id: string,
  payload: ActualizarVehiculoRequest,
): Promise<void> {
  try {
    const { data } = await adminApi.patch<unknown>(`/vehiculos/${id}`, payload);
    assertSuccessWrapper(data, MSG_ACTUALIZAR);
  } catch (err: unknown) {
    if (err instanceof VehiculoAdminError) throw err;
    throw extractErrorMessage(err, MSG_ACTUALIZAR);
  }
}

export async function desactivarVehiculo(id: string): Promise<void> {
  try {
    const { data } = await adminApi.delete<unknown>(`/vehiculos/${id}`);
    if (data !== undefined && data !== null && data !== '') {
      assertSuccessWrapper(data, MSG_DESACTIVAR);
    }
  } catch (err: unknown) {
    if (err instanceof VehiculoAdminError) throw err;
    throw extractErrorMessage(err, MSG_DESACTIVAR);
  }
}

export function mensajeErrorVehiculo(err: VehiculoAdminError): string {
  if (err.status === 400) {
    return err.message || 'Solicitud inválida. Revisa los datos ingresados.';
  }
  if (err.status === 401 || err.status === 403) {
    return 'Tu sesión expiró o no tienes permisos para esta acción.';
  }
  if (err.status === 404) {
    return 'Vehículo no encontrado.';
  }
  if (err.status === 409) {
    return err.message || 'Conflicto al guardar el vehículo (p. ej. placa duplicada).';
  }
  if (err.status === 422) {
    return err.message || 'Los datos del vehículo no son válidos.';
  }
  return err.message || 'No se pudo completar la operación del vehículo.';
}

/** Listado admin de vehículos con catálogos e índice compartido + operaciones CRUD. */
export function useAdminVehiculos() {
  const lookup = useAdminVehiculosLookup();

  return {
    ...lookup,
    crearVehiculo,
    actualizarVehiculo,
    desactivarVehiculo,
    mensajeErrorVehiculo,
  };
}
