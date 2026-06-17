import { randomUUID } from 'crypto';
import { GraphQLError } from 'graphql';
import type { GraphQLContext } from './context.js';
import {
  cancelarReservaBookingV1,
  createReservaV2,
  fetchDisponibilidadVehiculo,
  fetchVehiculoById,
  fetchVehiculosDisponibles,
  type BookingClientHeaders,
} from './clients/booking.client.js';

function toClientHeaders(context: GraphQLContext): BookingClientHeaders {
  return {
    authorization: context.authorization,
    idempotencyKey: context.idempotencyKey,
    correlationId: context.correlationId,
  };
}

function upstreamError(err: unknown, code = 'UPSTREAM_ERROR'): never {
  const message = err instanceof Error ? err.message : 'Error al comunicarse con el upstream';
  throw new GraphQLError(message, { extensions: { code } });
}

/**
 * Prioridad para X-Idempotency-Key en crearReserva:
 * 1. Header HTTP x-idempotency-key (si es UUID válido, ya en context)
 * 2. input.idempotencyKey
 * 3. UUID generado automáticamente
 */
function resolveIdempotencyKey(context: GraphQLContext, inputKey?: string | null): string {
  if (context.idempotencyKey) {
    return context.idempotencyKey;
  }
  if (inputKey?.trim()) {
    return inputKey.trim();
  }
  return randomUUID();
}

function resolveCorrelationId(context: GraphQLContext): string {
  return context.correlationId ?? randomUUID();
}

export const resolvers = {
  Query: {
    vehiculosDisponibles: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      try {
        return await fetchVehiculosDisponibles(toClientHeaders(context));
      } catch (err) {
        upstreamError(err);
      }
    },

    vehiculo: async (_parent: unknown, args: { id: string }, context: GraphQLContext) => {
      try {
        return await fetchVehiculoById(args.id, toClientHeaders(context));
      } catch (err) {
        upstreamError(err, 'NOT_FOUND');
      }
    },

    disponibilidadVehiculo: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => {
      try {
        return await fetchDisponibilidadVehiculo(args.id, toClientHeaders(context));
      } catch (err) {
        upstreamError(err);
      }
    },

    misReservas: async (_parent: unknown, _args: { clienteId: string }) => {
      throw new GraphQLError(
        'misReservas no está disponible: el booking gateway no expone listado por clienteId. Use una fase posterior o REST admin.',
        { extensions: { code: 'NOT_IMPLEMENTED' } },
      );
    },
  },

  Mutation: {
    crearReserva: async (
      _parent: unknown,
      args: {
        input: {
          vehiculoId: string;
          clienteId: string;
          fechaInicio: string;
          fechaFin: string;
          agenciaId?: string;
          idempotencyKey?: string;
        };
      },
      context: GraphQLContext,
    ) => {
      const correlationId = resolveCorrelationId(context);
      const idempotencyKey = resolveIdempotencyKey(context, args.input.idempotencyKey);

      try {
        const { reserva, correlationId: responseCorrelationId } = await createReservaV2(
          {
            vehiculoId: args.input.vehiculoId,
            clienteId: args.input.clienteId,
            fechaInicio: args.input.fechaInicio,
            fechaFin: args.input.fechaFin,
            agenciaId: args.input.agenciaId,
          },
          {
            authorization: context.authorization,
            idempotencyKey,
            correlationId,
          },
        );

        return {
          reservaId: reserva.id,
          codigoReserva: reserva.codigoReserva,
          estado: reserva.status ?? 'CONFIRMADA',
          correlationId: responseCorrelationId ?? correlationId,
          reserva,
        };
      } catch (err) {
        upstreamError(err);
      }
    },

    cancelarReserva: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => {
      // Fase posterior: usar cancelación V2 con eventos RabbitMQ cuando exista el endpoint.
      try {
        const reserva = await cancelarReservaBookingV1(args.id, toClientHeaders(context));
        return {
          reservaId: reserva.id,
          estado: reserva.status ?? 'CANCELADA',
          reserva,
        };
      } catch (err) {
        upstreamError(err);
      }
    },
  },
};
