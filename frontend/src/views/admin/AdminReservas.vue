<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AdminListCard from '@/components/admin/AdminListCard.vue';
import { useAdminReservas } from '@/composables/useAdminReservas';
import { useAdminVehiculos } from '@/composables/useAdminVehiculos';
import {
  AlquilerServiceError,
  iniciarAlquiler,
  mensajeErrorIniciarAlquiler,
  mensajeErrorRegistrarDevolucion,
  registrarDevolucion,
} from '@/composables/useAlquileres';
import { guardarAlquilerEnCache } from '@/lib/alquiler-reserva-cache';
import type { AdminReservaRow, EstadoVehiculoDevolucion } from '@/types/admin';

const ESTADOS_VEHICULO: EstadoVehiculoDevolucion[] = ['BUENO', 'REGULAR', 'MALO'];

const { reservas, loading, error, fetchReservas } = useAdminReservas();
const { fetchVehiculos } = useAdminVehiculos();

const modalIniciar = ref<AdminReservaRow | null>(null);
const modalDevolucion = ref<AdminReservaRow | null>(null);

const kmSalida = ref('');
const observacionesAlquiler = ref('');
const submittingAlquiler = ref(false);
const alquilerError = ref<string | null>(null);
const alquilerSuccess = ref<string | null>(null);

const kmEntrada = ref('');
const estadoVehiculo = ref<EstadoVehiculoDevolucion>('BUENO');
const cargoExtra = ref('');
const observacionesDevolucion = ref('');
const submittingDevolucion = ref(false);
const devolucionError = ref<string | null>(null);
const devolucionSuccess = ref<string | null>(null);

const kmSalidaValido = computed(() => {
  const n = Number.parseInt(kmSalida.value, 10);
  return Number.isFinite(n) && n >= 0;
});

const kmEntradaValido = computed(() => {
  const n = Number.parseInt(kmEntrada.value, 10);
  if (!Number.isFinite(n) || n < 0) return false;
  const salida = modalDevolucion.value?.kmSalida;
  if (salida !== undefined && n < salida) return false;
  return true;
});

const cargoExtraValido = computed(() => {
  if (!cargoExtra.value.trim()) return true;
  const n = Number.parseFloat(cargoExtra.value);
  return Number.isFinite(n) && n >= 0;
});

function normalizarEstado(estado: string): string {
  return estado.trim().toUpperCase();
}

function puedeIniciarAlquiler(row: AdminReservaRow): boolean {
  return normalizarEstado(row.estado) === 'CONFIRMADA';
}

function puedeRegistrarDevolucion(row: AdminReservaRow): boolean {
  return normalizarEstado(row.estado) === 'ACTIVA' && Boolean(row.alquilerId);
}

function etiquetaAccion(row: AdminReservaRow): string {
  const estado = normalizarEstado(row.estado);
  if (estado === 'CONFIRMADA') return '';
  if (estado === 'ACTIVA') {
    return row.alquilerId ? '' : 'Alquiler en curso';
  }
  if (estado === 'COMPLETADA') return 'Finalizada';
  if (estado === 'CANCELADA') return 'Cancelada';
  if (estado === 'PENDIENTE') return 'Pendiente de confirmación';
  return 'No disponible';
}

function abrirModalIniciarAlquiler(row: AdminReservaRow): void {
  modalIniciar.value = row;
  kmSalida.value = '';
  observacionesAlquiler.value = '';
  alquilerError.value = null;
}

function cerrarModalIniciar(): void {
  if (submittingAlquiler.value) return;
  modalIniciar.value = null;
  alquilerError.value = null;
}

function abrirModalDevolucion(row: AdminReservaRow): void {
  if (!row.alquilerId) return;
  modalDevolucion.value = row;
  kmEntrada.value = '';
  estadoVehiculo.value = 'BUENO';
  cargoExtra.value = '';
  observacionesDevolucion.value = '';
  devolucionError.value = null;
}

function cerrarModalDevolucion(): void {
  if (submittingDevolucion.value) return;
  modalDevolucion.value = null;
  devolucionError.value = null;
}

async function onConfirmarIniciarAlquiler(): Promise<void> {
  if (!modalIniciar.value || !kmSalidaValido.value) {
    alquilerError.value = 'Ingresa un kilometraje de salida válido (número ≥ 0).';
    return;
  }

  submittingAlquiler.value = true;
  alquilerError.value = null;

  try {
    const km = Number.parseInt(kmSalida.value, 10);
    const creado = await iniciarAlquiler({
      reservaId: modalIniciar.value.id,
      kmSalida: km,
      fechaInicio: new Date().toISOString(),
      observaciones: observacionesAlquiler.value.trim() || undefined,
    });

    guardarAlquilerEnCache(modalIniciar.value.id, creado.id, creado.kmSalida ?? km);

    alquilerSuccess.value =
      'Alquiler iniciado correctamente. La reserva pasará a ACTIVA y el vehículo a EN_USO en inventario.';
    modalIniciar.value = null;

    await Promise.all([fetchReservas(), fetchVehiculos({ limit: 200 })]);
  } catch (err: unknown) {
    const serviceErr =
      err instanceof AlquilerServiceError
        ? err
        : new AlquilerServiceError('No se pudo iniciar el alquiler.');
    alquilerError.value = mensajeErrorIniciarAlquiler(serviceErr);
  } finally {
    submittingAlquiler.value = false;
  }
}

