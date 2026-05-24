import { ref, type Ref } from 'vue';
import { isAxiosError } from 'axios';
import { adminApi } from '@/api/api';
import { logApiKeysInDev } from '@/lib/admin-dev';
import { unwrapApiList } from '@/lib/api-unwrap';
import { fetchAdminCatalogs } from '@/composables/useAdminCatalogos';
import {
  buildVehiculosIndex,
  formatVehiculoDisplayLabel,
  isAdminVehiculoDisponible,
  normalizeAdminVehiculo,
} from '@/mappers/admin.mapper';
import type { AdminCatalogMaps, AdminVehiculoRow } from '@/types/admin';
import { EMPTY_CATALOG_MAPS } from '@/types/admin';

const LOAD_ERROR = 'No se pudieron cargar los vehículos. Intenta de nuevo más tarde.';

const sharedVehiculos = ref<AdminVehiculoRow[]>([]);
const sharedIndex = ref<Map<string, AdminVehiculoRow>>(new Map());
const sharedCatalogs = ref<AdminCatalogMaps>(EMPTY_CATALOG_MAPS);
const sharedLoading = ref(false);
const sharedError = ref<string | null>(null);
const sharedDisponibles = ref(0);
let inflight: Promise<void> | null = null;

export interface UseAdminVehiculosLookupReturn {
  vehiculos: Ref<AdminVehiculoRow[]>;
  vehiculosById: Ref<Map<string, AdminVehiculoRow>>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  disponiblesCount: Ref<number>;
  fetchVehiculos: (options?: { limit?: number }) => Promise<void>;
  getVehiculoLabel: (vehiculoId: string | null | undefined) => string;
}

export function useAdminVehiculosLookup(): UseAdminVehiculosLookupReturn {
  async function fetchVehiculos(options?: { limit?: number }): Promise<void> {
    if (inflight) {
      await inflight;
      return;
    }

    sharedLoading.value = true;
    sharedError.value = null;

    inflight = (async () => {
      try {
        const limit = options?.limit ?? 200;
        const [catalogs, vehiculosRes] = await Promise.all([
          fetchAdminCatalogs(),
          adminApi.get<unknown>('/vehiculos', { params: { page: 1, limit } }),
        ]);

        sharedCatalogs.value = catalogs;
        const rawList = unwrapApiList<unknown>(vehiculosRes.data);
        logApiKeysInDev('GET /vehiculos', rawList);

        const normalized: AdminVehiculoRow[] = [];
        let disponibles = 0;

        for (const raw of rawList) {
          const row = normalizeAdminVehiculo(raw, catalogs);
          if (!row) continue;
          normalized.push(row);
          if (isAdminVehiculoDisponible(row, raw)) disponibles += 1;
        }

        sharedVehiculos.value = normalized;
        sharedIndex.value = buildVehiculosIndex(normalized);
        sharedDisponibles.value = disponibles;
      } catch (err: unknown) {
        sharedVehiculos.value = [];
        sharedIndex.value = new Map();
        sharedDisponibles.value = 0;
        if (isAxiosError(err) && !err.response) {
          sharedError.value = 'No se pudo conectar con el servidor de administración.';
        } else {
          sharedError.value = LOAD_ERROR;
        }
      } finally {
        sharedLoading.value = false;
        inflight = null;
      }
    })();

    await inflight;
  }

  function getVehiculoLabel(vehiculoId: string | null | undefined): string {
    if (!vehiculoId) return '—';
    const row = sharedIndex.value.get(vehiculoId);
    if (row) return row.displayLabel;
    return formatVehiculoDisplayLabel(null, vehiculoId);
  }

  return {
    vehiculos: sharedVehiculos,
    vehiculosById: sharedIndex,
    loading: sharedLoading,
    error: sharedError,
    disponiblesCount: sharedDisponibles,
    fetchVehiculos,
    getVehiculoLabel,
  };
}
