import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

let io: Server | null = null;

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN ?? '*',
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    console.log('[bus-service][websocket] cliente conectado:', socket.id);

    socket.on('disconnect', () => {
      console.log('[bus-service][websocket] cliente desconectado:', socket.id);
    });
  });

  console.log('[bus-service][websocket] Socket.io inicializado en /socket.io');
  return io;
}

export interface MarketplaceWebSocketPayload {
  eventType: string;
  correlationId: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}

export function emitMarketplaceEvent(
  socketEventName: string,
  data: MarketplaceWebSocketPayload,
): void {
  if (!io) {
    console.warn('[bus-service][websocket] Socket.io no inicializado — evento omitido:', socketEventName);
    return;
  }

  io.emit(socketEventName, data);
}

export function isSocketServerReady(): boolean {
  return io !== null;
}