async function onConfirmarRegistrarDevolucion(): Promise<void> {
  const row = modalDevolucion.value;
  if (!row?.alquilerId || !kmEntradaValido.value || !cargoExtraValido.value) {
    devolucionError.value = 'Completa los datos de devolución correctamente.';
    if (row?.kmSalida !== undefined && Number.parseInt(kmEntrada.value, 10) < row.kmSalida) {
      devolucionError.value = `El kilometraje de entrada debe ser mayor o igual a ${row.kmSalida} km (salida).`;
    }
    return;
  }

  submittingDevolucion.value = true;
  devolucionError.value = null;

  try {
    const cargo = cargoExtra.value.trim() ? Number.parseFloat(cargoExtra.value) : 0;

    await registrarDevolucion({
      alquilerId: row.alquilerId,
      kmEntrada: Number.parseInt(kmEntrada.value, 10),
      estadoVehiculo: estadoVehiculo.value,
      cargoExtra: Number.isFinite(cargo) ? cargo : 0,
      observaciones: observacionesDevolucion.value.trim() || undefined,
    });

    devolucionSuccess.value =
      'Devolución registrada correctamente. La reserva quedará COMPLETADA y el vehículo DISPONIBLE en inventario.';
    modalDevolucion.value = null;

    await Promise.all([fetchReservas(), fetchVehiculos({ limit: 200 })]);
  } catch (err: unknown) {
    const serviceErr =
      err instanceof AlquilerServiceError
        ? err
        : new AlquilerServiceError('No se pudo registrar la devolución.');
    devolucionError.value = mensajeErrorRegistrarDevolucion(serviceErr);
  } finally {
    submittingDevolucion.value = false;
  }
}

onMounted(() => {
  void fetchReservas();
});
</script>

