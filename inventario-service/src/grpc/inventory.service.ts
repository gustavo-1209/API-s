import * as grpc from '@grpc/grpc-js';
import { VehiculoRepository } from '../modules/vehiculos/vehiculo.repository.js';

interface CheckVehicleAvailabilityRequest {
  vehicleId?: string;
  startDate?: string;
  endDate?: string;
  correlationId?: string;
}

interface CheckVehicleAvailabilityResponse {
  available: boolean;
  status: string;
  message: string;
}

interface ReserveVehicleRequest {
  vehicleId?: string;
  reservationId?: string;
  correlationId?: string;
}

interface ReserveVehicleResponse {
  success: boolean;
  status: string;
  message: string;
}

interface ReleaseVehicleRequest {
  vehicleId?: string;
  reservationId?: string;
  correlationId?: string;
}

interface ReleaseVehicleResponse {
  success: boolean;
  status: string;
  message: string;
}

type GrpcCallback<T> = (error: grpc.ServiceError | null, response?: T) => void;

const LIBERABLE_STATUSES = new Set(['RESERVADO', 'EN_USO']);

export function createInventoryGrpcHandlers(repo: VehiculoRepository) {
  return {
    checkVehicleAvailability: async (
      call: grpc.ServerUnaryCall<CheckVehicleAvailabilityRequest, CheckVehicleAvailabilityResponse>,
      callback: GrpcCallback<CheckVehicleAvailabilityResponse>,
    ): Promise<void> => {
      try {
        const vehicleId = call.request.vehicleId ?? '';
        const correlationId = call.request.correlationId;

        console.log('[inventario-service][grpc] CheckVehicleAvailability', {
          correlationId,
          vehicleId,
        });

        const vehiculo = await repo.findById(vehicleId);
        if (!vehiculo) {
          callback(null, {
            available: false,
            status: 'NOT_FOUND',
            message: `Vehiculo ${vehicleId} no encontrado`,
          });
          return;
        }

        const status = vehiculo.status ?? 'INACTIVO';
        const available = status === 'DISPONIBLE' && vehiculo.isActive === true;

        callback(null, {
          available,
          status,
          message: available
            ? 'El vehículo está disponible para alquiler'
            : `El vehículo no está disponible (estado: ${status})`,
        });
      } catch (err) {
        callback(err as grpc.ServiceError);
      }
    },

    reserveVehicle: async (
      call: grpc.ServerUnaryCall<ReserveVehicleRequest, ReserveVehicleResponse>,
      callback: GrpcCallback<ReserveVehicleResponse>,
    ): Promise<void> => {
      try {
        const vehicleId = call.request.vehicleId ?? '';
        const correlationId = call.request.correlationId;

        console.log('[inventario-service][grpc] ReserveVehicle', {
          correlationId,
          vehicleId,
          reservationId: call.request.reservationId,
        });

        const vehiculo = await repo.findById(vehicleId);
        if (!vehiculo) {
          callback(null, {
            success: false,
            status: 'NOT_FOUND',
            message: `Vehiculo ${vehicleId} no encontrado`,
          });
          return;
        }

        const status = vehiculo.status ?? 'INACTIVO';

        if (status === 'RESERVADO') {
          callback(null, {
            success: true,
            status: 'RESERVADO',
            message: 'El vehículo ya estaba reservado',
          });
          return;
        }

        if (status !== 'DISPONIBLE') {
          callback(null, {
            success: false,
            status,
            message: `No se puede reservar un vehículo en estado ${status}`,
          });
          return;
        }

        const updated = await repo.update(vehicleId, { status: 'RESERVADO' });

        callback(null, {
          success: true,
          status: updated.status ?? 'RESERVADO',
          message: 'Vehículo reservado correctamente',
        });
      } catch (err) {
        callback(err as grpc.ServiceError);
      }
    },

    releaseVehicle: async (
      call: grpc.ServerUnaryCall<ReleaseVehicleRequest, ReleaseVehicleResponse>,
      callback: GrpcCallback<ReleaseVehicleResponse>,
    ): Promise<void> => {
      try {
        const vehicleId = call.request.vehicleId ?? '';
        const correlationId = call.request.correlationId;

        console.log('[inventario-service][grpc] ReleaseVehicle', {
          correlationId,
          vehicleId,
          reservationId: call.request.reservationId,
        });

        const vehiculo = await repo.findById(vehicleId);
        if (!vehiculo) {
          callback(null, {
            success: false,
            status: 'NOT_FOUND',
            message: `Vehiculo ${vehicleId} no encontrado`,
          });
          return;
        }

        const status = vehiculo.status ?? 'INACTIVO';

        if (status === 'DISPONIBLE') {
          callback(null, {
            success: true,
            status: 'DISPONIBLE',
            message: 'El vehículo ya estaba disponible',
          });
          return;
        }

        if (!LIBERABLE_STATUSES.has(status)) {
          callback(null, {
            success: false,
            status,
            message: `No se puede liberar un vehículo en estado ${status}`,
          });
          return;
        }

        const updated = await repo.update(vehicleId, { status: 'DISPONIBLE' });

        callback(null, {
          success: true,
          status: updated.status ?? 'DISPONIBLE',
          message: 'Vehículo liberado correctamente',
        });
      } catch (err) {
        callback(err as grpc.ServiceError);
      }
    },
  };
}
