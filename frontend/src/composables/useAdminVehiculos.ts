import { useAdminVehiculosLookup } from '@/composables/useAdminVehiculosLookup';

/** Listado admin de vehículos con catálogos e índice compartido. */
export function useAdminVehiculos() {
  return useAdminVehiculosLookup();
}
