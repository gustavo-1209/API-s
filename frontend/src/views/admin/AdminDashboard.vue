<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import UiSpinner from '@/components/ui/UiSpinner.vue';
import { useAuthStore } from '@/stores/auth';
import { useAdminFinanciero } from '@/composables/useAdminFinanciero';
import { useAdminMantenimientos } from '@/composables/useAdminMantenimientos';
import { useAdminReservas } from '@/composables/useAdminReservas';
import { useAdminVehiculos } from '@/composables/useAdminVehiculos';

const authStore = useAuthStore();

const { vehiculos, disponiblesCount, loading: loadingVehiculos, error: errorVehiculos, fetchVehiculos } =
  useAdminVehiculos();
const { reservas, loading: loadingReservas, error: errorReservas, fetchReservas } = useAdminReservas();
const {
  pagos,
  loadingPagos,
  errorPagos,
  fetchPagos,
} = useAdminFinanciero();
const {
  mantenimientos,
  loadingMantenimientos,
  errorMantenimientos,
  fetchMantenimientos,
} = useAdminMantenimientos();

const initialLoading = ref(true);

const loading = computed(
  () =>
    initialLoading.value ||
    loadingVehiculos.value ||
    loadingReservas.value ||
    loadingPagos.value ||
    loadingMantenimientos.value,
);

const partialErrors = computed(() =>
  [errorVehiculos.value, errorReservas.value, errorPagos.value, errorMantenimientos.value].filter(
    Boolean,
  ),
);

const cards = computed(() => [
  {
    label: 'Total vehículos',
    value: vehiculos.value.length,
    hint: errorVehiculos.value ? 'Error al cargar' : undefined,
    tone: 'brand' as const,
  },
  {
    label: 'Vehículos disponibles',
    value: disponiblesCount.value,
    hint: errorVehiculos.value ? '—' : 'Según estado/disponible',
    tone: 'emerald' as const,
  },
  {
    label: 'Total reservas',
    value: reservas.value.length,
    hint: errorReservas.value ? 'Error al cargar' : undefined,
    tone: 'violet' as const,
  },
  {
    label: 'Pagos registrados',
    value: pagos.value.length,
    hint: errorPagos.value ? 'Error al cargar' : undefined,
    tone: 'amber' as const,
  },
  {
    label: 'Mantenimientos registrados',
    value: mantenimientos.value.length,
    hint: errorMantenimientos.value ? 'Error al cargar' : undefined,
    tone: 'slate' as const,
  },
]);

onMounted(async () => {
  initialLoading.value = true;
  await Promise.all([fetchVehiculos(), fetchReservas(), fetchPagos(), fetchMantenimientos()]);
  initialLoading.value = false;
});
</script>

<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 class="text-lg font-semibold text-slate-900">Bienvenido, administrador</h3>
      <p class="mt-2 text-slate-600">
        Sesión activa como
        <span class="font-medium text-slate-900">{{ authStore.user?.email ?? '—' }}</span>
      </p>
      <p class="mt-1 text-sm text-slate-500">Resumen en tiempo real del Admin Gateway (solo lectura).</p>
    </div>

    <UiSpinner v-if="loading" label="Cargando resumen del panel…" size="sm" />

    <div
      v-if="partialErrors.length"
      class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      role="alert"
    >
      Algunos indicadores no pudieron cargarse. El resto del panel sigue disponible.
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="card in cards"
        :key="card.label"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <p class="text-sm font-medium text-slate-500">{{ card.label }}</p>
        <p class="mt-2 text-3xl font-bold text-slate-900">
          {{ loading ? '…' : card.value }}
        </p>
        <p v-if="card.hint" class="mt-1 text-xs text-slate-400">{{ card.hint }}</p>
      </div>
    </div>
  </div>
</template>
