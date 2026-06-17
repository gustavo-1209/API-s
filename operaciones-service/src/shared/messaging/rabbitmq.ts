import amqp, { Channel } from 'amqplib';

const DEFAULT_EXCHANGE = 'rentwheels.events';

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
    console.warn('[operaciones-service][rabbitmq] RABBITMQ_URL no configurado — publicación de eventos deshabilitada');
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

    connection.on('error', (err) => {
      console.warn('[operaciones-service][rabbitmq] Error de conexión:', err.message);
      resetConnection();
    });

    connection.on('close', () => {
      resetConnection();
    });

    console.log(`[operaciones-service][rabbitmq] Conectado — exchange: ${getRabbitMqExchangeName()}`);
    return channel;
  } catch (err) {
    console.warn(
      '[operaciones-service][rabbitmq] No se pudo conectar:',
      err instanceof Error ? err.message : err,
    );
    resetConnection();
    return null;
  }
}
