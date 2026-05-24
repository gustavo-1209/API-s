import { ref, type Ref } from 'vue';
import { isAxiosError } from 'axios';
import { adminApi } from '@/api/api';
import { logApiKeysInDev } from '@/lib/admin-dev';
import { unwrapApiList } from '@/lib/api-unwrap';
import { useAdminVehiculosLookup } from '@/composables/useAdminVehiculosLookup';
import { normalizeAdminKardex, normalizeAdminMantenimiento } from '@/mappers/admin.mapper';
import type { AdminTableRow } from '@/types/admin';

function resolveLoadError(err: unknown, fallback: string): string {
  if (isAxiosError(err) && !err.response) {
    return 'No se pudo conectar con el servidor de administración.';
  }
  return fallback;
}

export interface UseAdminMantenimientosReturn {
  mantenimientos: Ref<AdminTableRow[]>;
  kardex: Ref<AdminTableRow[]>;
  loadingMantenimientos: Ref<boolean>;
  loadingKardex: Ref<boolean>;
  errorMantenimientos: Ref<string | null>;
  errorKardex: Ref<string | null>;
  fetchMantenimientos: () => Promise<void>;
  fetchKardex: () => Promise<void>;
}

export function useAdminMantenimientos(): UseAdminMantenimientosReturn {
  const mantenimientos = ref<AdminTableRow[]>([]);
  const kardex = ref<AdminTableRow[]>([]);
  const loadingMantenimientos = ref(false);
  const loadingKardex = ref(false);
  const errorMantenimientos = ref<string | null>(null);
  const errorKardex = ref<string | null>(null);
  const { vehiculosById, fetchVehiculos } = useAdminVehiculosLookup();

  async function fetchMantenimientos(): Promise<void> {
    loadingMantenimientos.value = true;
    errorMantenimientos.value = null;

    try {
      await fetchVehiculos({ limit: 200 });

      const { data } = await adminApi.get<unknown>('/mantenimientos', {
        params: { page: 1, limit: 200 },
      });
      const rawList = unwrapApiList<unknown>(data);
      logApiKeysInDev('GET /mantenimientos', rawList);

      mantenimientos.value = rawList
        .map((item) => normalizeAdminMantenimiento(item, vehiculosById.value))
        .filter((row): row is AdminTableRow => row !== null);
    } catch (err: unknown) {
      mantenimientos.value = [];
      errorMantenimientos.value = resolveLoadError(
        err,
        'No se pudieron cargar los mantenimientos.',
      );
    } finally {
      loadingMantenimientos.value = false;
    }
  }

  async function fetchKardex(): Promise<void> {
    loadingKardex.value = true;
    errorKardex.value = null;

    try {
      await fetchVehiculos({ limit: 200 });

      const { data } = await adminApi.get<unknown>('/kardex', { params: { page: 1, limit: 200 } });
      const rawList = unwrapApiList<unknown>(data);
      logApiKeysInDev('GET /kardex', rawList);

      kardex.value = rawList
        .map((item) => normalizeAdminKardex(item, vehiculosById.value))
        .filter((row): row is AdminTableRow => row !== null);
    } catch (err: unknown) {
      kardex.value = [];
      errorKardex.value = resolveLoadError(err, 'No se pudo cargar el kardex.');
    } finally {
      loadingKardex.value = false;
    }
  }

  return {
    mantenimientos,
    kardex,
    loadingMantenimientos,
    loadingKardex,
    errorMantenimientos,
    errorKardex,
    fetchMantenimientos,
    fetchKardex,
  };
}
