import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.middleware.js';

type ServiceName =
  | 'auth'
  | 'inventario'
  | 'operaciones'
  | 'financiero'
  | 'mantenimiento'
  | 'org';

const SERVICE_URLS: Record<ServiceName, string | undefined> = {
  auth: process.env['AUTH_SERVICE_URL'],
  inventario: process.env['INVENTARIO_SERVICE_URL'],
  operaciones: process.env['OPERACIONES_SERVICE_URL'],
  financiero: process.env['FINANCIERO_SERVICE_URL'],
  mantenimiento: process.env['MANTENIMIENTO_SERVICE_URL'],
  org: process.env['ORG_SERVICE_URL'],
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

  const authorization = req.header('authorization');
  if (authorization) {
    headers.Authorization = authorization;
  }

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
    console.error('[admin-gateway] error:', error);

    res.status(502).json({
      success: false,
      error: {
        code: 'BAD_GATEWAY',
        message: 'No se pudo comunicar con el microservicio interno.',
      },
    });
  }
}

function getAdminSubPath(req: Request, prefix: string): string {
  const basePath = `/api/v1/gustavobenalcazar/admin${prefix}`;
  const originalPath = req.originalUrl.split('?')[0] ?? '';
  const subPath = originalPath.startsWith(basePath)
    ? originalPath.slice(basePath.length)
    : '';

  return subPath || '';
}

function proxyPrefix(
  router: Router,
  adminPrefix: string,
  service: ServiceName,
  targetPrefix: string,
): void {
  router.use(adminPrefix, (req, res) => {
    const subPath = getAdminSubPath(req, adminPrefix);
    return forwardRequest(req, res, service, `${targetPrefix}${subPath}`);
  });
}

export function createAdminGatewayRouter(): Router {
  
  const router = Router();

  router.post('/auth/login', (req, res) =>
  forwardRequest(req, res, 'auth', '/api/v1/gustavobenalcazar/auth/login'),
);

router.use(authenticate, requireAdmin);
  proxyPrefix(router, '/auth', 'auth', '/api/v1/gustavobenalcazar/auth');
  proxyPrefix(router, '/usuarios', 'auth', '/api/v1/gustavobenalcazar/usuarios');

  proxyPrefix(router, '/vehiculos', 'inventario', '/api/v1/gustavobenalcazar/vehiculos');
  proxyPrefix(router, '/marcas', 'inventario', '/api/v1/gustavobenalcazar/marcas');
  proxyPrefix(router, '/modelos', 'inventario', '/api/v1/gustavobenalcazar/modelos');
  proxyPrefix(router, '/categorias', 'inventario', '/api/v1/gustavobenalcazar/categorias');
  proxyPrefix(router, '/extras', 'inventario', '/api/v1/gustavobenalcazar/extras');
  proxyPrefix(router, '/tipos-combustible', 'inventario', '/api/v1/gustavobenalcazar/tipos-combustible');
  proxyPrefix(router, '/tipos-transmision', 'inventario', '/api/v1/gustavobenalcazar/tipos-transmision');

  proxyPrefix(router, '/reservas', 'operaciones', '/api/v1/gustavobenalcazar/reservas');
  proxyPrefix(router, '/alquileres', 'operaciones', '/api/v1/gustavobenalcazar/alquileres');
  proxyPrefix(router, '/devoluciones', 'operaciones', '/api/v1/gustavobenalcazar/devoluciones');
  proxyPrefix(router, '/seguros', 'operaciones', '/api/v1/gustavobenalcazar/seguros');
  proxyPrefix(router, '/tarifas', 'operaciones', '/api/v1/gustavobenalcazar/tarifas');
  proxyPrefix(router, '/canales-venta', 'operaciones', '/api/v1/gustavobenalcazar/canales-venta');

  proxyPrefix(router, '/pagos', 'financiero', '/api/v1/gustavobenalcazar/pagos');
  proxyPrefix(router, '/facturas', 'financiero', '/api/v1/gustavobenalcazar/facturas');

  proxyPrefix(router, '/mantenimientos', 'mantenimiento', '/api/v1/gustavobenalcazar/mantenimientos');
  proxyPrefix(router, '/kardex', 'mantenimiento', '/api/v1/gustavobenalcazar/kardex');
  proxyPrefix(router, '/sistemas-externos', 'mantenimiento', '/api/v1/gustavobenalcazar/sistemas-externos');

  proxyPrefix(router, '/empresas', 'org', '/api/v1/gustavobenalcazar/empresas');
  proxyPrefix(router, '/agencias', 'org', '/api/v1/gustavobenalcazar/agencias');
  proxyPrefix(router, '/provincias', 'org', '/api/v1/gustavobenalcazar/provincias');
  proxyPrefix(router, '/ciudades', 'org', '/api/v1/gustavobenalcazar/ciudades');

  return router;
}