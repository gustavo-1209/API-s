import { Router, Request, Response } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware.js';

type ServiceName = 'auth';

const SERVICE_URLS: Record<ServiceName, string | undefined> = {
  auth: process.env['AUTH_SERVICE_URL'],
};

function cleanBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function buildTargetUrl(baseUrl: string, path: string, req: Request): string {
  const url = new URL(path, cleanBaseUrl(baseUrl));

  for (const [key, value] of Object.entries(req.query)) {
    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(key, String(item)));
    } else if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function forwardRequest(
  req: Request,
  res: Response,
  service: ServiceName,
  path: string,
  bodyOverride?: Record<string, unknown>,
): Promise<void> {
  const baseUrl = SERVICE_URLS[service];

  if (!baseUrl) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVICE_URL_NOT_CONFIGURED',
        message: `La URL del servicio ${service} no está configurada.`,
      },
    });
    return;
  }

  const targetUrl = buildTargetUrl(baseUrl, path, req);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const authorization = req.header('authorization');
  if (authorization) {
    headers.Authorization = authorization;
  }

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (!['GET', 'HEAD'].includes(req.method)) {
    init.body = JSON.stringify(bodyOverride ?? req.body ?? {});
  }

  try {
    const upstreamResponse = await fetch(targetUrl, init);
    const text = await upstreamResponse.text();
    const contentType = upstreamResponse.headers.get('content-type') ?? 'application/json';

    res.status(upstreamResponse.status);
    res.setHeader('Content-Type', contentType);

    if (!text) {
      res.end();
      return;
    }

    res.send(text);
  } catch (error) {
    console.error('[client-gateway] error:', error);

    res.status(502).json({
      success: false,
      error: {
        code: 'BAD_GATEWAY',
        message: 'No se pudo comunicar con el microservicio interno.',
      },
    });
  }
}

export function createClientGatewayRouter(): Router {
  const router = Router();

  router.post('/auth/register', (req, res) => {
    const body = {
      ...req.body,
      role: 'CLIENTE',
    };

    return forwardRequest(
      req,
      res,
      'auth',
      '/api/v1/gustavobenalcazar/auth/register',
      body,
    );
  });

  router.post('/auth/login', (req, res) =>
    forwardRequest(req, res, 'auth', '/api/v1/gustavobenalcazar/auth/login'),
  );

  router.get('/auth/me', authenticate, (req, res) =>
    forwardRequest(req, res, 'auth', '/api/v1/gustavobenalcazar/auth/me'),
  );

  router.patch('/auth/me', authenticate, (req, res) =>
    forwardRequest(req, res, 'auth', '/api/v1/gustavobenalcazar/auth/me'),
  );

  return router;
}