import { randomUUID } from 'crypto';
import {
  RENTWHEELS_EVENT_TYPES,
  type RentWheelsEvent,
  type RentWheelsEventType,
  type ReservaBookingEventPayload,
} from './event-types.js';
import { getRabbitMqChannel, getRabbitMqExchangeName, isRabbitMqConfigured } from './rabbitmq.js';

export async function publishDomainEvent(
  routingKey: RentWheelsEventType,
  correlationId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const channel = await getRabbitMqChannel();
    if (!channel) {
      return;
    }

    const event: RentWheelsEvent = {
      eventId: randomUUID(),
      eventType: routingKey,
      routingKey,
      occurredAt: new Date().toISOString(),
      correlationId,
      source: 'operaciones-service',
      payload,
    };

    channel.publish(
      getRabbitMqExchangeName(),
      routingKey,
      Buffer.from(JSON.stringify(event)),
      { contentType: 'application/json', persistent: true },
    );
  } catch (err) {
    console.warn(
      '[operaciones-service][rabbitmq] Error publicando evento:',
      routingKey,
      err instanceof Error ? err.message : err,
    );
  }
}

/**
 * Publica los eventos de dominio tras una reserva V2 exitosa.
 * No lanza error si RabbitMQ no está disponible.
 */
export async function publishReservaBookingV2Events(
  correlationId: string,
  payload: ReservaBookingEventPayload,
): Promise<void> {
  if (!isRabbitMqConfigured()) {
    return;
  }

  const payloadRecord = payload as unknown as Record<string, unknown>;

  await publishDomainEvent(RENTWHEELS_EVENT_TYPES.RESERVA_CREADA, correlationId, payloadRecord);
  await publishDomainEvent(RENTWHEELS_EVENT_TYPES.RESERVA_CONFIRMADA, correlationId, payloadRecord);
  await publishDomainEvent(RENTWHEELS_EVENT_TYPES.VEHICULO_RESERVADO, correlationId, payloadRecord);
}
