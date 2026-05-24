import { ref, type Ref } from 'vue';
import { isAxiosError } from 'axios';
import { adminApi } from '@/api/api';
import { logApiKeysInDev } from '@/lib/admin-dev';
import { unwrapApiList } from '@/lib/api-unwrap';
import { normalizeAdminFactura, normalizeAdminPago } from '@/mappers/admin.mapper';
import type { AdminTableRow } from '@/types/admin';

function resolveLoadError(err: unknown, fallback: string): string {
  if (isAxiosError(err) && !err.response) {
    return 'No se pudo conectar con el servidor de administración.';
  }
  return fallback;
}

export interface UseAdminFinancieroReturn {
  pagos: Ref<AdminTableRow[]>;
  facturas: Ref<AdminTableRow[]>;
  loadingPagos: Ref<boolean>;
  loadingFacturas: Ref<boolean>;
  errorPagos: Ref<string | null>;
  errorFacturas: Ref<string | null>;
  fetchPagos: () => Promise<void>;
  fetchFacturas: () => Promise<void>;
}

export function useAdminFinanciero(): UseAdminFinancieroReturn {
  const pagos = ref<AdminTableRow[]>([]);
  const facturas = ref<AdminTableRow[]>([]);
  const loadingPagos = ref(false);
  const loadingFacturas = ref(false);
  const errorPagos = ref<string | null>(null);
  const errorFacturas = ref<string | null>(null);

  async function fetchPagos(): Promise<void> {
    loadingPagos.value = true;
    errorPagos.value = null;

    try {
      const { data } = await adminApi.get<unknown>('/pagos', { params: { page: 1, limit: 200 } });
      const rawList = unwrapApiList<unknown>(data);
      logApiKeysInDev('GET /pagos', rawList);

      pagos.value = rawList
        .map(normalizeAdminPago)
        .filter((row): row is AdminTableRow => row !== null);
    } catch (err: unknown) {
      pagos.value = [];
      errorPagos.value = resolveLoadError(err, 'No se pudieron cargar los pagos.');
    } finally {
      loadingPagos.value = false;
    }
  }

  async function fetchFacturas(): Promise<void> {
    loadingFacturas.value = true;
    errorFacturas.value = null;

    try {
      const { data } = await adminApi.get<unknown>('/facturas', { params: { page: 1, limit: 200 } });
      const rawList = unwrapApiList<unknown>(data);
      logApiKeysInDev('GET /facturas', rawList);

      facturas.value = rawList
        .map(normalizeAdminFactura)
        .filter((row): row is AdminTableRow => row !== null);
    } catch (err: unknown) {
      facturas.value = [];
      errorFacturas.value = resolveLoadError(err, 'No se pudieron cargar las facturas.');
    } finally {
      loadingFacturas.value = false;
    }
  }

  return {
    pagos,
    facturas,
    loadingPagos,
    loadingFacturas,
    errorPagos,
    errorFacturas,
    fetchPagos,
    fetchFacturas,
  };
}
