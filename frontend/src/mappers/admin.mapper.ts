import { unwrapApiData } from '@/lib/api-unwrap';
import { obtenerAlquilerDeCache } from '@/lib/alquiler-reserva-cache';
import type {
  AdminAlquilerActivoIndex,
  AdminCatalogMaps,
  AdminFactura,
  AdminPago,
  AdminReservaRow,
  AdminTableRow,
  AdminVehiculoRow,
} from '@/types/admin';
import { EMPTY_CATALOG_MAPS } from '@/types/admin';

export { unwrapApiList } from '@/lib/api-unwrap';

export function asRecord(raw: unknown): Record<string, unknown> {
  return raw !== null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

export function getString(
  item: Record<string, unknown>,
  fields: readonly string[],
  fallback = '',
): string {
  for (const field of fields) {
    const value = item[field];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

export function getNumber(item: Record<string, unknown>, fields: readonly string[]): number | null {
  for (const field of fields) {
    const value = item[field];
    if (value === null || value === undefined) continue;
    const n = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function getBoolean(item: Record<string, unknown>, fields: readonly string[]): boolean | null {
  for (const field of fields) {
    const value = item[field];
    if (typeof value === 'boolean') return value;
  }
  return null;
}

/** Recorre paths con puntos, p. ej. `['modelo.marca.nombre']`. */
export function getNestedString(item: Record<string, unknown>, paths: readonly string[]): string {
  for (const path of paths) {
    const parts = path.split('.');
    let current: unknown = item;

    for (const part of parts) {
      if (!current || typeof current !== 'object') {
        current = undefined;
        break;
      }
      current = (current as Record<string, unknown>)[part];
    }

    if (typeof current === 'string' && current.trim()) return current.trim();
    if (typeof current === 'number' && Number.isFinite(current)) return String(current);
  }
  return '';
}

export function getNestedNumber(item: Record<string, unknown>, paths: readonly string[]): number | null {
  for (const path of paths) {
    const parts = path.split('.');
    let current: unknown = item;

    for (const part of parts) {
      if (!current || typeof current !== 'object') {
        current = undefined;
        break;
      }
      current = (current as Record<string, unknown>)[part];
    }

    if (typeof current === 'number' && Number.isFinite(current)) return current;
    if (typeof current === 'string' && current.trim()) {
      const parsed = Number.parseFloat(current);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

const KARDEX_KM_FIELDS = [
  'kilometraje',
  'kilometrajeActual',
  'km',
  'kmActual',
  'odometro',
  'odometroActual',
  'kar_kilometraje',
] as const;

const KARDEX_KM_NESTED_PATHS = [
  'vehiculo.kilometraje',
  'vehiculo.kilometrajeActual',
  'vehiculo.km',
  'vehiculo.kmActual',
] as const;

function resolveKardexKilometraje(r: Record<string, unknown>): string {
  const direct = getNumber(r, KARDEX_KM_FIELDS);
  if (direct !== null) {
    return `${direct.toLocaleString('es-EC')} km`;
  }

  const nested = getNestedNumber(r, KARDEX_KM_NESTED_PATHS);
  if (nested !== null) {
    return `${nested.toLocaleString('es-EC')} km`;
  }

  return 'No registrado';
}

export function shortId(value: unknown): string {
  const s = String(value ?? '').trim();
  if (!s) return '—';
  if (s.length <= 12) return s;
  return `${s.slice(0, 8)}…`;
}

export function formatReference(value: unknown): string {
  const s = String(value ?? '').trim();
  if (!s) return '—';
  if (/^(PAY|FAC|RES)-/i.test(s) || s.length <= 22) return s;
  return shortId(s);
}

export function formatDate(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';

  const date =
    value instanceof Date
      ? value
      : new Date(typeof value === 'string' || typeof value === 'number' ? value : String(value));

  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  if (typeof value === 'string' && value.length >= 10) {
    return value.slice(0, 10);
  }

  return '—';
}

export function formatMoney(value: unknown): string {
  let n: number | null = null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    n = value;
  } else if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseFloat(value);
    n = Number.isFinite(parsed) ? parsed : null;
  }

  if (n === null) {
    if (typeof value === 'string' && value.trim()) return value;
    return '—';
  }
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

function joinParts(parts: string[]): string {
  return parts.map((p) => p.trim()).filter(Boolean).join(' ');
}

function resolveMarca(r: Record<string, unknown>, catalogs: AdminCatalogMaps): string {
  if (typeof r.marca === 'string' && r.marca.trim()) return r.marca.trim();

  const direct = getString(r, ['marcaNombre', 'mar_nombre']);
  if (direct) return direct;

  const nested = getNestedString(r, ['marca.nombre', 'marca.mar_nombre', 'modelo.marca.nombre']);
  if (nested) return nested;

  const marcaId = getString(r, ['marcaId', 'mar_id']);
  if (marcaId && catalogs.marcas.has(marcaId)) return catalogs.marcas.get(marcaId) ?? '';

  const modeloId = getString(r, ['modeloId', 'mod_id']);
  if (modeloId && catalogs.modelos.has(modeloId)) {
    return '';
  }

  return '';
}

function resolveModelo(r: Record<string, unknown>, catalogs: AdminCatalogMaps): string {
  if (typeof r.modelo === 'string' && r.modelo.trim()) return r.modelo.trim();

  const direct = getString(r, ['modeloNombre', 'mod_nombre']);
  if (direct) return direct;

  const nested = getNestedString(r, ['modelo.nombre', 'modelo.mod_nombre']);
  if (nested) return nested;

  const modeloId = getString(r, ['modeloId', 'mod_id']);
  if (modeloId && catalogs.modelos.has(modeloId)) return catalogs.modelos.get(modeloId) ?? '';

  return '';
}

function resolveCategoria(r: Record<string, unknown>, catalogs: AdminCatalogMaps): string {
  if (typeof r.categoria === 'string' && r.categoria.trim()) return r.categoria.trim();

  const direct = getString(r, ['categoriaNombre', 'cat_nombre']);
  if (direct) return direct;

  const nested = getNestedString(r, ['categoria.nombre', 'categoria.cat_nombre']);
  if (nested) return nested;

  const categoriaId = getString(r, ['categoriaId', 'cat_id']);
  if (categoriaId && catalogs.categorias.has(categoriaId)) {
    return catalogs.categorias.get(categoriaId) ?? '';
  }

  return '';
}

function resolvePlaca(r: Record<string, unknown>): string {
  return getString(r, ['placa', 'veh_placa', 'matricula']);
}

function resolveAnio(r: Record<string, unknown>): string {
  const anio = getNumber(r, ['anio', 'veh_anio', 'year']);
  return anio !== null ? String(anio) : '';
}

function buildVehiculoNombre(
  r: Record<string, unknown>,
  marca: string,
  modelo: string,
  placa: string,
  id: string,
): string {
  const direct = getString(r, [
    'nombre',
    'veh_nombre',
    'displayName',
    'titulo',
    'vehiculo',
  ]);
  if (direct) return direct;

  const marcaModeloAnio = joinParts([marca, modelo, resolveAnio(r)]);
  if (marcaModeloAnio) return marcaModeloAnio;

  const marcaNombreFields = joinParts([
    getString(r, ['marcaNombre', 'mar_nombre']),
    getString(r, ['modeloNombre', 'mod_nombre']),
    resolveAnio(r),
  ]);
  if (marcaNombreFields) return marcaNombreFields;

  if (placa) return `Vehículo ${placa}`;
  return `Vehículo ${shortId(id)}`;
}

export function formatVehiculoDisplayLabel(
  row: AdminVehiculoRow | null,
  vehiculoId?: string | null,
): string {
  if (row) {
    const withPlaca =
      row.placa && row.placa !== '—' ? `${row.nombre} (${row.placa})` : row.nombre;
    if (withPlaca.trim()) return withPlaca;
    const legacy = joinParts([row.marca, row.modelo, row.placa].filter((p) => p && p !== '—'));
    if (legacy) return legacy;
  }
  if (vehiculoId) return `Vehículo ${shortId(vehiculoId)}`;
  return '—';
}

function resolveEstado(r: Record<string, unknown>): string {
  const status = getString(r, ['status', 'estado', 'veh_estado']);
  if (status) return status;

  const disponible = getBoolean(r, ['disponible']);
  if (disponible === true) return 'DISPONIBLE';
  if (disponible === false) return 'NO DISPONIBLE';

  return '—';
}

export function normalizeAdminVehiculo(
  raw: unknown,
  catalogs: AdminCatalogMaps = EMPTY_CATALOG_MAPS,
): AdminVehiculoRow | null {
  const r = asRecord(raw);
  const id = getString(r, ['id', 'veh_id']);
  if (!id) return null;

  const placa = resolvePlaca(r) || '—';
  const marca = resolveMarca(r, catalogs) || '—';
  const modelo = resolveModelo(r, catalogs) || '—';
  const categoria = resolveCategoria(r, catalogs) || '—';
  const nombre = buildVehiculoNombre(r, marca, modelo, placa === '—' ? '' : placa, id);

  const precioN = getNumber(r, ['precioPorDia', 'veh_precio_dia', 'precio_dia', 'tarifaDiaria', 'precioDia']);
  const precioPorDia = precioN !== null ? precioN.toFixed(2) : '—';

  const imagenUrl =
    getString(r, ['imagenUrl', 'imagen_url', 'veh_imagen_url', 'fotoUrl'], '') || null;

  const row: AdminVehiculoRow = {
    id,
    nombre,
    placa,
    marca,
    modelo,
    categoria,
    precioPorDia,
    estado: resolveEstado(r),
    imagenUrl,
    displayLabel: '',
  };

  row.displayLabel = formatVehiculoDisplayLabel(row);
  return row;
}

export function isAdminVehiculoDisponible(row: AdminVehiculoRow, raw: unknown): boolean {
  const r = asRecord(raw);
  const disponible = getBoolean(r, ['disponible']);
  if (disponible !== null) return disponible;

  const normalized = row.estado.toUpperCase();
  return (
    normalized === 'DISPONIBLE' ||
    normalized === 'AVAILABLE' ||
    normalized === 'ACTIVO'
  );
}

export function buildVehiculosIndex(rows: AdminVehiculoRow[]): Map<string, AdminVehiculoRow> {
  return new Map(rows.map((row) => [row.id, row]));
}

function resolveReservaVehiculo(
  r: Record<string, unknown>,
  lookup: Map<string, AdminVehiculoRow>,
): string {
  const direct = getString(r, ['vehiculoNombre', 'vehiculoLabel']);
  if (direct) return direct;

  const nestedNombre = getNestedString(r, [
    'vehiculo.nombre',
    'vehiculo.veh_nombre',
    'vehiculo.placa',
  ]);
  if (nestedNombre) return nestedNombre;

  const vehiculoRaw = r.vehiculo;
  if (vehiculoRaw && typeof vehiculoRaw === 'object') {
    const normalized = normalizeAdminVehiculo(vehiculoRaw);
    if (normalized) return normalized.displayLabel;
  }

  const vehiculoId = getString(r, ['vehiculoId', 'veh_id', 'vehiculo_id']);
  if (vehiculoId) {
    const fromIndex = lookup.get(vehiculoId);
    if (fromIndex) return fromIndex.displayLabel;
    return formatVehiculoDisplayLabel(null, vehiculoId);
  }

  return '—';
}

function resolveReservaCliente(r: Record<string, unknown>): string {
  const direct = getString(r, [
    'clienteNombre',
    'clienteLabel',
    'emailCliente',
    'clienteEmail',
  ]);
  if (direct) return direct;

  const nested = getNestedString(r, [
    'cliente.nombres',
    'cliente.nombre',
    'cliente.email',
    'usuario.email',
    'usuario.nombres',
  ]);
  if (nested) return nested;

  const cliente = asRecord(r.cliente);
  const nombres = getString(cliente, ['nombres', 'nombre']);
  const apellidos = getString(cliente, ['apellidos']);
  const fullName = joinParts([nombres, apellidos]);
  if (fullName) return fullName;

  const usuario = asRecord(r.usuario);
  const email = getString(usuario, ['email']);
  if (email) return email;

  const clienteId = getString(r, ['clienteId', 'cliente_id', 'cli_id', 'usuarioId', 'usuario_id']);
  if (clienteId) return `Cliente ${shortId(clienteId)}`;

  return '—';
}

function resolveAlquilerReservaId(r: Record<string, unknown>): string {
  const direct = getString(r, ['reservaId']);
  if (direct) return direct;

  const reserva = r.reserva;
  if (reserva && typeof reserva === 'object') {
    return getString(reserva as Record<string, unknown>, ['id', 'reservaId']);
  }

  return '';
}

/** Normaliza un ítem de GET /alquileres?status=ACTIVO */
export function normalizeAdminAlquilerActivo(raw: unknown): AdminAlquilerActivoIndex | null {
  const r = asRecord(raw);
  const alquilerId = getString(r, ['id']);
  const reservaId = resolveAlquilerReservaId(r);
  if (!alquilerId || !reservaId) return null;

  return {
    alquilerId,
    kmSalida: getNumber(r, ['kmSalida']),
  };
}

/** Construye índice reservaId → alquiler activo. */
export function buildAlquileresActivosIndex(rawList: unknown[]): Map<string, AdminAlquilerActivoIndex> {
  const map = new Map<string, AdminAlquilerActivoIndex>();
  for (const raw of rawList) {
    const entry = normalizeAdminAlquilerActivo(raw);
    if (!entry) continue;
    const reservaId = resolveAlquilerReservaId(asRecord(raw));
    if (reservaId) map.set(reservaId, entry);
  }
  return map;
}

function normalizarEstadoReserva(estado: string): string {
  return estado.trim().toUpperCase();
}

/** Enriquece filas ACTIVA con alquilerId/kmSalida (API + sessionStorage). */
export function enrichAdminReservasConAlquiler(
  rows: AdminReservaRow[],
  alquileresPorReserva: Map<string, AdminAlquilerActivoIndex>,
): AdminReservaRow[] {
  return rows.map((row) => {
    if (normalizarEstadoReserva(row.estado) !== 'ACTIVA') {
      return row;
    }

    const fromApi = alquileresPorReserva.get(row.id);
    const fromCache = obtenerAlquilerDeCache(row.id);

    const alquilerId = fromApi?.alquilerId ?? fromCache?.alquilerId ?? null;
    const kmSalida =
      fromApi?.kmSalida ??
      (fromCache?.kmSalida !== undefined ? fromCache.kmSalida : null) ??
      null;

    if (!alquilerId && kmSalida === null) return row;

    return {
      ...row,
      alquilerId,
      kmSalida,
    };
  });
}

export function normalizeAdminReserva(
  raw: unknown,
  lookup: Map<string, AdminVehiculoRow> = new Map(),
): AdminReservaRow | null {
  const r = asRecord(raw);
  const id = getString(r, ['id', 'reservaId', 'res_id']);
  if (!id) return null;

  const codigo =
    getString(r, ['codigoReserva', 'codigo', 'res_codigo']) || formatReference(id);

  const totalRaw = r.totalAmount ?? r.res_total ?? r.total;
  const total = formatMoney(totalRaw);

  return {
    id,
    codigo,
    vehiculo: resolveReservaVehiculo(r, lookup),
    cliente: resolveReservaCliente(r),
    fechaInicio: formatDate(r.fechaInicio ?? r.res_fecha_inicio),
    fechaFin: formatDate(r.fechaFin ?? r.res_fecha_fin),
    total,
    estado: getString(r, ['status', 'estado'], '—') || '—',
  };
}

export function normalizeAdminPagoDetalle(raw: unknown): AdminPago | null {
  const r = asRecord(raw);
  const id = getString(r, ['id']);
  if (!id) return null;

  const referencia = getString(r, ['referencia', 'codigo', 'numeroReferencia'], id);

  return {
    id,
    referencia: formatReference(referencia),
    monto: formatMoney(r.monto ?? r.amount ?? r.pag_monto),
    metodo: getString(r, ['metodoPago', 'metodo', 'paymentMethod'], '—') || '—',
    fecha: formatDate(r.fechaPago ?? r.fecha ?? r.createdAt ?? r.pag_fecha),
    estado: getString(r, ['status', 'estado'], '—') || '—',
  };
}

/** Normaliza POST /admin/pagos. */
export function normalizeRegistrarPagoResponse(body: unknown): AdminPago {
  const pago = normalizeAdminPagoDetalle(unwrapApiData<unknown>(body));
  if (!pago) {
    throw new Error('Respuesta inválida al registrar el pago.');
  }
  return pago;
}

/** Normaliza PATCH /admin/pagos/:id. */
export function normalizeConfirmarPagoResponse(body: unknown): AdminPago {
  const pago = normalizeAdminPagoDetalle(unwrapApiData<unknown>(body));
  if (!pago) {
    throw new Error('Respuesta inválida al confirmar el pago.');
  }
  return pago;
}

export function normalizeAdminFacturaDetalle(raw: unknown): AdminFactura | null {
  const r = asRecord(raw);
  const id = getString(r, ['id']);
  if (!id) return null;

  return {
    id,
    numero: formatReference(getString(r, ['numeroFactura', 'numero', 'codigo'], id)),
    cliente: getString(r, ['razonSocial', 'clienteNombre']) || getNestedString(r, ['cliente.nombre']) || '—',
    subtotal: formatMoney(r.subtotal ?? r.fac_subtotal),
    total: formatMoney(r.total ?? r.totalAmount ?? r.fac_total),
    fecha: formatDate(r.fechaEmision ?? r.fecha ?? r.createdAt),
    estado: getString(r, ['status', 'estado'], 'Emitida') || 'Emitida',
  };
}

/** Normaliza POST /admin/facturas. */
export function normalizeGenerarFacturaResponse(body: unknown): AdminFactura {
  const factura = normalizeAdminFacturaDetalle(unwrapApiData<unknown>(body));
  if (!factura) {
    throw new Error('Respuesta inválida al generar la factura.');
  }
  return factura;
}

export function normalizeAdminPago(raw: unknown): AdminTableRow | null {
  const pago = normalizeAdminPagoDetalle(raw);
  if (!pago) return null;

  const r = asRecord(raw);

  return {
    id: pago.id,
    referencia: pago.referencia,
    reserva: formatReference(
      getString(r, ['codigoReserva']) ||
        getNestedString(r, ['reserva.codigoReserva']) ||
        r.reservaId,
    ),
    monto: pago.monto,
    metodo: pago.metodo,
    fecha: pago.fecha,
    estado: pago.estado,
  };
}

export function normalizeAdminFactura(raw: unknown): AdminTableRow | null {
  const factura = normalizeAdminFacturaDetalle(raw);
  if (!factura) return null;

  const r = asRecord(raw);

  return {
    id: factura.id,
    numero: factura.numero,
    cliente: factura.cliente,
    reserva: formatReference(r.reservaId),
    subtotal: factura.subtotal,
    total: factura.total,
    fecha: factura.fecha,
    estado: factura.estado,
  };
}

export function normalizeAdminMantenimiento(
  raw: unknown,
  lookup: Map<string, AdminVehiculoRow>,
): AdminTableRow | null {
  const r = asRecord(raw);
  const id = getString(r, ['id']);
  if (!id) return null;

  const vehiculoId = getString(r, ['vehiculoId', 'veh_id']);
  const vehiculo =
    getString(r, ['vehiculoNombre']) ||
    (vehiculoId ? lookup.get(vehiculoId)?.displayLabel : '') ||
    formatVehiculoDisplayLabel(null, vehiculoId);

  const estado = getString(r, ['status', 'estado']);
  const costo = formatMoney(r.costo ?? r.monto ?? r.man_costo);

  return {
    id,
    vehiculo: vehiculo || '—',
    tipo: getString(r, ['tipo', 'tipoMantenimiento', 'man_tipo'], '—') || '—',
    descripcion: getString(r, ['descripcion', 'detalle', 'man_descripcion'], '—') || '—',
    fechaInicio: formatDate(r.fechaInicio ?? r.fecha_inicio ?? r.man_fecha_inicio),
    fechaFin: formatDate(r.fechaFin ?? r.fecha_fin ?? r.man_fecha_fin),
    costo,
    estado: estado || 'Registrado',
  };
}

export function normalizeAdminKardex(
  raw: unknown,
  lookup: Map<string, AdminVehiculoRow>,
): AdminTableRow | null {
  const r = asRecord(raw);
  const id = getString(r, ['id']);
  if (!id) return null;

  const vehiculoId = getString(r, ['vehiculoId', 'veh_id']);
  const vehiculo =
    getString(r, ['vehiculoNombre']) ||
    (vehiculoId ? lookup.get(vehiculoId)?.displayLabel : '') ||
    formatVehiculoDisplayLabel(null, vehiculoId);

  const tipo =
    getString(r, ['tipo', 'tipoMovimiento', 'kar_tipo', 'evento', 'movimiento']) || '—';

  let descripcion =
    getString(r, ['descripcion', 'observacion', 'kar_descripcion', 'detalle']) || '';

  if (!descripcion) {
    const anterior = getString(r, ['estadoAnterior', 'estado_anterior']);
    const nuevo = getString(r, ['estadoNuevo', 'estado_nuevo']);
    if (anterior || nuevo) {
      descripcion = joinParts([anterior && `De ${anterior}`, nuevo && `a ${nuevo}`]);
    }
  }

  return {
    id,
    vehiculo: vehiculo || '—',
    tipo,
    descripcion: descripcion || '—',
    fecha: formatDate(r.fecha ?? r.fechaMovimiento ?? r.createdAt ?? r.kar_fecha),
    kilometraje: resolveKardexKilometraje(r),
    referencia: formatReference(r.referencia ?? r.documento ?? r.kar_referencia),
  };
}
