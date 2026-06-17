import type { Request } from 'express';

export interface GraphQLContext {
  authorization?: string;
  idempotencyKey?: string;
  correlationId?: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function headerValue(req: Request, name: string): string | undefined {
  const value = req.headers[name];
  if (Array.isArray(value)) {
    return value[0]?.trim() || undefined;
  }
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

function isValidUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * Contexto por request GraphQL.
 * - Authorization: propagado si el cliente lo envía.
 * - x-idempotency-key / x-correlation-id: propagados si son UUID válidos.
 *   Para crearReserva, si no hay idempotency key en headers, el resolver puede
 *   usar input.idempotencyKey o generar uno automáticamente (ver resolvers).
 */
export function buildGraphQLContext(req: Request): GraphQLContext {
  const authorization = headerValue(req, 'authorization');
  const rawIdempotency = headerValue(req, 'x-idempotency-key');
  const rawCorrelation = headerValue(req, 'x-correlation-id');

  return {
    authorization,
    idempotencyKey: rawIdempotency && isValidUuid(rawIdempotency) ? rawIdempotency : undefined,
    correlationId: rawCorrelation && isValidUuid(rawCorrelation) ? rawCorrelation : undefined,
  };
}
