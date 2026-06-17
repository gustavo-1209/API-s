import amqp, { Channel } from 'amqplib';

const DEFAULT_EXCHANGE = 'rentwheels.events';
export const BUS_MARKETPLACE_QUEUE = 'bus-service.marketplace-events';

export const CONSUMED_ROUTING_KEYS = [
  'reserva.creada',
  'reserva.confirmada',
  'reserva.cancelada',
  'vehiculo.reservado',
  'vehiculo.liberado',
] as const;

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;

let connection: AmqpConnection | null = null;
let channel: Channel | null = null;
let warnedNotConfigured = false;

export function isRabbitMqConfigured(): boolean {
  return process.env.RABBITMQ_URL !== undefined;
}

export function getRabbitMqExchangeName(): string {
  return process.env.RABBITMQ_EXCHANGE?.trim() || DEFAULT_EXCHANGE;
}

function warnNotConfigured(): void {
  if (!warnedNotConfigured) {
    console.warn('[bus-service][rabbitmq] RABBITMQ_URL no configurado — consumer deshabilitado');
    warnedNotConfigured = true;
  }
}

function resetConnection(): void {
  channel = null;
  connection = null;
}

export async function getRabbitMqChannel(): Promise<Channel | null> {
  if (!isRabbitMqConfigured()) {
    warnNotConfigured();
    return null;
  }

  if (channel) {
    return channel;
  }

  try {
    const url = process.env.RABBITMQ_URL!;
    connection = await amqp.connect(url);
    channel = await connection.createChannel();

    await channel.assertExchange(getRabbitMqExchangeName(), 'topic', { durable: true });
    await channel.assertQueue(BUS_MARKETPLACE_QUEUE, { durable: true });

    for (const routingKey of CONSUMED_ROUTING_KEYS) {
      await channel.bindQueue(BUS_MARKETPLACE_QUEUE, getRabbitMqExchangeName(), routingKey);
    }

    connection.on('error', (err) => {
      console.warn('[bus-service][rabbitmq] Error de conexión:', err.message);
      resetConnection();
    });

    connection.on('close', () => {
      resetConnection();
    });

    console.log(`[bus-service][rabbitmq] Conectado — exchange: ${getRabbitMqExchangeName()}, queue: ${BUS_MARKETPLACE_QUEUE}`);
    return channel;
  } catch (err) {
    console.warn(
      '[bus-service][rabbitmq] No se pudo conectar:',
      err instanceof Error ? err.message : err,
    );
    resetConnection();
    return null;
  }
}
