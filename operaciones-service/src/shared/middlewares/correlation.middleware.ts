import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

function isValidUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * Asigna correlationId desde X-Correlation-Id (UUID) o genera uno nuevo.
 * Siempre devuelve el header X-Correlation-Id en la respuesta.
 */
export function correlationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers['x-correlation-id'];
  const incoming = typeof header === 'string' ? header.trim() : '';

  req.correlationId = incoming && isValidUuid(incoming) ? incoming : randomUUID();
  res.setHeader('X-Correlation-Id', req.correlationId);
  next();
}
