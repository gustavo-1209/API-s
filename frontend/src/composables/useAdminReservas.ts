import { ref, type Ref } from 'vue';
import { isAxiosError } from 'axios';
import { adminApi } from '@/api/api';
import { logApiKeysInDev } from '@/lib/admin-dev';
import { unwrapApiList } from '@/lib/api-unwrap';
import { useAdminVehiculosLookup } from '@/composables/useAdminVehiculosLookup';
import { normalizeAdminReserva } from '@/mappers/admin.mapper';
import type { AdminReservaRow } from '@/types/admin';

const LOAD_ERROR = 'No se pudieron cargar las reservas. Intenta de nuevo más tarde.';

export interface UseAdminReservasReturn {
  reservas: Ref<AdminReservaRow[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  fetchReservas: () => Promise<void>;
}

export function useAdminReservas(): UseAdminReservasReturn {
  const reservas = ref<AdminReservaRow[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const { vehiculosById, fetchVehiculos } = useAdminVehiculosLookup();

  async function fetchReservas(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await fetchVehiculos({ limit: 200 });

      const { data } = await adminApi.get<unknown>('/reservas', {
        params: { page: 1, limit: 200 },
      });
      const rawList = unwrapApiList<unknown>(data);
      logApiKeysInDev('GET /reservas', rawList);

      reservas.value = rawList
        .map((item) => normalizeAdminReserva(item, vehiculosById.value))
        .filter((row): row is AdminReservaRow => row !== null);
    } catch (err: unknown) {
      reservas.value = [];
      if (isAxiosError(err) && !err.response) {
        error.value = 'No se pudo conectar con el servidor de administración.';
      } else {
        error.value = LOAD_ERROR;
      }
    } finally {
      loading.value = false;
    }
  }

  return {
    reservas,
    loading,
    error,
    fetchReservas,
  };
}
