<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AdminListCard from '@/components/admin/AdminListCard.vue';
import UiSpinner from '@/components/ui/UiSpinner.vue';
import { fetchAdminCatalogs } from '@/composables/useAdminCatalogos';
import {
  actualizarVehiculo,
  crearVehiculo,
  desactivarVehiculo,
  mensajeErrorVehiculo,
  useAdminVehiculos,
  VehiculoAdminError,
} from '@/composables/useAdminVehiculos';
import { vehicleStatusBadgeClass, vehicleStatusLabel } from '@/lib/vehicle-status';
import type {
  ActualizarVehiculoRequest,
  AdminCatalogMaps,
  AdminVehiculoRow,
  CrearVehiculoRequest,
  VehiculoStatusAdmin,
} from '@/types/admin';
import { EMPTY_CATALOG_MAPS } from '@/types/admin';

const { vehiculos, loading, error, fetchVehiculos } = useAdminVehiculos();

const actionSuccess = ref<string | null>(null);
const actionError = ref<string | null>(null);

const modalForm = ref(false);
const modalDesactivar = ref(false);
const modoForm = ref<'crear' | 'editar'>('crear');
const vehiculoEditando = ref<AdminVehiculoRow | null>(null);
const vehiculoDesactivar = ref<AdminVehiculoRow | null>(null);
const submitting = ref(false);
const desactivando = ref(false);
const formError = ref<string | null>(null);

const loadingCatalogos = ref(false);
const catalogosError = ref<string | null>(null);
const catalogos = ref<AdminCatalogMaps>(EMPTY_CATALOG_MAPS);

const agenciaIdInput = ref('');
const marcaIdInput = ref('');
const modeloIdInput = ref('');
const categoriaIdInput = ref('');
const tipoCombustibleIdInput = ref('');
const tipoTransmisionIdInput = ref('');
const placaInput = ref('');
const anioInput = ref('');
const precioDiaInput = ref('');
const colorInput = ref('');
const kilometrajeInput = ref('');
const numeroPasajerosInput = ref('');
const imagenUrlInput = ref('');
const descripcionInput = ref('');
const statusInput = ref<VehiculoStatusAdmin>('DISPONIBLE');

const ESTADOS_VEHICULO: VehiculoStatusAdmin[] = [
  'DISPONIBLE',
  'RESERVADO',
  'EN_USO',
  'MANTENIMIENTO',
  'INACTIVO',
];

const ANIO_MIN = 1990;
const ANIO_MAX = 2035;

const agenciaOptions = computed(() =>
  Array.from(catalogos.value.agencias.entries()).map(([id, nombre]) => ({ id, nombre })),
);
const marcaOptions = computed(() =>
  Array.from(catalogos.value.marcas.entries()).map(([id, nombre]) => ({ id, nombre })),
);
const categoriaOptions = computed(() =>
  Array.from(catalogos.value.categorias.entries()).map(([id, nombre]) => ({ id, nombre })),
);
const tipoCombustibleOptions = computed(() =>
  Array.from(catalogos.value.tiposCombustible.entries()).map(([id, nombre]) => ({ id, nombre })),
);
const tipoTransmisionOptions = computed(() =>
  Array.from(catalogos.value.tiposTransmision.entries()).map(([id, nombre]) => ({ id, nombre })),
);

const modeloOptions = computed(() => {
  const all = catalogos.value.modelosDetalle;
  if (!marcaIdInput.value) return all;
  return all.filter((m) => m.marcaId === marcaIdInput.value);
});

function limpiarMensajes(): void {
  actionError.value = null;
  formError.value = null;
}

async function cargarCatalogos(): Promise<boolean> {
  loadingCatalogos.value = true;
  catalogosError.value = null;

  try {
    catalogos.value = await fetchAdminCatalogs();
    const faltantes: string[] = [];
    if (catalogos.value.agencias.size === 0) faltantes.push('agencias');
    if (catalogos.value.modelosDetalle.length === 0) faltantes.push('modelos');
    if (catalogos.value.categorias.size === 0) faltantes.push('categorías');
    if (catalogos.value.tiposCombustible.size === 0) faltantes.push('tipos de combustible');
    if (catalogos.value.tiposTransmision.size === 0) faltantes.push('tipos de transmisión');
    if (faltantes.length > 0) {
      catalogosError.value = `No se pudieron cargar catálogos requeridos: ${faltantes.join(', ')}.`;
      return false;
    }
    return true;
  } catch {
    catalogosError.value =
      'No se pudo conectar para cargar catálogos (agencias, modelos, categorías, combustible, transmisión).';
    return false;
  } finally {
    loadingCatalogos.value = false;
  }
}

