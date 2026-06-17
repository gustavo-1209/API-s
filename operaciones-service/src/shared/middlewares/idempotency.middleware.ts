import { Request, Response, NextFunction } from 'express';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type IdempotencyState = 'PROCESSING' | 'COMPLETED';

interface IdempotencyEntry {
  state: IdempotencyState;
  statusCode?: number;
  body?: unknown;
}

/**
 * Almacén en memoria para claves de idempotencia.
 * Implementación inicial de esta fase — puede migrarse luego a Redis o tabla persistente.
 */
const idempotencyStore = new Map<string, IdempotencyEntry>();

declare global {
  namespace Express {
    interface Request {
      idempotencyKey?: string;
    }
  }
}

function isValidUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * Idempotencia HTTP para POST mediante X-Idempotency-Key (UUID obligatorio).
 * Solo debe aplicarse a rutas de creación que lo requieran.
 */
export function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const raw = req.headers['x-idempotency-key'];
  const key = typeof raw === 'string' ? raw.trim() : '';

  if (!key) {
    res.status(400).json({
      success: false,
      error: {
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'El header X-Idempotency-Key es obligatorio',
      },
    });
    return;
  }

  if (!isValidUuid(key)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'IDEMPOTENCY_KEY_INVALID',
        message: 'X-Idempotency-Key debe ser un UUID válido',
      },
    });
    return;
  }

  req.idempotencyKey = key;

  const existing = idempotencyStore.get(key);

  if (existing?.state === 'COMPLETED') {
    res.status(existing.statusCode ?? 200).json(existing.body);
    return;
  }

  if (existing?.state === 'PROCESSING') {
    res.status(409).json({
      success: false,
      error: {
        code: 'IDEMPOTENCY_CONFLICT',
        message: 'La solicitud con esta X-Idempotency-Key ya está en procesamiento',
      },
    });
    return;
  }

  idempotencyStore.set(key, { state: 'PROCESSING' });

  let statusCode = 200;

  const originalStatus = res.status.bind(res);
  res.status = function status(code: number) {
    statusCode = code;
    return originalStatus(code);
  } as typeof res.status;

  const originalJson = res.json.bind(res);
  res.json = function json(body: unknown) {
    if (statusCode >= 200 && statusCode < 300) {
      idempotencyStore.set(key, {
        state: 'COMPLETED',
        statusCode,
        body,
      });
    } else {
      idempotencyStore.delete(key);
    }
    return originalJson(body);
  } as typeof res.json;

  res.on('finish', () => {
    const entry = idempotencyStore.get(key);
    if (entry?.state === 'PROCESSING') {
      idempotencyStore.delete(key);
    }
  });

  next();
}

/** Expuesto solo para pruebas unitarias futuras. */
export function clearIdempotencyStore(): void {
  idempotencyStore.clear();
}
