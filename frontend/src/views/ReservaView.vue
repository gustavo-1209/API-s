<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { isAxiosError } from 'axios';
import { bookingApi } from '@/api/api';
import {
  calcularDiasReserva,
  calcularTotalReserva,
} from '@/mappers/reserva.mapper';
import { normalizeVehiculoMarketplace } from '@/mappers/vehiculo-marketplace.mapper';
import { crearReserva, mensajeErrorReserva, ReservaServiceError } from '@/composables/useReservas';
import { unwrapApiData, unwrapApiList } from '@/lib/api-unwrap';
import { resolveClienteId } from '@/lib/cliente-id';
import UiErrorAlert from '@/components/ui/UiErrorAlert.vue';
import UiSpinner from '@/components/ui/UiSpinner.vue';
import { formatDisplayDate, formatDisplayMoney } from '@/lib/format';
import { useAuthStore } from '@/stores/auth';
import type { CanalVenta, CrearReservaRequest, CrearReservaResponse, Seguro, Tarifa } from '@/types/reserva';
import type { VehiculoMarketplace } from '@/types/vehiculo';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const vehiculoId = computed(() => route.params.vehiculoId as string);

const fechaInicio = ref('');
const fechaFin = ref('');
const seguroId = ref('');
const tarifaId = ref('');
const canalVentaId = ref('');

const loading = ref(true);
const loadError = ref<string | null>(null);
const submitting = ref(false);
const submitError = ref<string | null>(null);

const vehiculo = ref<VehiculoMarketplace | null>(null);
const seguros = ref<Seguro[]>([]);
const tarifas = ref<Tarifa[]>([]);
const canalesVenta = ref<CanalVenta[]>([]);
const reservaCreada = ref<CrearReservaResponse | null>(null);

const clienteId = computed(() => resolveClienteId(authStore.user, authStore.token));

const dias = computed(() => {
  if (!fechaInicio.value || !fechaFin.value) return 0;
  return calcularDiasReserva(fechaInicio.value, fechaFin.value);
});

const totalEstimado = computed(() => {
  const precio = vehiculo.value?.precioPorDia ?? 0;
  return calcularTotalReserva(precio, dias.value);
});

const simboloMoneda = computed(() => {
  const m = vehiculo.value?.moneda?.toUpperCase();
  if (m === 'USD') return '$';
  if (m) return `${m} `;
  return '$';
});

const minFin = computed(() => {
  if (!fechaInicio.value) return undefined;
  const d = new Date(fechaInicio.value);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
});

const hoy = new Date().toISOString().slice(0, 10);

const reservaCodigo = computed(
  () => reservaCreada.value?.codigoReserva ?? reservaCreada.value?.id ?? '',
);

const reservaFechaInicio = computed(() =>
  formatDisplayDate(reservaCreada.value?.fechaInicio ?? fechaInicio.value),
);

const reservaFechaFin = computed(() =>
  formatDisplayDate(reservaCreada.value?.fechaFin ?? fechaFin.value),
);

const reservaTotal = computed(() => {
  const fromApi = reservaCreada.value?.totalAmount;
  if (fromApi !== undefined && fromApi !== null && fromApi !== '') {
    return formatDisplayMoney(fromApi);
  }
  if (dias.value > 0) return formatDisplayMoney(totalEstimado.value);
  return '—';
});

const formValido = computed(
  () =>
    Boolean(clienteId.value) &&
    Boolean(seguroId.value) &&
    Boolean(tarifaId.value) &&
    Boolean(canalVentaId.value) &&
    Boolean(fechaInicio.value) &&
    Boolean(fechaFin.value) &&
    dias.value > 0 &&
    Boolean(vehiculo.value) &&
    (vehiculo.value?.precioPorDia ?? 0) > 0,
);

function mapSeguro(raw: unknown): Seguro | null {
  const r = raw as Record<string, unknown>;
  const id = String(r.id ?? '');
  if (!id) return null;
  return {
    id,
    nombre: typeof r.nombre === 'string' ? r.nombre : undefined,
    descripcion: typeof r.descripcion === 'string' ? r.descripcion : null,
    precio: r.precio as number | string | null | undefined,
  };
}

function mapTarifa(raw: unknown): Tarifa | null {
  const r = raw as Record<string, unknown>;
  const id = String(r.id ?? '');
  if (!id) return null;
  return {
    id,
    nombre: typeof r.nombre === 'string' ? r.nombre : undefined,
    descripcion: typeof r.descripcion === 'string' ? r.descripcion : null,
    monto: r.monto as number | string | null | undefined,
  };
}

