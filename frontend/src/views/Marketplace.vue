<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useVehiculos } from '@/composables/useVehiculos';
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

function reservar(vehiculo: VehiculoCard): void {
  router.push({ name: 'reserva', params: { vehiculoId: vehiculo.id } });
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Catálogo de vehículos</h1>
      <p class="mt-1 text-slate-600">Encuentra el auto ideal y reserva en minutos.</p>
    </div>

    <div
      v-if="loading"
      class="flex flex-col items-center justify-center gap-4 py-24"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        class="h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600"
      />
      <p class="text-slate-600">Cargando vehículos disponibles…</p>
    </div>

    <div
      v-else-if="error"
      class="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center"
      role="alert"
    >
      <p class="font-semibold text-red-800">Error al cargar el catálogo</p>
      <p class="mt-2 text-red-700">{{ error }}</p>
      <button
        type="button"
        class="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        @click="fetchMarketplace()"
      >
        Reintentar
      </button>
    </div>

    <div
      v-else-if="vehiculos.length === 0"
      class="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"
    >
      <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <svg
          class="h-8 w-8 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M8 17h8M6 11h12l-1-4H7l-1 4zm2-6h8a2 2 0 012 2v1H6V7a2 2 0 012-2z"
          />
        </svg>
      </div>
      <h2 class="text-lg font-semibold text-slate-900">No hay autos disponibles</h2>
      <p class="mt-2 mx-auto max-w-md text-slate-600">
        En este momento no tenemos vehículos en el catálogo. Vuelve a intentar más tarde.
      </p>
    </div>

    <div
      v-else
      class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <article
        v-for="vehiculo in vehiculos"
        :key="vehiculo.id"
        class="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-brand-200 hover:shadow-md"
      >
        <div class="relative aspect-[4/3] bg-slate-100">
          <img
            v-if="vehiculo.imagenUrl"
            :src="vehiculo.imagenUrl"
            :alt="vehiculo.modeloLabel"
            class="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center text-slate-400"
          >
            <svg class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1"
                d="M8 17h8M6 11h12l-1-4H7l-1 4zm2-6h8a2 2 0 012 2v1H6V7a2 2 0 012-2z"
              />
            </svg>
          </div>
          <span
            class="absolute right-3 top-3 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800"
          >
            Disponible
          </span>
        </div>

        <div class="flex flex-1 flex-col p-5">
          <h2 class="line-clamp-2 text-lg font-semibold text-slate-900">
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

          <button
            type="button"
            class="mt-auto w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            @click="reservar(vehiculo)"
          >
            Reservar
          </button>
        </div>
      </article>
    </div>
  </div>
</template>
