import { Router, Request, Response } from 'express';

type ServiceName = 'inventario' | 'operaciones' | 'financiero';

const SERVICE_URLS: Record<ServiceName, string | undefined> = {
  inventario: process.env['INVENTARIO_SERVICE_URL'],
  operaciones: process.env['OPERACIONES_SERVICE_URL'],
  financiero: process.env['FINANCIERO_SERVICE_URL'],
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

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (!['GET', 'HEAD'].includes(req.method)) {
    init.body = JSON.stringify(req.body ?? {});
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
    console.error('[booking-gateway] error:', error);

    res.status(502).json({
      success: false,
      error: {
        code: 'BAD_GATEWAY',
        message: 'No se pudo comunicar con el microservicio interno.',
      },
    });
  }
}

export function createBookingGatewayRouter(): Router {
  const router = Router();

  // Inventario
  router.get('/vehiculos', (req, res) =>
    forwardRequest(req, res, 'inventario', '/api/v1/gustavobenalcazar/vehiculos/booking'),
  );

  router.get('/vehiculos/marketplace', (req, res) =>
    forwardRequest(req, res, 'inventario', '/api/v1/gustavobenalcazar/vehiculos/marketplace'),
  );

  router.get('/vehiculos/:id', (req, res) =>
    forwardRequest(req, res, 'inventario', `/api/v1/gustavobenalcazar/vehiculos/booking/${req.params.id}`),
  );

  router.get('/vehiculos/:id/disponibilidad', (req, res) =>
    forwardRequest(req, res, 'inventario', `/api/v1/gustavobenalcazar/vehiculos/booking/${req.params.id}/disponibilidad`),
  );

  // Operaciones
  router.get('/seguros', (req, res) =>
    forwardRequest(req, res, 'operaciones', '/api/v1/gustavobenalcazar/seguros'),
  );

  router.get('/tarifas', (req, res) =>
    forwardRequest(req, res, 'operaciones', '/api/v1/gustavobenalcazar/tarifas'),
  );

  router.get('/canales-venta', (req, res) =>
    forwardRequest(req, res, 'operaciones', '/api/v1/gustavobenalcazar/canales-venta'),
  );

  router.post('/reservas', (req, res) =>
    forwardRequest(req, res, 'operaciones', '/api/v1/gustavobenalcazar/reservas/booking'),
  );

  router.get('/reservas/:id', (req, res) =>
    forwardRequest(req, res, 'operaciones', `/api/v1/gustavobenalcazar/reservas/booking/${req.params.id}`),
  );

  router.patch('/reservas/:id', (req, res) =>
    forwardRequest(req, res, 'operaciones', `/api/v1/gustavobenalcazar/reservas/booking/${req.params.id}`),
  );

  // Financiero
  router.get('/payment/:reservaId', (req, res) =>
    forwardRequest(req, res, 'financiero', `/api/v1/gustavobenalcazar/payment/booking/${req.params.reservaId}`),
  );

  return router;
}