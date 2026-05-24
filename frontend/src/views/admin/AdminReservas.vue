<script setup lang="ts">
import { onMounted, ref } from 'vue';
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
import {
  confirmarReserva,
  mensajeErrorConfirmarReserva,
  ReservaServiceError,
} from '@/composables/useReservas';
import {
  eliminarAlquilerDeCache,
  guardarAlquilerEnCache,
} from '@/lib/alquiler-reserva-cache';
import type { AdminReservaRow, EstadoVehiculoDevolucion } from '@/types/admin';

const { reservas, loading, error, fetchReservas } = useAdminReservas();
const { fetchVehiculos } = useAdminVehiculos();

const confirmingReservaId = ref<string | null>(null);
const startingReservaId = ref<string | null>(null);
const returningReservaId = ref<string | null>(null);

const actionSuccess = ref<string | null>(null);
const actionError = ref<string | null>(null);

const modalIniciar = ref(false);
const modalDevolucion = ref(false);
const reservaSeleccionada = ref<AdminReservaRow | null>(null);

const kmSalidaInput = ref('');
const observacionesInicio = ref('');
const kmEntradaInput = ref('');
const estadoVehiculoInput = ref<EstadoVehiculoDevolucion>('BUENO');
const cargoExtraInput = ref('');
const observacionesDevolucion = ref('');
const formError = ref<string | null>(null);

const ESTADOS_DEVOLUCION: EstadoVehiculoDevolucion[] = ['BUENO', 'REGULAR', 'MALO'];

function normalizarEstado(estado: string): string {
  return estado.trim().toUpperCase();
}

function puedeConfirmar(row: AdminReservaRow): boolean {
  return normalizarEstado(row.estado) === 'PENDIENTE';
}

function puedeIniciar(row: AdminReservaRow): boolean {
  return normalizarEstado(row.estado) === 'CONFIRMADA';
}

function puedeDevolver(row: AdminReservaRow): boolean {
  return normalizarEstado(row.estado) === 'ACTIVA' && Boolean(row.alquilerId);
}

function esActivaSinAlquiler(row: AdminReservaRow): boolean {
  return normalizarEstado(row.estado) === 'ACTIVA' && !row.alquilerId;
}

function etiquetaEstadoFinal(row: AdminReservaRow): string {
  const estado = normalizarEstado(row.estado);
  if (estado === 'COMPLETADA') return 'Finalizada';
  if (estado === 'CANCELADA') return 'Cancelada';
  return '';
}

function limpiarMensajes(): void {
  actionError.value = null;
  formError.value = null;
}

async function refrescarListados(): Promise<void> {
  await fetchReservas();
  await fetchVehiculos({ limit: 200 });
}

function abrirModalIniciar(row: AdminReservaRow): void {
  reservaSeleccionada.value = row;
  kmSalidaInput.value = '';
  observacionesInicio.value = '';
  formError.value = null;
  modalIniciar.value = true;
}

function cerrarModalIniciar(): void {
  modalIniciar.value = false;
  reservaSeleccionada.value = null;
}

function abrirModalDevolucion(row: AdminReservaRow): void {
  reservaSeleccionada.value = row;
  kmEntradaInput.value = '';
  estadoVehiculoInput.value = 'BUENO';
  cargoExtraInput.value = '';
  observacionesDevolucion.value = '';
  formError.value = null;
  modalDevolucion.value = true;
}

function cerrarModalDevolucion(): void {
  modalDevolucion.value = false;
  reservaSeleccionada.value = null;
}

async function onConfirmarReserva(row: AdminReservaRow): Promise<void> {
  if (!puedeConfirmar(row)) return;

  confirmingReservaId.value = row.id;
  limpiarMensajes();
  actionSuccess.value = null;

  try {
    await confirmarReserva(row.id);
    actionSuccess.value = 'Reserva confirmada correctamente.';
    await fetchReservas();
  } catch (err: unknown) {
    const serviceErr =
      err instanceof ReservaServiceError
        ? err
        : new ReservaServiceError('No se pudo confirmar la reserva.');
    actionError.value = mensajeErrorConfirmarReserva(serviceErr);
  } finally {
    confirmingReservaId.value = null;
  }
}

function validarKmSalida(): number | null {
  const raw = String(kmSalidaInput.value ?? '').trim();
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    formError.value = 'Ingresa un kilometraje de salida válido (número ≥ 0).';
    return null;
  }
  return n;
}

