import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { initSocketServer } from './shared/websocket/socket-server.js';
import { startEventConsumer } from './shared/messaging/event-consumer.js';
import { isRabbitMqConfigured } from './shared/messaging/rabbitmq.js';
import { setupGraphQL } from './graphql/index.js';

const PORT = Number(process.env.PORT ?? 3007);

async function main(): Promise<void> {
  const httpServer = http.createServer(app);
  initSocketServer(httpServer);
  void startEventConsumer();
  await setupGraphQL(app, httpServer);

  httpServer.listen(PORT, () => {
    console.log(`[bus-service] corriendo en http://localhost:${PORT}`);
    console.log(`[bus-service] GraphQL: POST/GET /graphql`);
    console.log(`[bus-service] WebSocket: /socket.io`);
    console.log(`[bus-service] RabbitMQ: ${isRabbitMqConfigured() ? 'configurado' : 'no configurado'}`);
    console.log(`[bus-service] Azure SB: ${process.env.AZURE_SERVICEBUS_CONNECTION_STRING ? 'CONECTADO' : 'modo local'}`);
  });
}

main().catch((err) => {
  console.error('[bus-service] Error al iniciar:', err);
  process.exit(1);
});