function resetFormulario(): void {
  agenciaIdInput.value = '';
  marcaIdInput.value = '';
  modeloIdInput.value = '';
  categoriaIdInput.value = '';
  tipoCombustibleIdInput.value = '';
  tipoTransmisionIdInput.value = '';
  placaInput.value = '';
  anioInput.value = '';
  precioDiaInput.value = '';
  colorInput.value = '';
  kilometrajeInput.value = '';
  numeroPasajerosInput.value = '';
  imagenUrlInput.value = '';
  descripcionInput.value = '';
  statusInput.value = 'DISPONIBLE';
  formError.value = null;
}

function onMarcaChange(): void {
  if (!modeloIdInput.value) return;
  const modelo = catalogos.value.modelosDetalle.find((m) => m.id === modeloIdInput.value);
  if (modelo?.marcaId && modelo.marcaId !== marcaIdInput.value) {
    modeloIdInput.value = '';
  }
}

async function abrirModalCrear(): Promise<void> {
  limpiarMensajes();
  actionSuccess.value = null;
  modoForm.value = 'crear';
  vehiculoEditando.value = null;
  resetFormulario();
  modalForm.value = true;

  const ok = await cargarCatalogos();
  if (!ok) modalForm.value = false;
}

async function abrirModalEditar(row: AdminVehiculoRow): Promise<void> {
  limpiarMensajes();
  actionSuccess.value = null;
  modoForm.value = 'editar';
  vehiculoEditando.value = row;
  resetFormulario();
  modalForm.value = true;

  const ok = await cargarCatalogos();
  if (!ok) {
    modalForm.value = false;
    return;
  }

  agenciaIdInput.value = row.agenciaId;
  marcaIdInput.value = row.marcaId;
  modeloIdInput.value = row.modeloId;
  categoriaIdInput.value = row.categoriaId;
  tipoCombustibleIdInput.value = row.tipoCombustibleId;
  tipoTransmisionIdInput.value = row.tipoTransmisionId;
  placaInput.value = row.placa !== '—' ? row.placa : '';
  anioInput.value = row.anio !== null ? String(row.anio) : '';
  precioDiaInput.value =
    row.precioDia !== null ? String(row.precioDia) : row.precioPorDia !== '—' ? row.precioPorDia : '';
  colorInput.value = row.color;
  kilometrajeInput.value = row.kilometraje !== null ? String(row.kilometraje) : '';
  numeroPasajerosInput.value =
    row.numeroPasajeros !== null ? String(row.numeroPasajeros) : '';
  imagenUrlInput.value = row.imagenUrl ?? '';
  descripcionInput.value = row.descripcion;
  const estadoNorm = row.estado.trim().toUpperCase();
  if (ESTADOS_VEHICULO.includes(estadoNorm as VehiculoStatusAdmin)) {
    statusInput.value = estadoNorm as VehiculoStatusAdmin;
  }
}

function cerrarModalForm(): void {
  modalForm.value = false;
  vehiculoEditando.value = null;
  formError.value = null;
}

function abrirModalDesactivar(row: AdminVehiculoRow): void {
  limpiarMensajes();
  actionSuccess.value = null;
  vehiculoDesactivar.value = row;
  modalDesactivar.value = true;
}

function cerrarModalDesactivar(): void {
  modalDesactivar.value = false;
  vehiculoDesactivar.value = null;
}

