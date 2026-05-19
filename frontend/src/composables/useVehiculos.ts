import { ref, type Ref } from 'vue';
import { apiClient } from '@/api/api';
import type {
  ApiResponse,
  Vehiculo,
  VehiculoCard,
  VehiculoStatus,
} from '@/types/vehiculo';

function parsePrecioDia(value: Vehiculo['precioDia']): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'string' ? Number.parseFloat(value) : value;
  return Number.isFinite(n) ? n : 0;
}

function buildModeloLabel(vehiculo: Vehiculo): string {
  const marca = vehiculo.modelo?.marca?.nombre?.trim() ?? '';
  const modelo = vehiculo.modelo?.nombre?.trim() ?? '';
  const anio = vehiculo.anio ? String(vehiculo.anio) : '';
  return [marca, modelo, anio].filter(Boolean).join(' ') || 'Modelo no especificado';
}

/** Mapea el DTO del backend a la tarjeta del marketplace. */
export function mapVehiculoToCard(vehiculo: Vehiculo): VehiculoCard {
  return {
    id: vehiculo.id,
    placa: vehiculo.placa ?? '—',
    modeloLabel: buildModeloLabel(vehiculo),
    precioDia: parsePrecioDia(vehiculo.precioDia),
    imagenUrl: vehiculo.imagenUrl ?? null,
    status: (vehiculo.status ?? 'DISPONIBLE') as VehiculoStatus,
  };
}

export interface UseVehiculosReturn {
  vehiculos: Ref<VehiculoCard[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  fetchMarketplace: () => Promise<void>;
}

export function useVehiculos(): UseVehiculosReturn {
  const vehiculos = ref<VehiculoCard[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchMarketplace(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const { data } = await apiClient.get<ApiResponse<Vehiculo[]>>('/vehiculos/marketplace');
      const list = Array.isArray(data.data) ? data.data : [];
      vehiculos.value = list.map(mapVehiculoToCard);
    } catch (err: unknown) {
      vehiculos.value = [];
      const message =
        err instanceof Error
          ? err.message
          : 'No se pudo cargar el catálogo de vehículos.';
      error.value = message;
    } finally {
      loading.value = false;
    }
  }

  return {
    vehiculos,
    loading,
    error,
    fetchMarketplace,
  };
}
