import { isAxiosError } from 'axios';
import { adminApi } from '@/api/api';
import { unwrapApiList } from '@/lib/api-unwrap';
import type { AdminCatalogMaps, AdminModeloCatalog } from '@/types/admin';
import { EMPTY_CATALOG_MAPS } from '@/types/admin';

function asRecord(raw: unknown): Record<string, unknown> {
  return raw !== null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

function buildNameMap(list: unknown[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of list) {
    const r = asRecord(item);
    const id = typeof r.id === 'string' ? r.id : '';
    const nombre = typeof r.nombre === 'string' ? r.nombre.trim() : '';
    if (id && nombre) map.set(id, nombre);
  }
  return map;
}

function buildModeloCatalog(list: unknown[]): {
  modelos: Map<string, string>;
  modelosDetalle: AdminModeloCatalog[];
} {
  const modelos = new Map<string, string>();
  const modelosDetalle: AdminModeloCatalog[] = [];

  for (const item of list) {
    const r = asRecord(item);
    const id = typeof r.id === 'string' ? r.id : '';
    const nombre = typeof r.nombre === 'string' ? r.nombre.trim() : '';
    if (!id || !nombre) continue;

    modelos.set(id, nombre);

    let marcaId: string | undefined;
    if (typeof r.marcaId === 'string' && r.marcaId.trim()) {
      marcaId = r.marcaId.trim();
    } else if (r.marca && typeof r.marca === 'object') {
      const marcaRecord = r.marca as Record<string, unknown>;
      if (typeof marcaRecord.id === 'string' && marcaRecord.id.trim()) {
        marcaId = marcaRecord.id.trim();
      }
    }

    modelosDetalle.push({ id, nombre, marcaId });
  }

  return { modelos, modelosDetalle };
}

async function fetchCatalogMap(path: string): Promise<Map<string, string>> {
  try {
    const { data } = await adminApi.get<unknown>(path);
    return buildNameMap(unwrapApiList<unknown>(data));
  } catch (err: unknown) {
    if (isAxiosError(err) && !err.response) {
      throw err;
    }
    return new Map();
  }
}

async function fetchModelosCatalog(): Promise<{
  modelos: Map<string, string>;
  modelosDetalle: AdminModeloCatalog[];
}> {
  try {
    const { data } = await adminApi.get<unknown>('/modelos');
    return buildModeloCatalog(unwrapApiList<unknown>(data));
  } catch (err: unknown) {
    if (isAxiosError(err) && !err.response) {
      throw err;
    }
    return { modelos: new Map(), modelosDetalle: [] };
  }
}

export async function fetchAdminCatalogs(): Promise<AdminCatalogMaps> {
  const [marcas, modelosData, categorias, agencias, tiposCombustible, tiposTransmision] =
    await Promise.all([
      fetchCatalogMap('/marcas'),
      fetchModelosCatalog(),
      fetchCatalogMap('/categorias'),
      fetchCatalogMap('/agencias'),
      fetchCatalogMap('/tipos-combustible'),
      fetchCatalogMap('/tipos-transmision'),
    ]);

  return {
    marcas,
    modelos: modelosData.modelos,
    modelosDetalle: modelosData.modelosDetalle,
    categorias,
    agencias,
    tiposCombustible,
    tiposTransmision,
  };
}

export function mergeCatalogMaps(
  base: AdminCatalogMaps,
  extra: Partial<AdminCatalogMaps>,
): AdminCatalogMaps {
  return {
    marcas: extra.marcas ?? base.marcas,
    modelos: extra.modelos ?? base.modelos,
    modelosDetalle: extra.modelosDetalle ?? base.modelosDetalle,
    categorias: extra.categorias ?? base.categorias,
    agencias: extra.agencias ?? base.agencias,
    tiposCombustible: extra.tiposCombustible ?? base.tiposCombustible,
    tiposTransmision: extra.tiposTransmision ?? base.tiposTransmision,
  };
}

export { EMPTY_CATALOG_MAPS };