function mapCanalVenta(raw: unknown): CanalVenta | null {
  const r = raw as Record<string, unknown>;
  const id = String(r.id ?? '');
  if (!id) return null;
  return {
    id,
    nombre: typeof r.nombre === 'string' ? r.nombre : undefined,
    codigo: typeof r.codigo === 'string' ? r.codigo : null,
  };
}

function selectFirstDefaults(): void {
  if (seguros.value.length && !seguroId.value) {
    seguroId.value = seguros.value[0].id;
  }
  if (tarifas.value.length && !tarifaId.value) {
    tarifaId.value = tarifas.value[0].id;
  }
  if (canalesVenta.value.length && !canalVentaId.value) {
    canalVentaId.value = canalesVenta.value[0].id;
  }
}

function catalogLabel(nombre: string | undefined, id: string): string {
  return nombre?.trim() || id;
}

async function cargarDatos(): Promise<void> {
  loading.value = true;
  loadError.value = null;

  try {
    const [vehiculoRes, segurosRes, tarifasRes, canalesRes] = await Promise.all([
      bookingApi.get<unknown>(`/vehiculos/${vehiculoId.value}`),
      bookingApi.get<unknown>('/seguros'),
      bookingApi.get<unknown>('/tarifas'),
      bookingApi.get<unknown>('/canales-venta'),
    ]);

    vehiculo.value = normalizeVehiculoMarketplace(unwrapApiData(vehiculoRes.data));
    seguros.value = unwrapApiList<unknown>(segurosRes.data)
      .map(mapSeguro)
      .filter((s): s is Seguro => s !== null);
    tarifas.value = unwrapApiList<unknown>(tarifasRes.data)
      .map(mapTarifa)
      .filter((t): t is Tarifa => t !== null);
    canalesVenta.value = unwrapApiList<unknown>(canalesRes.data)
      .map(mapCanalVenta)
      .filter((c): c is CanalVenta => c !== null);

    selectFirstDefaults();

    if (!vehiculo.value.precioPorDia) {
      loadError.value = 'El vehículo no tiene precio por día configurado.';
    }
  } catch (err: unknown) {
    vehiculo.value = null;
    if (isAxiosError(err) && !err.response) {
      loadError.value = 'No se pudo conectar con el servidor de reservas.';
    } else {
      loadError.value = 'No se pudo cargar la información del vehículo.';
    }
  } finally {
    loading.value = false;
  }
}