async function onSubmitIniciarAlquiler(): Promise<void> {
  const row = reservaSeleccionada.value;
  if (!row) return;

  const kmSalida = validarKmSalida();
  if (kmSalida === null) return;

  startingReservaId.value = row.id;
  limpiarMensajes();

  try {
    const result = await iniciarAlquiler({
      reservaId: row.id,
      kmSalida,
      fechaInicio: new Date().toISOString(),
      observaciones: observacionesInicio.value.trim() || undefined,
    });

    guardarAlquilerEnCache(row.id, result.id, result.kmSalida ?? kmSalida);
    actionSuccess.value = 'Alquiler iniciado correctamente.';
    cerrarModalIniciar();
    await refrescarListados();
  } catch (err: unknown) {
    const serviceErr =
      err instanceof AlquilerServiceError
        ? err
        : new AlquilerServiceError('No se pudo iniciar el alquiler.');
    formError.value = mensajeErrorIniciarAlquiler(serviceErr);
  } finally {
    startingReservaId.value = null;
  }
}

function validarKmEntrada(row: AdminReservaRow): number | null {
  const raw = String(kmEntradaInput.value ?? '').trim();
  const kmEntrada = Number(raw);
  if (!Number.isFinite(kmEntrada) || kmEntrada < 0) {
    formError.value = 'Ingresa un kilometraje de entrada válido (número ≥ 0).';
    return null;
  }

  const kmSalida = row.kmSalida;
  if (kmSalida !== null && kmSalida !== undefined && kmEntrada < kmSalida) {
    formError.value = `El kilometraje de entrada (${kmEntrada}) no puede ser menor al de salida (${kmSalida}).`;
    return null;
  }

  return kmEntrada;
}

function validarCargoExtra(): number | null {
  const raw = String(cargoExtraInput.value ?? '').trim();
  if (!raw) return 0;

  const cargoExtra = Number(raw);
  if (!Number.isFinite(cargoExtra) || cargoExtra < 0) {
    formError.value = 'El cargo extra debe ser un número ≥ 0.';
    return null;
  }

  return cargoExtra;
}

function validarDevolucion(row: AdminReservaRow): {
  kmEntrada: number;
  cargoExtra: number;
} | null {
  const kmEntrada = validarKmEntrada(row);
  if (kmEntrada === null) return null;

  const cargoExtra = validarCargoExtra();
  if (cargoExtra === null) return null;

  return { kmEntrada, cargoExtra };
}

async function onSubmitRegistrarDevolucion(): Promise<void> {
  const row = reservaSeleccionada.value;
  if (!row?.alquilerId) return;

  formError.value = null;
  const parsed = validarDevolucion(row);
  if (!parsed) return;

  returningReservaId.value = row.id;
  limpiarMensajes();

  try {
    await registrarDevolucion({
      alquilerId: row.alquilerId,
      kmEntrada: parsed.kmEntrada,
      estadoVehiculo: estadoVehiculoInput.value,
      cargoExtra: parsed.cargoExtra,
      observaciones: observacionesDevolucion.value.trim() || undefined,
    });

    eliminarAlquilerDeCache(row.id);
    actionSuccess.value = 'Devolución registrada correctamente.';
    cerrarModalDevolucion();
    await refrescarListados();
  } catch (err: unknown) {
    const serviceErr =
      err instanceof AlquilerServiceError
        ? err
        : new AlquilerServiceError('No se pudo registrar la devolución.');
    formError.value = mensajeErrorRegistrarDevolucion(serviceErr);
  } finally {
    returningReservaId.value = null;
  }
}

onMounted(() => {
  void fetchReservas();
});
</script>

