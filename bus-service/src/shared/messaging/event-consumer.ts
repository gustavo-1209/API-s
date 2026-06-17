import type { ConsumeMessage } from 'amqplib';
import { emitMarketplaceEvent } from '../websocket/socket-server.js';
import {
  BUS_MARKETPLACE_QUEUE,
  CONSUMED_ROUTING_KEYS,
  getRabbitMqChannel,
  isRabbitMqConfigured,
} from './rabbitmq.js';

interface RentWheelsEvent {
  eventId?: string;
  eventType?: string;
  routingKey?: string;
  occurredAt?: string;
  correlationId?: string;
  source?: string;
  payload?: Record<string, unknown>;
}

const ROUTING_KEY_TO_SOCKET_EVENT: Record<string, string> = {
  'reserva.creada': 'reserva:creada',
  'reserva.confirmada': 'reserva:confirmada',
  'reserva.cancelada': 'reserva:cancelada',
  'vehiculo.reservado': 'vehiculo:actualizado',
  'vehiculo.liberado': 'vehiculo:actualizado',
};

function isValidEvent(event: RentWheelsEvent): boolean {
  const routingKey = event.routingKey ?? event.eventType;
  if (!routingKey || typeof routingKey !== 'string') {
    return false;
  }
  if (!CONSUMED_ROUTING_KEYS.includes(routingKey as (typeof CONSUMED_ROUTING_KEYS)[number])) {
    return false;
  }
  if (!event.payload || typeof event.payload !== 'object') {
    return false;
  }
  return true;
}

function mapToSocketEvent(event: RentWheelsEvent): { socketEvent: string; data: Parameters<typeof emitMarketplaceEvent>[1] } | null {
  const routingKey = (event.routingKey ?? event.eventType) as string;
  const socketEvent = ROUTING_KEY_TO_SOCKET_EVENT[routingKey];
  if (!socketEvent) {
    return null;
  }

  return {
    socketEvent,
    data: {
      eventType: routingKey,
      correlationId: event.correlationId ?? '',
      occurredAt: event.occurredAt ?? new Date().toISOString(),
      payload: event.payload ?? {},
    },
  };
}

function handleMessage(msg: ConsumeMessage, ack: () => void): void {
  try {
    const raw = msg.content.toString();
    let event: RentWheelsEvent;

    try {
      event = JSON.parse(raw) as RentWheelsEvent;
    } catch {
      console.warn('[bus-service][rabbitmq] Mensaje JSON inválido — ACK para evitar requeue');
      ack();
      return;
    }

    if (!isValidEvent(event)) {
      console.warn('[bus-service][rabbitmq] Evento mal formado — ACK:', {
        routingKey: event.routingKey ?? event.eventType,
      });
      ack();
      return;
    }

    const mapped = mapToSocketEvent(event);
    if (!mapped) {
      console.warn('[bus-service][rabbitmq] Routing key sin mapeo WebSocket — ACK:', event.routingKey);
      ack();
      return;
    }

    emitMarketplaceEvent(mapped.socketEvent, mapped.data);

    console.log('[bus-service][rabbitmq] Evento reenviado por WebSocket:', {
      routingKey: event.routingKey ?? event.eventType,
      socketEvent: mapped.socketEvent,
      correlationId: event.correlationId,
    });

    ack();
  } catch (err) {
    console.warn(
      '[bus-service][rabbitmq] Error procesando mensaje — ACK para evitar loop:',
      err instanceof Error ? err.message : err,
    );
    ack();
  }
}

export async function startEventConsumer(): Promise<void> {
  if (!isRabbitMqConfigured()) {
    return;
  }

  try {
    const channel = await getRabbitMqChannel();
    if (!channel) {
      return;
    }

    await channel.consume(
      BUS_MARKETPLACE_QUEUE,
      (msg) => {
        if (!msg) {
          return;
        }
        handleMessage(msg, () => channel.ack(msg));
      },
      { noAck: false },
    );

    console.log('[bus-service][rabbitmq] Consumer activo');
  } catch (err) {
    console.warn(
      '[bus-service][rabbitmq] No se pudo iniciar consumer:',
      err instanceof Error ? err.message : err,
    );
  }
}