<template>
  <AdminListCard
    title="Reservas"
    description="Gestión de reservas: iniciar alquiler (CONFIRMADA) y registrar devolución (ACTIVA)."
    :loading="loading"
    :error="error"
    :empty="!loading && !error && reservas.length === 0"
    empty-message="No hay reservas registradas."
    @retry="fetchReservas()"
  >
    <p
      v-if="alquilerSuccess"
      class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
      role="status"
    >
      {{ alquilerSuccess }}
      <button
        type="button"
        class="ml-2 text-xs font-medium text-emerald-800 underline hover:text-emerald-950"
        @click="alquilerSuccess = null"
      >
        Cerrar
      </button>
    </p>

    <p
      v-if="devolucionSuccess"
      class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
      role="status"
    >
      {{ devolucionSuccess }}
      <button
        type="button"
        class="ml-2 text-xs font-medium text-emerald-800 underline hover:text-emerald-950"
        @click="devolucionSuccess = null"
      >
        Cerrar
      </button>
    </p>

    <div class="min-w-[920px] overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50">
          <tr>
            <th class="px-3 py-2 text-left font-medium text-slate-600">Código / ID</th>
            <th class="px-3 py-2 text-left font-medium text-slate-600">Vehículo</th>
            <th class="px-3 py-2 text-left font-medium text-slate-600">Cliente</th>
            <th class="px-3 py-2 text-left font-medium text-slate-600">Inicio</th>
            <th class="px-3 py-2 text-left font-medium text-slate-600">Fin</th>
            <th class="px-3 py-2 text-right font-medium text-slate-600">Total</th>
            <th class="px-3 py-2 text-left font-medium text-slate-600">Estado</th>
            <th class="px-3 py-2 text-left font-medium text-slate-600">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="row in reservas" :key="row.id" class="hover:bg-slate-50">
            <td class="max-w-[120px] truncate px-3 py-3 font-mono text-xs text-slate-800" :title="row.codigo">
              {{ row.codigo }}
            </td>
            <td class="max-w-[200px] truncate px-3 py-3 text-slate-800" :title="row.vehiculo">
              {{ row.vehiculo }}
            </td>
            <td class="max-w-[160px] truncate px-3 py-3 text-slate-700" :title="row.cliente">
              {{ row.cliente }}
            </td>
            <td class="px-3 py-3 text-slate-700">{{ row.fechaInicio }}</td>
            <td class="px-3 py-3 text-slate-700">{{ row.fechaFin }}</td>
            <td class="px-3 py-3 text-right font-medium text-slate-900">${{ row.total }}</td>
            <td class="px-3 py-3">
              <span
                class="inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-800"
              >
                {{ row.estado }}
              </span>
            </td>
            <td class="px-3 py-3">
              <div class="flex flex-col items-start gap-1">
                <button
                  v-if="puedeIniciarAlquiler(row)"
                  type="button"
                  class="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                  @click="abrirModalIniciarAlquiler(row)"
                >
                  Iniciar alquiler
                </button>
                <button
                  v-else-if="puedeRegistrarDevolucion(row)"
                  type="button"
                  class="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900"
                  @click="abrirModalDevolucion(row)"
                >
                  Registrar devolución
                </button>
                <span v-else class="text-xs text-slate-500">{{ etiquetaAccion(row) }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AdminListCard>

  <div
    v-if="modalIniciar"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    role="presentation"
    @click.self="cerrarModalIniciar"
  >
    <div
      class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
      role="dialog"
      aria-labelledby="modal-iniciar-alquiler-title"
      aria-modal="true"
    >
      <h2 id="modal-iniciar-alquiler-title" class="text-lg font-semibold text-slate-900">
        Iniciar alquiler
      </h2>
      <p class="mt-1 text-sm text-slate-600">
        Reserva <span class="font-mono font-medium">{{ modalIniciar.codigo }}</span>
        · {{ modalIniciar.vehiculo }}
      </p>
      <p class="mt-2 text-xs text-slate-500">
        El backend marcará la reserva como ACTIVA y el vehículo como EN_USO.
      </p>

      <form class="mt-5 space-y-4" @submit.prevent="onConfirmarIniciarAlquiler">
        <div>
          <label for="km-salida" class="block text-sm font-medium text-slate-700">
            Kilometraje de salida
          </label>
          <input
            id="km-salida"
            v-model="kmSalida"
            type="number"
            min="0"
            step="1"
            required
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            placeholder="Ej. 15230"
          />
        </div>

        <div>
          <label for="observaciones-alquiler" class="block text-sm font-medium text-slate-700">
            Observaciones (opcional)
          </label>
          <textarea
            id="observaciones-alquiler"
            v-model="observacionesAlquiler"
            rows="2"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            placeholder="Sin novedades al momento de salida"
          />
        </div>

        <p v-if="alquilerError" class="text-sm text-red-600" role="alert">{{ alquilerError }}</p>

        <div class="flex gap-3 pt-1">
          <button
            type="button"
            class="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            :disabled="submittingAlquiler"
            @click="cerrarModalIniciar"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="submittingAlquiler || !kmSalidaValido"
          >
            {{ submittingAlquiler ? 'Iniciando…' : 'Confirmar' }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <div
    v-if="modalDevolucion"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    role="presentation"
    @click.self="cerrarModalDevolucion"
  >
    <div
      class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
      role="dialog"
      aria-labelledby="modal-devolucion-title"
      aria-modal="true"
    >
      <h2 id="modal-devolucion-title" class="text-lg font-semibold text-slate-900">
        Registrar devolución
      </h2>
      <p class="mt-1 text-sm text-slate-600">
        Reserva <span class="font-mono font-medium">{{ modalDevolucion.codigo }}</span>
        · {{ modalDevolucion.vehiculo }}
      </p>
      <p
        v-if="modalDevolucion.kmSalida !== undefined"
        class="mt-1 text-xs text-slate-500"
      >
        Kilometraje de salida registrado: {{ modalDevolucion.kmSalida }} km
      </p>

      <form class="mt-5 space-y-4" @submit.prevent="onConfirmarRegistrarDevolucion">
        <div>
          <label for="km-entrada" class="block text-sm font-medium text-slate-700">
            Kilometraje de entrada
          </label>
          <input
            id="km-entrada"
            v-model="kmEntrada"
            type="number"
            :min="modalDevolucion.kmSalida ?? 0"
            step="1"
            required
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            placeholder="Ej. 15890"
          />
        </div>

        <div>
          <label for="estado-vehiculo" class="block text-sm font-medium text-slate-700">
            Estado del vehículo
          </label>
          <select
            id="estado-vehiculo"
            v-model="estadoVehiculo"
            required
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option v-for="estado in ESTADOS_VEHICULO" :key="estado" :value="estado">
              {{ estado }}
            </option>
          </select>
        </div>

        <div>
          <label for="cargo-extra" class="block text-sm font-medium text-slate-700">
            Cargo extra (opcional)
          </label>
          <input
            id="cargo-extra"
            v-model="cargoExtra"
            type="number"
            min="0"
            step="0.01"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            placeholder="0"
          />
        </div>

        <div>
          <label for="observaciones-devolucion" class="block text-sm font-medium text-slate-700">
            Observaciones (opcional)
          </label>
          <textarea
            id="observaciones-devolucion"
            v-model="observacionesDevolucion"
            rows="2"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            placeholder="Novedades al devolver el vehículo"
          />
        </div>

        <p v-if="devolucionError" class="text-sm text-red-600" role="alert">{{ devolucionError }}</p>

        <div class="flex gap-3 pt-1">
          <button
            type="button"
            class="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            :disabled="submittingDevolucion"
            @click="cerrarModalDevolucion"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="flex-1 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="submittingDevolucion || !kmEntradaValido || !cargoExtraValido"
          >
            {{ submittingDevolucion ? 'Registrando…' : 'Confirmar devolución' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