async function confirmarReserva(): Promise<void> {
  submitError.value = null;

  if (!clienteId.value) {
    submitError.value = 'No se pudo identificar el cliente autenticado.';
    return;
  }

  if (!formValido.value) {
    submitError.value = 'Completa fechas y catálogos antes de confirmar.';
    return;
  }

  const body: CrearReservaRequest = {
    vehiculoId: vehiculoId.value,
    clienteId: clienteId.value,
    seguroId: seguroId.value,
    tarifaId: tarifaId.value,
    canalVentaId: canalVentaId.value,
    fechaInicio: fechaInicio.value,
    fechaFin: fechaFin.value,
  };

  submitting.value = true;

  try {
    reservaCreada.value = await crearReserva(body);
  } catch (err: unknown) {
    const serviceErr =
      err instanceof ReservaServiceError ? err : new ReservaServiceError('Error al reservar.');
    submitError.value = mensajeErrorReserva(serviceErr);
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
  void cargarDatos();
});
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-8">
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 class="text-xl font-bold text-slate-900">Confirmar reserva</h1>

      <div v-if="loading" class="mt-4">
        <UiSpinner label="Cargando información de la reserva…" />
      </div>

      <div v-else-if="loadError" class="mt-4">
      <UiErrorAlert
        title="No se pudo cargar la reserva"
        :message="loadError"
        :show-retry="true"
        @retry="cargarDatos()"
      />
      </div>

      <template v-else-if="vehiculo">
        <div v-if="vehiculo.imagenUrl" class="mt-4 overflow-hidden rounded-xl">
          <img
            :src="vehiculo.imagenUrl"
            :alt="vehiculo.nombre"
            class="h-40 w-full object-cover"
          />
        </div>

        <p class="mt-4 text-sm text-slate-600">
          Vehículo:
          <span class="font-medium text-slate-900">{{ vehiculo.nombre }}</span>
          <span v-if="vehiculo.placa" class="font-mono text-brand-700"> ({{ vehiculo.placa }})</span>
        </p>
        <p class="mt-1 text-sm text-slate-500">
          Precio:
          <span class="font-semibold text-brand-700">
            {{ simboloMoneda }}{{ vehiculo.precioPorDia.toFixed(2) }}
          </span>
          / día
          <span v-if="vehiculo.moneda" class="text-slate-400"> ({{ vehiculo.moneda }})</span>
        </p>
        <p v-if="vehiculo.descripcion" class="mt-2 text-sm text-slate-500">{{ vehiculo.descripcion }}</p>

        <p
          v-if="!clienteId"
          class="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          No se pudo identificar el cliente autenticado.
        </p>

        <div
          v-if="reservaCreada"
          class="mt-6 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 shadow-sm"
          role="status"
        >
          <div class="border-b border-emerald-200/80 bg-emerald-100/60 px-5 py-4">
            <p class="text-lg font-semibold text-emerald-900">¡Reserva confirmada!</p>
            <p class="mt-1 text-sm text-emerald-800">
              Tu solicitud fue registrada correctamente en RentWheels.
            </p>
          </div>
          <dl class="space-y-3 px-5 py-4 text-sm text-emerald-950">
            <div class="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
              <dt class="text-emerald-800">Código / ID</dt>
              <dd class="font-mono font-semibold">{{ reservaCodigo }}</dd>
            </div>
            <div class="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
              <dt class="text-emerald-800">Vehículo</dt>
              <dd class="font-medium text-right">
                {{ vehiculo.nombre }}
                <span v-if="vehiculo.placa" class="font-mono text-emerald-900"> ({{ vehiculo.placa }})</span>
              </dd>
            </div>
            <div class="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
              <dt class="text-emerald-800">Fechas</dt>
              <dd class="font-medium">{{ reservaFechaInicio }} → {{ reservaFechaFin }}</dd>
            </div>
            <div class="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
              <dt class="text-emerald-800">Total</dt>
              <dd class="text-lg font-bold">{{ reservaTotal }}</dd>
            </div>
            <div
              v-if="reservaCreada.status"
              class="flex flex-col gap-0.5 sm:flex-row sm:justify-between"
            >
              <dt class="text-emerald-800">Estado</dt>
              <dd>
                <span
                  class="inline-flex rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-emerald-800"
                >
                  {{ reservaCreada.status }}
                </span>
              </dd>
            </div>
          </dl>
          <div class="border-t border-emerald-200/80 px-5 py-4">
            <button
              type="button"
              class="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700"
              @click="router.push({ name: 'marketplace' })"
            >
              Volver al catálogo
            </button>
          </div>
        </div>

        <form v-else class="mt-6 space-y-4" @submit.prevent="confirmarReserva">
          <div>
            <label for="seguro" class="block text-sm font-medium text-slate-700">Seguro</label>
            <select
              id="seguro"
              v-model="seguroId"
              required
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option v-if="!seguros.length" disabled value="">Sin seguros disponibles</option>
              <option v-for="s in seguros" :key="s.id" :value="s.id">
                {{ catalogLabel(s.nombre, s.id) }}
              </option>
            </select>
          </div>

          <div>
            <label for="tarifa" class="block text-sm font-medium text-slate-700">Tarifa</label>
            <select
              id="tarifa"
              v-model="tarifaId"
              required
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option v-if="!tarifas.length" disabled value="">Sin tarifas disponibles</option>
              <option v-for="t in tarifas" :key="t.id" :value="t.id">
                {{ catalogLabel(t.nombre, t.id) }}
              </option>
            </select>
          </div>

          <div>
            <label for="canal" class="block text-sm font-medium text-slate-700">Canal de venta</label>
            <select
              id="canal"
              v-model="canalVentaId"
              required
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option v-if="!canalesVenta.length" disabled value="">Sin canales disponibles</option>
              <option v-for="c in canalesVenta" :key="c.id" :value="c.id">
                {{ catalogLabel(c.nombre, c.id) }}
              </option>
            </select>
          </div>

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
            <label for="fecha-fin" class="block text-sm font-medium text-slate-700">Fecha de fin</label>
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
            <p>
              {{ dias }} día(s) · Total estimado:
              <strong>{{ simboloMoneda }}{{ totalEstimado.toFixed(2) }}</strong>
            </p>
          </div>

          <p v-if="submitError" class="text-sm text-red-600" role="alert">{{ submitError }}</p>

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
        v-if="!reservaCreada"
        type="button"
        class="mt-6 text-sm font-medium text-brand-600 hover:text-brand-700"
        @click="router.push({ name: 'marketplace' })"
      >
        ← Volver al catálogo
      </button>
    </div>
  </div>
</template>
