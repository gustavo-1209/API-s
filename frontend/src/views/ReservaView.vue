<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/api/api';
import {
  calcularDiasReserva,
  calcularTotalReserva,
} from '@/mappers/reserva.mapper';
import {
  crearReserva,
  mensajeErrorReserva,
  ReservaServiceError,
} from '@/composables/useReservas';
import { decodeJwtPayload } from '@/lib/jwt';
import { useAuthStore } from '@/stores/auth';
import type { ApiResponse, Vehiculo } from '@/types/vehiculo';
import type { ReservaFormModel } from '@/types/reserva';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const vehiculoId = computed(() => route.params.vehiculoId as string);

const fechaInicio = ref('');
const fechaFin = ref('');
const loadingVehiculo = ref(true);
const submitting = ref(false);
const vehiculo = ref<Vehiculo | null>(null);
const precioDia = ref(0);

type AlertType = 'success' | 'error' | 'info';
const alert = ref<{ type: AlertType; message: string } | null>(null);

const clienteId = computed(() => {
  if (authStore.user?.id) return authStore.user.id;
  const token = authStore.token;
  if (!token) return '';
  return decodeJwtPayload(token)?.id ?? '';
});

const agenciaId = computed(() => vehiculo.value?.agenciaId ?? '');

const dias = computed(() => {
  if (!fechaInicio.value || !fechaFin.value) return 0;
  return calcularDiasReserva(fechaInicio.value, fechaFin.value);
});

const totalEstimado = computed(() => calcularTotalReserva(precioDia.value, dias.value));

const minFin = computed(() => {
  if (!fechaInicio.value) return undefined;
  const d = new Date(fechaInicio.value);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
});

const hoy = new Date().toISOString().slice(0, 10);

const formValido = computed(
  () =>
    Boolean(clienteId.value) &&
    Boolean(agenciaId.value) &&
    Boolean(fechaInicio.value) &&
    Boolean(fechaFin.value) &&
    dias.value > 0 &&
    totalEstimado.value > 0,
);

function parsePrecioDia(value: Vehiculo['precioDia']): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'string' ? Number.parseFloat(value) : value;
  return Number.isFinite(n) ? n : 0;
}

async function cargarVehiculo(): Promise<void> {
  loadingVehiculo.value = true;
  alert.value = null;
  try {
    const { data } = await api.get<ApiResponse<Vehiculo>>(`/vehiculos/${vehiculoId.value}`);
    vehiculo.value = data.data;
    precioDia.value = parsePrecioDia(data.data.precioDia);
    if (!data.data.agenciaId) {
      alert.value = {
        type: 'error',
        message: 'Este vehículo no tiene agencia asignada. No se puede reservar.',
      };
    }
  } catch {
    alert.value = {
      type: 'error',
      message: 'No se pudo cargar la información del vehículo.',
    };
  } finally {
    loadingVehiculo.value = false;
  }
}

async function confirmarReserva(): Promise<void> {
  alert.value = null;

  if (!formValido.value) {
    alert.value = {
      type: 'error',
      message: 'Completa las fechas correctamente antes de confirmar.',
    };
    return;
  }

  const form: ReservaFormModel = {
    clienteId: clienteId.value,
    vehiculoId: vehiculoId.value,
    agenciaId: agenciaId.value,
    fechaInicio: fechaInicio.value,
    fechaFin: fechaFin.value,
    total: totalEstimado.value,
  };

  submitting.value = true;

  try {
    const reserva = await crearReserva(form);
    alert.value = {
      type: 'success',
      message: `Reserva confirmada. Código: ${reserva.codigoReserva ?? reserva.id}`,
    };
    fechaInicio.value = '';
    fechaFin.value = '';
  } catch (err: unknown) {
    const serviceErr =
      err instanceof ReservaServiceError ? err : new ReservaServiceError('Error al reservar.');
    alert.value = {
      type: 'error',
      message: mensajeErrorReserva(serviceErr),
    };
  } finally {
    submitting.value = false;
  }
}

watch(fechaInicio, () => {
  if (fechaFin.value && fechaFin.value <= fechaInicio.value) {
    fechaFin.value = '';
  }
});

onMounted(() => {
  void cargarVehiculo();
});
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-8">
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 class="text-xl font-bold text-slate-900">Confirmar reserva</h1>

      <div v-if="loadingVehiculo" class="mt-6 text-sm text-slate-500">Cargando vehículo…</div>

      <template v-else-if="vehiculo">
        <p class="mt-2 text-sm text-slate-600">
          Vehículo:
          <span class="font-medium text-slate-900">
            {{ vehiculo.modelo?.marca?.nombre }} {{ vehiculo.modelo?.nombre }}
          </span>
          <span class="font-mono text-brand-700">({{ vehiculo.placa }})</span>
        </p>
        <p class="mt-1 text-sm text-slate-500">
          Precio:
          <span class="font-semibold text-brand-700">${{ precioDia.toFixed(2) }}</span>
          / día
        </p>

        <form class="mt-6 space-y-4" @submit.prevent="confirmarReserva">
          <div>
            <label for="fecha-inicio" class="block text-sm font-medium text-slate-700">
              Fecha de inicio
            </label>
            <input
              id="fecha-inicio"
              v-model="fechaInicio"
              type="date"
              required
              :min="hoy"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label for="fecha-fin" class="block text-sm font-medium text-slate-700">
              Fecha de fin
            </label>
            <input
              id="fecha-fin"
              v-model="fechaFin"
              type="date"
              required
              :min="minFin ?? hoy"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div
            v-if="dias > 0"
            class="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700"
          >
            <p>{{ dias }} día(s) · Total estimado: <strong>${{ totalEstimado.toFixed(2) }}</strong></p>
          </div>

          <div
            v-if="alert"
            :class="[
              'rounded-lg px-4 py-3 text-sm',
              alert.type === 'success' && 'border border-emerald-200 bg-emerald-50 text-emerald-800',
              alert.type === 'error' && 'border border-red-200 bg-red-50 text-red-800',
              alert.type === 'info' && 'border border-blue-200 bg-blue-50 text-blue-800',
            ]"
            role="alert"
          >
            {{ alert.message }}
          </div>

          <button
            type="submit"
            :disabled="submitting || !formValido"
            class="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ submitting ? 'Procesando…' : 'Confirmar reserva' }}
          </button>
        </form>
      </template>

      <button
        type="button"
        class="mt-6 text-sm font-medium text-brand-600 hover:text-brand-700"
        @click="router.push({ name: 'marketplace' })"
      >
        ← Volver al catálogo
      </button>
    </div>
  </div>
</template>
