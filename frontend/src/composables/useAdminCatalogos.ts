import { isAxiosError } from 'axios';
import { adminApi } from '@/api/api';
import { unwrapApiList } from '@/lib/api-unwrap';
import type { AdminCatalogMaps } from '@/types/admin';
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

async function fetchCatalogMap(path: string): Promise<Map<string, string>> {
  try {
    const { data } = await adminApi.get<unknown>(path);
    return buildNameMap(unwrapApiList<unknown>(data));
  } catch (err: unknown) {
    if (isAxiosError(err) && (err.response?.status === 404 || err.response?.status === 501)) {
      return new Map();
    }
    return new Map();
  }
}

export async function fetchAdminCatalogs(): Promise<AdminCatalogMaps> {
  const [marcas, modelos, categorias, agencias] = await Promise.all([
    fetchCatalogMap('/marcas'),
    fetchCatalogMap('/modelos'),
    fetchCatalogMap('/categorias'),
    fetchCatalogMap('/agencias'),
  ]);

  return { marcas, modelos, categorias, agencias };
}

export function mergeCatalogMaps(
  base: AdminCatalogMaps,
  extra: Partial<AdminCatalogMaps>,
): AdminCatalogMaps {
  return {
    marcas: extra.marcas ?? base.marcas,
    modelos: extra.modelos ?? base.modelos,
    categorias: extra.categorias ?? base.categorias,
    agencias: extra.agencias ?? base.agencias,
  };
}

export { EMPTY_CATALOG_MAPS };