<template>
  <AdminListCard
    title="Reservas"
    description="Gestión operativa: confirmar, iniciar alquiler y registrar devolución."
    :loading="loading"
    :error="error"
    :empty="!loading && !error && reservas.length === 0"
    empty-message="No hay reservas registradas."
    @retry="fetchReservas()"
  >
    <p
      v-if="actionSuccess"
      class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
      role="status"
    >
      {{ actionSuccess }}
      <button
        type="button"
        class="ml-2 text-xs font-medium text-emerald-800 underline hover:text-emerald-950"
        @click="actionSuccess = null"
      >
        Cerrar
      </button>
    </p>

    <p
      v-if="actionError"
      class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      role="alert"
    >
      {{ actionError }}
      <button
        type="button"
        class="ml-2 text-xs font-medium text-amber-800 underline hover:text-amber-950"
        @click="actionError = null"
      >
        Cerrar
      </button>
    </p>

    <div class="min-w-[960px] overflow-x-auto">
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
              <button
                v-if="puedeConfirmar(row)"
                type="button"
                class="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="confirmingReservaId === row.id"
                @click="onConfirmarReserva(row)"
              >
                {{ confirmingReservaId === row.id ? 'Confirmando…' : 'Confirmar reserva' }}
              </button>

              <button
                v-else-if="puedeIniciar(row)"
                type="button"
                class="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="startingReservaId === row.id"
                @click="abrirModalIniciar(row)"
              >
                Iniciar alquiler
              </button>

              <button
                v-else-if="puedeDevolver(row)"
                type="button"
                class="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="returningReservaId === row.id"
                @click="abrirModalDevolucion(row)"
              >
                Registrar devolución
              </button>

              <span v-else-if="esActivaSinAlquiler(row)" class="text-xs text-amber-700">
                Alquiler en curso
              </span>

              <span v-else-if="etiquetaEstadoFinal(row)" class="text-xs text-slate-500">
                {{ etiquetaEstadoFinal(row) }}
              </span>

              <span v-else class="text-xs text-slate-400">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AdminListCard>

  <!-- Modal iniciar alquiler -->
  <Teleport to="body">
    <div
      v-if="modalIniciar"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-iniciar-title"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="modal-iniciar-title" class="text-lg font-semibold text-slate-900">
          Iniciar alquiler
        </h2>
        <p v-if="reservaSeleccionada" class="mt-1 text-sm text-slate-600">
          Reserva {{ reservaSeleccionada.codigo }}
        </p>

        <form class="mt-4 space-y-4" @submit.prevent="onSubmitIniciarAlquiler">
          <div>
            <label for="km-salida" class="block text-sm font-medium text-slate-700">
              Kilometraje de salida <span class="text-red-600">*</span>
            </label>
            <input
              id="km-salida"
              v-model="kmSalidaInput"
              type="number"
              min="0"
              step="1"
              required
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Ej. 15230"
            />
          </div>

          <div>
            <label for="obs-inicio" class="block text-sm font-medium text-slate-700">
              Observaciones
            </label>
            <textarea
              id="obs-inicio"
              v-model="observacionesInicio"
              rows="2"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Opcional"
            />
          </div>

          <p v-if="formError" class="text-sm text-red-600" role="alert">{{ formError }}</p>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              :disabled="startingReservaId !== null"
              @click="cerrarModalIniciar"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              :disabled="startingReservaId !== null"
            >
              {{ startingReservaId ? 'Iniciando…' : 'Iniciar alquiler' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>

  <!-- Modal registrar devolución -->
  <Teleport to="body">
    <div
      v-if="modalDevolucion"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-devolucion-title"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="modal-devolucion-title" class="text-lg font-semibold text-slate-900">
          Registrar devolución
        </h2>
        <p v-if="reservaSeleccionada" class="mt-1 text-sm text-slate-600">
          Reserva {{ reservaSeleccionada.codigo }}
          <span v-if="reservaSeleccionada.kmSalida != null" class="block text-xs text-slate-500">
            Km salida: {{ reservaSeleccionada.kmSalida }}
          </span>
        </p>

        <form class="mt-4 space-y-4" @submit.prevent="onSubmitRegistrarDevolucion">
          <div>
            <label for="km-entrada" class="block text-sm font-medium text-slate-700">
              Kilometraje de entrada <span class="text-red-600">*</span>
            </label>
            <input
              id="km-entrada"
              v-model="kmEntradaInput"
              type="number"
              min="0"
              step="1"
              required
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Ej. 16000"
            />
          </div>

          <div>
            <label for="estado-vehiculo" class="block text-sm font-medium text-slate-700">
              Estado del vehículo <span class="text-red-600">*</span>
            </label>
            <select
              id="estado-vehiculo"
              v-model="estadoVehiculoInput"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option v-for="est in ESTADOS_DEVOLUCION" :key="est" :value="est">
                {{ est }}
              </option>
            </select>
          </div>

          <div>
            <label for="cargo-extra" class="block text-sm font-medium text-slate-700">
              Cargo extra
            </label>
            <input
              id="cargo-extra"
              v-model="cargoExtraInput"
              type="number"
              min="0"
              step="0.01"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="0"
            />
          </div>

          <div>
            <label for="obs-devolucion" class="block text-sm font-medium text-slate-700">
              Observaciones
            </label>
            <textarea
              id="obs-devolucion"
              v-model="observacionesDevolucion"
              rows="2"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Opcional"
            />
          </div>

          <p v-if="formError" class="text-sm text-red-600" role="alert">{{ formError }}</p>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              :disabled="returningReservaId !== null"
              @click="cerrarModalDevolucion"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
              :disabled="returningReservaId !== null"
            >
              {{ returningReservaId ? 'Registrando…' : 'Registrar devolución' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