function validarFormulario():
  | { crear: CrearVehiculoRequest }
  | { editar: ActualizarVehiculoRequest }
  | null {
  if (!agenciaIdInput.value.trim()) {
    formError.value = 'Selecciona una agencia.';
    return null;
  }
  if (!modeloIdInput.value.trim()) {
    formError.value = 'Selecciona un modelo.';
    return null;
  }
  if (!categoriaIdInput.value.trim()) {
    formError.value = 'Selecciona una categoría.';
    return null;
  }
  if (!tipoCombustibleIdInput.value.trim()) {
    formError.value = 'Selecciona un tipo de combustible.';
    return null;
  }
  if (!tipoTransmisionIdInput.value.trim()) {
    formError.value = 'Selecciona un tipo de transmisión.';
    return null;
  }

  const placa = placaInput.value.trim();
  if (!placa) {
    formError.value = 'La placa es obligatoria.';
    return null;
  }

  const anio = Number(anioInput.value);
  if (!Number.isFinite(anio) || anio < ANIO_MIN || anio > ANIO_MAX) {
    formError.value = `El año debe estar entre ${ANIO_MIN} y ${ANIO_MAX}.`;
    return null;
  }

  const precioDia = Number(precioDiaInput.value);
  if (!Number.isFinite(precioDia) || precioDia <= 0) {
    formError.value = 'El precio por día debe ser mayor a 0.';
    return null;
  }

  const kmRaw = kilometrajeInput.value.trim();
  let kilometraje: number | undefined;
  if (kmRaw) {
    kilometraje = Number(kmRaw);
    if (!Number.isFinite(kilometraje) || kilometraje < 0) {
      formError.value = 'El kilometraje debe ser un número ≥ 0.';
      return null;
    }
  }

  const pasRaw = numeroPasajerosInput.value.trim();
  let numeroPasajeros: number | undefined;
  if (pasRaw) {
    numeroPasajeros = Number(pasRaw);
    if (!Number.isFinite(numeroPasajeros) || numeroPasajeros <= 0) {
      formError.value = 'El número de pasajeros debe ser mayor a 0.';
      return null;
    }
  }

  const color = colorInput.value.trim() || undefined;
  const imagenUrl = imagenUrlInput.value.trim() || undefined;
  const descripcion = descripcionInput.value.trim() || undefined;

  const base = {
    agenciaId: agenciaIdInput.value.trim(),
    modeloId: modeloIdInput.value.trim(),
    categoriaId: categoriaIdInput.value.trim(),
    tipoCombustibleId: tipoCombustibleIdInput.value.trim(),
    tipoTransmisionId: tipoTransmisionIdInput.value.trim(),
    placa,
    anio,
    precioDia,
    color,
    kilometraje,
    numeroPasajeros,
    imagenUrl,
    descripcion,
  };

  if (modoForm.value === 'crear') {
    return { crear: base };
  }

  return {
    editar: {
      ...base,
      status: statusInput.value,
    },
  };
}

async function onSubmitFormulario(): Promise<void> {
  const parsed = validarFormulario();
  if (!parsed) return;

  submitting.value = true;
  formError.value = null;

  try {
    if ('crear' in parsed) {
      await crearVehiculo(parsed.crear);
      actionSuccess.value = 'Vehículo creado correctamente.';
    } else if (vehiculoEditando.value) {
      await actualizarVehiculo(vehiculoEditando.value.id, parsed.editar);
      actionSuccess.value = 'Vehículo actualizado correctamente.';
    }

    cerrarModalForm();
    await fetchVehiculos();
  } catch (err: unknown) {
    const serviceErr =
      err instanceof VehiculoAdminError
        ? err
        : new VehiculoAdminError('No se pudo guardar el vehículo.');
    formError.value = mensajeErrorVehiculo(serviceErr);
  } finally {
    submitting.value = false;
  }
}

async function onConfirmDesactivar(): Promise<void> {
  const row = vehiculoDesactivar.value;
  if (!row) return;

  desactivando.value = true;
  limpiarMensajes();
  actionSuccess.value = null;

  try {
    await desactivarVehiculo(row.id);
    actionSuccess.value = 'Vehículo desactivado correctamente.';
    cerrarModalDesactivar();
    await fetchVehiculos();
  } catch (err: unknown) {
    const serviceErr =
      err instanceof VehiculoAdminError
        ? err
        : new VehiculoAdminError('No se pudo desactivar el vehículo.');
    actionError.value = mensajeErrorVehiculo(serviceErr);
  } finally {
    desactivando.value = false;
  }
}

onMounted(() => {
  void fetchVehiculos();
});
</script>

