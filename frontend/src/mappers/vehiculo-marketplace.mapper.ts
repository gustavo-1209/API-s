import type { VehiculoMarketplace } from '@/types/vehiculo';

function parsePrecio(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function buildNombreLegacy(raw: Record<string, unknown>): string {
  const modelo = raw.modelo;
  if (!modelo || typeof modelo !== 'object') return 'Vehículo';

  const m = modelo as Record<string, unknown>;
  const marca =
    m.marca && typeof m.marca === 'object'
      ? String((m.marca as Record<string, unknown>).nombre ?? '').trim()
      : '';
  const modeloNombre = String(m.nombre ?? '').trim();
  const anio = raw.anio ? String(raw.anio) : '';

  return [marca, modeloNombre, anio].filter(Boolean).join(' ') || 'Vehículo';
}

/** Normaliza el detalle del vehículo del Booking Gateway para la UI de reserva. */
export function normalizeVehiculoMarketplace(raw: unknown): VehiculoMarketplace {
  const v = raw as Record<string, unknown>;
  const precioPorDia = parsePrecio(v.precioPorDia ?? v.precioDia);
  const nombre =
    typeof v.nombre === 'string' && v.nombre.trim() ? v.nombre.trim() : buildNombreLegacy(v);

  const categoriaRaw = v.categoria;
  let categoria: string | undefined;
  if (typeof categoriaRaw === 'string') {
    categoria = categoriaRaw;
  } else if (categoriaRaw && typeof categoriaRaw === 'object') {
    categoria = String((categoriaRaw as Record<string, unknown>).nombre ?? '');
  }

  return {
    id: String(v.id ?? ''),
    nombre,
    descripcion: typeof v.descripcion === 'string' ? v.descripcion : null,
    precioPorDia,
    moneda: typeof v.moneda === 'string' ? v.moneda : null,
    categoria: categoria ?? null,
    agenciaId: typeof v.agenciaId === 'string' ? v.agenciaId : null,
    disponible: typeof v.disponible === 'boolean' ? v.disponible : undefined,
    status: typeof v.status === 'string' ? v.status : null,
    imagenUrl: typeof v.imagenUrl === 'string' ? v.imagenUrl : null,
    placa: typeof v.placa === 'string' ? v.placa : null,
  };
}
