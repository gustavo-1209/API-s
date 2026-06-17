import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { initSocketServer } from './shared/websocket/socket-server.js';
import { startEventConsumer } from './shared/messaging/event-consumer.js';
import { isRabbitMqConfigured } from './shared/messaging/rabbitmq.js';

const PORT = Number(process.env.PORT ?? 3007);

const httpServer = http.createServer(app);
initSocketServer(httpServer);
void startEventConsumer();

httpServer.listen(PORT, () => {
  console.log(`[bus-service] corriendo en http://localhost:${PORT}`);
  console.log(`[bus-service] WebSocket: /socket.io`);
  console.log(`[bus-service] RabbitMQ: ${isRabbitMqConfigured() ? 'configurado' : 'no configurado'}`);
  console.log(`[bus-service] Azure SB: ${process.env.AZURE_SERVICEBUS_CONNECTION_STRING ? 'CONECTADO' : 'modo local'}`);
});