<template>
  <div class="space-y-4">
    <p
      v-if="actionSuccess"
      class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
      role="status"
    >
      {{ actionSuccess }}
    </p>
    <p
      v-if="actionError"
      class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
      role="alert"
    >
      {{ actionError }}
    </p>

    <AdminListCard
      title="Vehículos"
      description="Inventario del Admin Gateway: crear, editar y desactivar vehículos."
      :loading="loading"
      :error="error"
      :empty="!loading && !error && vehiculos.length === 0"
      empty-message="No hay vehículos registrados."
      @retry="fetchVehiculos()"
    >
      <div class="mb-4 flex flex-wrap items-center justify-end gap-2 px-3 sm:px-0">
        <button
          type="button"
          class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          @click="abrirModalCrear"
        >
          Agregar vehículo
        </button>
      </div>

      <div class="min-w-[860px] overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-3 py-2 text-left font-medium text-slate-600">Imagen</th>
              <th class="px-3 py-2 text-left font-medium text-slate-600">Nombre</th>
              <th class="px-3 py-2 text-left font-medium text-slate-600">Placa</th>
              <th class="px-3 py-2 text-left font-medium text-slate-600">Marca</th>
              <th class="px-3 py-2 text-left font-medium text-slate-600">Modelo</th>
              <th class="px-3 py-2 text-left font-medium text-slate-600">Categoría</th>
              <th class="px-3 py-2 text-right font-medium text-slate-600">Precio / día</th>
              <th class="px-3 py-2 text-left font-medium text-slate-600">Estado</th>
              <th class="min-w-[140px] px-3 py-2 text-left font-medium text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="row in vehiculos" :key="row.id" class="hover:bg-slate-50">
              <td class="px-3 py-3">
                <img
                  v-if="row.imagenUrl"
                  :src="row.imagenUrl"
                  :alt="row.nombre"
                  class="h-10 w-14 rounded object-cover"
                />
                <span v-else class="text-slate-400">—</span>
              </td>
              <td class="max-w-[180px] px-3 py-3 font-medium text-slate-900" :title="row.nombre">
                {{ row.nombre }}
              </td>
              <td class="px-3 py-3 font-mono text-slate-700">{{ row.placa }}</td>
              <td class="px-3 py-3 text-slate-700">{{ row.marca }}</td>
              <td class="px-3 py-3 text-slate-700">{{ row.modelo }}</td>
              <td class="px-3 py-3 text-slate-700">{{ row.categoria }}</td>
              <td class="px-3 py-3 text-right text-slate-900">${{ row.precioPorDia }}</td>
              <td class="px-3 py-3">
                <span
                  class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                  :class="vehicleStatusBadgeClass(row.estado)"
                  :title="`Estado en sistema: ${row.estado}`"
                >
                  {{ vehicleStatusLabel(row.estado) }}
                </span>
              </td>
              <td class="px-3 py-3">
                <div class="flex flex-col items-start gap-1.5">
                  <button
                    type="button"
                    class="text-xs font-medium text-brand-700 underline hover:text-brand-900"
                    @click="abrirModalEditar(row)"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    class="text-xs font-medium text-red-700 underline hover:text-red-900"
                    @click="abrirModalDesactivar(row)"
                  >
                    Desactivar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminListCard>
  </div>

  <!-- Modal crear / editar -->
  <Teleport to="body">
    <div
      v-if="modalForm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-vehiculo-title"
    >
      <div class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="modal-vehiculo-title" class="text-lg font-semibold text-slate-900">
          {{ modoForm === 'crear' ? 'Agregar vehículo' : 'Editar vehículo' }}
        </h2>
        <p v-if="vehiculoEditando" class="mt-1 text-sm text-slate-600">
          {{ vehiculoEditando.nombre }} · {{ vehiculoEditando.placa }}
        </p>

        <UiSpinner v-if="loadingCatalogos" class="mt-6" label="Cargando catálogos…" />

        <p
          v-else-if="catalogosError"
          class="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
          role="alert"
        >
          {{ catalogosError }}
        </p>

        <form v-else class="mt-4 space-y-4" @submit.prevent="onSubmitFormulario">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="veh-agencia" class="block text-sm font-medium text-slate-700">
                Agencia <span class="text-red-600">*</span>
              </label>
              <select
                id="veh-agencia"
                v-model="agenciaIdInput"
                required
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">Seleccionar…</option>
                <option v-for="opt in agenciaOptions" :key="opt.id" :value="opt.id">
                  {{ opt.nombre }}
                </option>
              </select>
            </div>

            <div>
              <label for="veh-marca" class="block text-sm font-medium text-slate-700">
                Marca
              </label>
              <select
                id="veh-marca"
                v-model="marcaIdInput"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                @change="onMarcaChange"
              >
                <option value="">Todas las marcas</option>
                <option v-for="opt in marcaOptions" :key="opt.id" :value="opt.id">
                  {{ opt.nombre }}
                </option>
              </select>
            </div>

            <div>
              <label for="veh-modelo" class="block text-sm font-medium text-slate-700">
                Modelo <span class="text-red-600">*</span>
              </label>
              <select
                id="veh-modelo"
                v-model="modeloIdInput"
                required
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">Seleccionar…</option>
                <option v-for="opt in modeloOptions" :key="opt.id" :value="opt.id">
                  {{ opt.nombre }}
                </option>
              </select>
            </div>

            <div>
              <label for="veh-categoria" class="block text-sm font-medium text-slate-700">
                Categoría <span class="text-red-600">*</span>
              </label>
              <select
                id="veh-categoria"
                v-model="categoriaIdInput"
                required
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">Seleccionar…</option>
                <option v-for="opt in categoriaOptions" :key="opt.id" :value="opt.id">
                  {{ opt.nombre }}
                </option>
              </select>
            </div>

            <div>
              <label for="veh-combustible" class="block text-sm font-medium text-slate-700">
                Tipo combustible <span class="text-red-600">*</span>
              </label>
              <select
                id="veh-combustible"
                v-model="tipoCombustibleIdInput"
                required
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">Seleccionar…</option>
                <option v-for="opt in tipoCombustibleOptions" :key="opt.id" :value="opt.id">
                  {{ opt.nombre }}
                </option>
              </select>
            </div>

            <div>
              <label for="veh-transmision" class="block text-sm font-medium text-slate-700">
                Tipo transmisión <span class="text-red-600">*</span>
              </label>
              <select
                id="veh-transmision"
                v-model="tipoTransmisionIdInput"
                required
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">Seleccionar…</option>
                <option v-for="opt in tipoTransmisionOptions" :key="opt.id" :value="opt.id">
                  {{ opt.nombre }}
                </option>
              </select>
            </div>

            <div>
              <label for="veh-placa" class="block text-sm font-medium text-slate-700">
                Placa <span class="text-red-600">*</span>
              </label>
              <input
                id="veh-placa"
                v-model="placaInput"
                type="text"
                required
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label for="veh-anio" class="block text-sm font-medium text-slate-700">
                Año <span class="text-red-600">*</span>
              </label>
              <input
                id="veh-anio"
                v-model="anioInput"
                type="number"
                :min="ANIO_MIN"
                :max="ANIO_MAX"
                required
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label for="veh-precio" class="block text-sm font-medium text-slate-700">
                Precio / día <span class="text-red-600">*</span>
              </label>
              <input
                id="veh-precio"
                v-model="precioDiaInput"
                type="number"
                min="0.01"
                step="0.01"
                required
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label for="veh-color" class="block text-sm font-medium text-slate-700">Color</label>
              <input
                id="veh-color"
                v-model="colorInput"
                type="text"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label for="veh-km" class="block text-sm font-medium text-slate-700">
                Kilometraje
              </label>
              <input
                id="veh-km"
                v-model="kilometrajeInput"
                type="number"
                min="0"
                step="1"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label for="veh-pasajeros" class="block text-sm font-medium text-slate-700">
                Número de pasajeros
              </label>
              <input
                id="veh-pasajeros"
                v-model="numeroPasajerosInput"
                type="number"
                min="1"
                step="1"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div v-if="modoForm === 'editar'">
              <label for="veh-estado" class="block text-sm font-medium text-slate-700">
                Estado
              </label>
              <select
                id="veh-estado"
                v-model="statusInput"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option v-for="estado in ESTADOS_VEHICULO" :key="estado" :value="estado">
                  {{ vehicleStatusLabel(estado) }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label for="veh-imagen" class="block text-sm font-medium text-slate-700">
              URL de imagen
            </label>
            <input
              id="veh-imagen"
              v-model="imagenUrlInput"
              type="url"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label for="veh-descripcion" class="block text-sm font-medium text-slate-700">
              Descripción
            </label>
            <textarea
              id="veh-descripcion"
              v-model="descripcionInput"
              rows="3"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <p
            v-if="formError"
            class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
            role="alert"
          >
            {{ formError }}
          </p>

          <div class="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              :disabled="submitting"
              @click="cerrarModalForm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="submitting"
            >
              {{ submitting ? 'Guardando…' : modoForm === 'crear' ? 'Crear vehículo' : 'Guardar cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>

  <!-- Modal desactivar -->
  <Teleport to="body">
    <div
      v-if="modalDesactivar"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-desactivar-title"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="modal-desactivar-title" class="text-lg font-semibold text-slate-900">
          Desactivar vehículo
        </h2>
        <p v-if="vehiculoDesactivar" class="mt-1 text-sm text-slate-600">
          {{ vehiculoDesactivar.nombre }} · {{ vehiculoDesactivar.placa }}
        </p>
        <p class="mt-4 text-sm text-slate-700">
          ¿Seguro que deseas desactivar este vehículo? El backend realizará un soft delete y dejará
          de estar disponible en el inventario activo.
        </p>

        <div class="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            :disabled="desactivando"
            @click="cerrarModalDesactivar"
          >
            Volver
          </button>
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="desactivando"
            @click="onConfirmDesactivar"
          >
            {{ desactivando ? 'Desactivando…' : 'Sí, desactivar' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
