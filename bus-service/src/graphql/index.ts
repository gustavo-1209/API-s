import type { Server as HttpServer } from 'http';
import type { Express, Request, Response } from 'express';
import { ApolloServer } from '@apollo/server';
import { HeaderMap } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { buildGraphQLContext } from './context.js';

function buildHeaderMap(req: Request): HeaderMap {
  const headers = new HeaderMap();

  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) {
      continue;
    }
    headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }

  return headers;
}

async function sendGraphQLResponse(
  res: Response,
  httpGraphQLResponse: Awaited<ReturnType<ApolloServer['executeHTTPGraphQLRequest']>>,
): Promise<void> {
  for (const [key, value] of httpGraphQLResponse.headers) {
    res.setHeader(key, value);
  }

  res.statusCode = httpGraphQLResponse.status ?? 200;

  if (httpGraphQLResponse.body.kind === 'complete') {
    res.send(httpGraphQLResponse.body.string);
    return;
  }

  for await (const chunk of httpGraphQLResponse.body.asyncIterator) {
    res.write(chunk);
  }
  res.end();
}

export async function setupGraphQL(app: Express, httpServer: HttpServer): Promise<ApolloServer> {
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: process.env.NODE_ENV !== 'production',
  });

  await apolloServer.start();

  const handler = async (req: Request, res: Response): Promise<void> => {
    try {
      const httpGraphQLResponse = await apolloServer.executeHTTPGraphQLRequest({
        httpGraphQLRequest: {
          method: req.method.toUpperCase(),
          headers: buildHeaderMap(req),
          search: req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '',
          body: req.body,
        },
        context: async () => buildGraphQLContext(req),
      });

      await sendGraphQLResponse(res, httpGraphQLResponse);
    } catch (err) {
      console.error('[bus-service][graphql] Error interno:', err instanceof Error ? err.message : err);
      if (!res.headersSent) {
        res.status(500).json({
          errors: [{ message: 'Error interno del servidor GraphQL' }],
        });
      }
    }
  };

  app.post('/graphql', handler);
  app.get('/graphql', handler);

  console.log('[bus-service][graphql] Apollo Server montado en POST/GET /graphql');
  return apolloServer;
}
