<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import UiEmptyState from '@/components/ui/UiEmptyState.vue';
import UiErrorAlert from '@/components/ui/UiErrorAlert.vue';
import UiSpinner from '@/components/ui/UiSpinner.vue';
import { useVehiculos } from '@/composables/useVehiculos';
import {
  isVehiculoReservableEnMarketplace,
  vehicleMarketplaceBadgeClass,
  vehicleMarketplaceButtonLabel,
  vehicleMarketplaceLabel,
  vehicleMarketplaceMotivoHint,
} from '@/lib/vehicle-status';
import type { VehiculoCard } from '@/types/vehiculo';

const router = useRouter();
const { vehiculos, loading, error, fetchMarketplace } = useVehiculos();

onMounted(() => {
  void fetchMarketplace();
});

function formatPrecio(precio: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(precio);
}

function puedeConsultarReserva(vehiculo: VehiculoCard): boolean {
  return isVehiculoReservableEnMarketplace(vehiculo);
}

function motivoHint(vehiculo: VehiculoCard): string | null {
  return vehicleMarketplaceMotivoHint(vehiculo);
}

function irAReserva(vehiculo: VehiculoCard): void {
  if (!puedeConsultarReserva(vehiculo)) return;
  router.push({ name: 'reserva', params: { vehiculoId: vehiculo.id } });
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Catálogo de vehículos</h1>
      <p class="mt-1 text-slate-600">
        Consulta disponibilidad y reserva. Un vehículo puede figurar en inventario aunque tenga una
        reserva en curso.
      </p>
    </div>

    <UiSpinner v-if="loading" label="Cargando vehículos…" />

    <UiErrorAlert
      v-else-if="error"
      title="Error al cargar el catálogo"
      :message="error"
      @retry="fetchMarketplace()"
    />

    <UiEmptyState
      v-else-if="vehiculos.length === 0"
      title="No hay autos en el catálogo"
      message="En este momento no tenemos vehículos listados. Vuelve a intentar más tarde."
    />

    <div v-else class="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <article
        v-for="vehiculo in vehiculos"
        :key="vehiculo.id"
        class="group flex min-h-[22rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-brand-200 hover:shadow-md"
        :class="!puedeConsultarReserva(vehiculo) && 'opacity-90'"
      >
        <div class="relative aspect-[4/3] shrink-0 overflow-hidden bg-slate-100">
          <img
            v-if="vehiculo.imagenUrl"
            :src="vehiculo.imagenUrl"
            :alt="vehiculo.modeloLabel"
            class="h-full w-full object-cover object-center transition group-hover:scale-[1.02]"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center text-slate-400"
          >
            <svg class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1"
                d="M8 17h8M6 11h12l-1-4H7l-1 4zm2-6h8a2 2 0 012 2v1H6V7a2 2 0 012-2z"
              />
            </svg>
          </div>
          <span
            class="absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold"
            :class="vehicleMarketplaceBadgeClass(vehiculo)"
            :title="motivoHint(vehiculo) ?? (vehiculo.status ? `Estado inventario: ${vehiculo.status}` : undefined)"
          >
            {{ vehicleMarketplaceLabel(vehiculo) }}
          </span>
        </div>

        <div class="flex flex-1 flex-col p-5">
          <h2 class="line-clamp-2 min-h-[3.25rem] text-lg font-semibold text-slate-900">
            {{ vehiculo.modeloLabel }}
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            Placa:
            <span class="font-mono font-medium text-slate-700">{{ vehiculo.placa }}</span>
          </p>

          <p class="mt-4 text-2xl font-bold text-brand-700">
            {{ formatPrecio(vehiculo.precioDia) }}
            <span class="text-sm font-normal text-slate-500">/ día</span>
          </p>

          <p
            v-if="motivoHint(vehiculo) && !puedeConsultarReserva(vehiculo)"
            class="mt-3 text-xs text-amber-800"
            :title="motivoHint(vehiculo) ?? undefined"
          >
            {{ motivoHint(vehiculo) }}
          </p>

          <button
            type="button"
            class="mt-auto w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            :class="
              puedeConsultarReserva(vehiculo)
                ? 'bg-brand-600 text-white hover:bg-brand-700'
                : 'cursor-not-allowed bg-slate-200 text-slate-500'
            "
            :disabled="!puedeConsultarReserva(vehiculo)"
            :title="motivoHint(vehiculo) ?? undefined"
            @click="irAReserva(vehiculo)"
          >
            {{ vehicleMarketplaceButtonLabel(vehiculo) }}
          </button>
        </div>
      </article>
    </div>
  </div>
</template>
