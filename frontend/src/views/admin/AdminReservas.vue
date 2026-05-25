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
import {
  cancelarReserva,
  confirmarReserva,
  mensajeErrorCancelarReserva,
  mensajeErrorConfirmarReserva,
  ReservaServiceError,
} from '@/composables/useReservas';
import {
  buildValoresPorDefectoFactura,
  calcularMontoPendiente,
  calcularTotalesPagoReserva,
  cargarDetalleFinancieroReserva,
  confirmarPago,
  esPagoEstadoPendiente,
  estadoFinancieroReserva,
  etiquetaEstadoFinancieroReserva,
  estadoUiGenerarFactura,
  FinancieroAdminError,
  generarFacturaReserva,
  mensajeErrorConfirmarPago,
  mensajeErrorGenerarFactura,
  mensajeErrorRegistrarPago,
  mensajeUiGenerarFactura,
  puedeRegistrarPagoReserva,
  recargarDetalleFinancieroCompleto,
  recargarPagosYResumenReserva,
  registrarPagoReserva,
} from '@/composables/useAdminReservaFinanciero';
import {
  eliminarAlquilerDeCache,
  guardarAlquilerEnCache,
} from '@/lib/alquiler-reserva-cache';
import type {
  AdminReservaRow,
  EstadoVehiculoDevolucion,
  MetodoPagoAdmin,
  ReservaDetalleAdmin,
} from '@/types/admin';

const { reservas, loading, error, fetchReservas } = useAdminReservas();
const { fetchVehiculos } = useAdminVehiculos();

const confirmingReservaId = ref<string | null>(null);
const cancelingReservaId = ref<string | null>(null);
const startingReservaId = ref<string | null>(null);
const returningReservaId = ref<string | null>(null);

const actionSuccess = ref<string | null>(null);
const actionError = ref<string | null>(null);

const modalIniciar = ref(false);
const modalDevolucion = ref(false);
const modalCancelar = ref(false);
const modalDetalle = ref(false);
const modalRegistrarPago = ref(false);
const modalGenerarFactura = ref(false);
const loadingDetalle = ref(false);
const submittingPago = ref(false);
const submittingFactura = ref(false);
const confirmingPagoId = ref<string | null>(null);
const detalleAdmin = ref<ReservaDetalleAdmin | null>(null);
const detalleSuccess = ref<string | null>(null);
const pagoFormError = ref<string | null>(null);
const reservaSeleccionada = ref<AdminReservaRow | null>(null);

const montoPagoInput = ref('');
const metodoPagoInput = ref<MetodoPagoAdmin>('EFECTIVO');
const referenciaPagoInput = ref('');

const facturaRucInput = ref('');
const facturaRazonSocialInput = ref('');
const facturaDescripcionInput = ref('');
const facturaCantidadInput = ref('1');
const facturaPrecioUnitInput = ref('');
const facturaPagoId = ref<string | undefined>(undefined);
const facturaFormError = ref<string | null>(null);

const kmSalidaInput = ref('');
const observacionesInicio = ref('');
const kmEntradaInput = ref('');
const estadoVehiculoInput = ref<EstadoVehiculoDevolucion>('BUENO');
const cargoExtraInput = ref('');
const observacionesDevolucion = ref('');
const formError = ref<string | null>(null);

const ESTADOS_DEVOLUCION: EstadoVehiculoDevolucion[] = ['BUENO', 'REGULAR', 'MALO'];
const METODOS_PAGO: MetodoPagoAdmin[] = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'OTRO'];

const detalleTotalesPago = computed(() => {
  if (!detalleAdmin.value) return null;
  return calcularTotalesPagoReserva(detalleAdmin.value.reserva, detalleAdmin.value.pagos);
});

const detallePuedeRegistrarPago = computed(() => {
  if (!detalleAdmin.value) return false;
  return puedeRegistrarPagoReserva(
    detalleAdmin.value.reserva,
    detalleAdmin.value.pagos,
  );
});

const detalleMontoPendiente = computed(() => {
  if (!detalleAdmin.value) return null;
  return calcularMontoPendiente(detalleAdmin.value.reserva, detalleAdmin.value.pagos);
});

const detalleEstadoFinanciero = computed(() => {
  if (!detalleAdmin.value) return 'sin-pagos' as const;
  return estadoFinancieroReserva(detalleAdmin.value.reserva, detalleAdmin.value.pagos);
});

const detalleEtiquetaFinanciero = computed(() =>
  etiquetaEstadoFinancieroReserva(detalleEstadoFinanciero.value),
);

const detalleEstadoFactura = computed(() => {
  if (!detalleAdmin.value) return 'oculto-cancelada' as const;
  return estadoUiGenerarFactura(
    detalleAdmin.value.reserva,
    detalleAdmin.value.resumenPago,
    detalleAdmin.value.pagos,
    detalleAdmin.value.facturas,
  );
});

const detalleMensajeFactura = computed(() => {
  if (!detalleAdmin.value) return null;
  return mensajeUiGenerarFactura(
    detalleEstadoFactura.value,
    detalleAdmin.value.reserva,
    detalleAdmin.value.pagos,
  );
});

const detalleTextoSinRegistrarPago = computed(() => {
  if (!detalleTotalesPago.value) return '';
  if (detalleTotalesPago.value.reservaPagadaCompleta) return 'Pago completo';
  if (detalleTotalesPago.value.saldoDisponibleParaRegistrar <= 0) {
    return 'Sin saldo disponible para registrar';
  }
  return '';
});

const detallePuedeGenerarFactura = computed(() => detalleEstadoFactura.value === 'permitido');

function normalizarEstado(estado: string): string {
  return estado.trim().toUpperCase();
}

function puedeConfirmar(row: AdminReservaRow): boolean {
  return normalizarEstado(row.estado) === 'PENDIENTE';
}

function puedeCancelar(row: AdminReservaRow): boolean {
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

function cerrarModalRegistrarPago(): void {
  modalRegistrarPago.value = false;
  pagoFormError.value = null;
}

function abrirModalRegistrarPago(): void {
  if (!detalleAdmin.value || !detallePuedeRegistrarPago.value) return;

  const pendiente = detalleMontoPendiente.value;
  montoPagoInput.value = pendiente !== null && pendiente > 0 ? String(pendiente) : '';
  metodoPagoInput.value = 'EFECTIVO';
  referenciaPagoInput.value = '';
  pagoFormError.value = null;
  modalRegistrarPago.value = true;
}

function validarFormularioPago(): { monto: number } | null {
  const raw = String(montoPagoInput.value ?? '').trim();
  const monto = Number(raw);
  if (!Number.isFinite(monto) || monto <= 0) {
    pagoFormError.value = 'Ingresa un monto válido mayor a 0.';
    return null;
  }

  const disponible = detalleTotalesPago.value?.saldoDisponibleParaRegistrar ?? null;
  if (disponible !== null && disponible <= 0) {
    pagoFormError.value = 'No hay saldo disponible para registrar más pagos.';
    return null;
  }
  if (disponible !== null && monto > disponible + 0.001) {
    pagoFormError.value =
      'El monto supera el saldo disponible considerando pagos pendientes y confirmados.';
    return null;
  }

  if (!metodoPagoInput.value.trim()) {
    pagoFormError.value = 'Selecciona un método de pago.';
    return null;
  }

  return { monto };
}

async function recargarDetalleFinancieroPagos(): Promise<void> {
  if (!detalleAdmin.value) return;

  const reserva = detalleAdmin.value.reserva;
  const actualizado = await recargarPagosYResumenReserva(reserva.id);
  detalleAdmin.value = {
    ...detalleAdmin.value,
    ...actualizado,
  };
}

async function onSubmitRegistrarPago(): Promise<void> {
  if (!detalleAdmin.value) return;

  const parsed = validarFormularioPago();
  if (!parsed) return;

  submittingPago.value = true;
  pagoFormError.value = null;

  try {
    await registrarPagoReserva({
      reservaId: detalleAdmin.value.reserva.id,
      monto: parsed.monto,
      metodoPago: metodoPagoInput.value,
      referencia: referenciaPagoInput.value.trim() || undefined,
    });

    detalleSuccess.value = 'Pago registrado correctamente.';
    cerrarModalRegistrarPago();
    await recargarDetalleFinancieroPagos();
  } catch (err: unknown) {
    const serviceErr =
      err instanceof FinancieroAdminError
        ? err
        : new FinancieroAdminError('No se pudo registrar el pago.');
    pagoFormError.value = mensajeErrorRegistrarPago(serviceErr);
  } finally {
    submittingPago.value = false;
  }
}

async function abrirModalDetalle(row: AdminReservaRow): Promise<void> {
  modalDetalle.value = true;
  detalleSuccess.value = null;
  loadingDetalle.value = true;
  detalleAdmin.value = {
    reserva: row,
    resumenPago: null,
    resumenPagoError: null,
    pagos: [],
    pagosError: null,
    facturas: [],
    facturasError: null,
  };

  const financiero = await cargarDetalleFinancieroReserva(row.id);
  detalleAdmin.value = {
    reserva: row,
    ...financiero,
  };
  loadingDetalle.value = false;
}

function cerrarModalGenerarFactura(): void {
  modalGenerarFactura.value = false;
  facturaFormError.value = null;
}

function abrirModalGenerarFactura(): void {
  if (!detalleAdmin.value || !detallePuedeGenerarFactura.value) return;

  const defaults = buildValoresPorDefectoFactura(
    detalleAdmin.value.reserva,
    detalleAdmin.value.pagos,
  );

  facturaRucInput.value = defaults.rucCliente;
  facturaRazonSocialInput.value = defaults.razonSocial;
  facturaDescripcionInput.value = defaults.descripcion;
  facturaCantidadInput.value = String(defaults.cantidad);
  facturaPrecioUnitInput.value = defaults.precioUnit > 0 ? String(defaults.precioUnit) : '';
  facturaPagoId.value = defaults.pagoId;
  facturaFormError.value = null;
  modalGenerarFactura.value = true;
}

function validarFormularioFactura(): {
  detalles: { descripcion: string; cantidad: number; precioUnit: number };
} | null {
  const descripcion = facturaDescripcionInput.value.trim();
  if (!descripcion) {
    facturaFormError.value = 'La descripción es obligatoria.';
    return null;
  }

  const cantidad = Number(String(facturaCantidadInput.value ?? '').trim());
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    facturaFormError.value = 'La cantidad debe ser mayor a 0.';
    return null;
  }

  const precioUnit = Number(String(facturaPrecioUnitInput.value ?? '').trim());
  if (!Number.isFinite(precioUnit) || precioUnit <= 0) {
    facturaFormError.value = 'El precio unitario debe ser mayor a 0.';
    return null;
  }

  return {
    detalles: { descripcion, cantidad, precioUnit },
  };
}

async function onConfirmarPagoEnDetalle(pagoId: string): Promise<void> {
  if (!detalleAdmin.value) return;

  confirmingPagoId.value = pagoId;

  try {
    await confirmarPago(pagoId);
    detalleSuccess.value = 'Pago confirmado correctamente.';

    const reserva = detalleAdmin.value.reserva;
    const actualizado = await recargarDetalleFinancieroCompleto(reserva.id);
    detalleAdmin.value = {
      reserva,
      ...actualizado,
    };
  } catch (err: unknown) {
    const serviceErr =
      err instanceof FinancieroAdminError
        ? err
        : new FinancieroAdminError('No se pudo confirmar el pago.');
    detalleSuccess.value = null;
    actionError.value = mensajeErrorConfirmarPago(serviceErr);
  } finally {
    confirmingPagoId.value = null;
  }
}

async function onSubmitGenerarFactura(): Promise<void> {
  if (!detalleAdmin.value || !detallePuedeGenerarFactura.value) return;

  const parsed = validarFormularioFactura();
  if (!parsed) return;

  submittingFactura.value = true;
  facturaFormError.value = null;

  try {
    await generarFacturaReserva({
      reservaId: detalleAdmin.value.reserva.id,
      pagoId: facturaPagoId.value,
      rucCliente: facturaRucInput.value.trim() || undefined,
      razonSocial: facturaRazonSocialInput.value.trim() || undefined,
      detalles: [parsed.detalles],
    });

    detalleSuccess.value = 'Factura generada correctamente.';
    cerrarModalGenerarFactura();

    const reserva = detalleAdmin.value.reserva;
    const actualizado = await recargarDetalleFinancieroCompleto(reserva.id);
    detalleAdmin.value = {
      reserva,
      ...actualizado,
    };
  } catch (err: unknown) {
    const serviceErr =
      err instanceof FinancieroAdminError
        ? err
        : new FinancieroAdminError('No se pudo generar la factura.');
    facturaFormError.value = mensajeErrorGenerarFactura(serviceErr);
  } finally {
    submittingFactura.value = false;
  }
}

function cerrarModalDetalle(): void {
  modalDetalle.value = false;
  cerrarModalRegistrarPago();
  cerrarModalGenerarFactura();
  detalleAdmin.value = null;
  detalleSuccess.value = null;
  loadingDetalle.value = false;
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

function abrirModalCancelar(row: AdminReservaRow): void {
  if (!puedeCancelar(row)) return;
  reservaSeleccionada.value = row;
  limpiarMensajes();
  modalCancelar.value = true;
}

function cerrarModalCancelar(): void {
  modalCancelar.value = false;
  if (!modalIniciar.value && !modalDevolucion.value) {
    reservaSeleccionada.value = null;
  }
}

async function onConfirmCancelarReserva(): Promise<void> {
  const row = reservaSeleccionada.value;
  if (!row || !puedeCancelar(row)) return;

  cancelingReservaId.value = row.id;
  limpiarMensajes();
  actionSuccess.value = null;

  try {
    await cancelarReserva(row.id);
    actionSuccess.value = 'Reserva cancelada correctamente.';
    cerrarModalCancelar();
    await fetchReservas();
  } catch (err: unknown) {
    const serviceErr =
      err instanceof ReservaServiceError
        ? err
        : new ReservaServiceError('No se pudo cancelar la reserva.');
    actionError.value = mensajeErrorCancelarReserva(serviceErr);
  } finally {
    cancelingReservaId.value = null;
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
            <td class="min-w-[140px] px-3 py-3">
              <div class="flex flex-col items-start gap-1.5">
                <button
                  type="button"
                  class="text-xs font-medium text-slate-600 underline decoration-slate-300 hover:text-brand-700 hover:decoration-brand-400"
                  @click="abrirModalDetalle(row)"
                >
                  Ver detalle
                </button>

                <button
                  v-if="puedeConfirmar(row)"
                  type="button"
                  class="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="confirmingReservaId === row.id || cancelingReservaId === row.id"
                  @click="onConfirmarReserva(row)"
                >
                  {{ confirmingReservaId === row.id ? 'Confirmando…' : 'Confirmar reserva' }}
                </button>

                <button
                  v-if="puedeCancelar(row)"
                  type="button"
                  class="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="cancelingReservaId === row.id || confirmingReservaId === row.id"
                  @click="abrirModalCancelar(row)"
                >
                  {{ cancelingReservaId === row.id ? 'Cancelando…' : 'Cancelar reserva' }}
                </button>

                <button
                  v-if="puedeIniciar(row)"
                  type="button"
                  class="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="startingReservaId === row.id"
                  @click="abrirModalIniciar(row)"
                >
                  Iniciar alquiler
                </button>

                <button
                  v-if="puedeDevolver(row)"
                  type="button"
                  class="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="returningReservaId === row.id"
                  @click="abrirModalDevolucion(row)"
                >
                  Registrar devolución
                </button>

                <span v-if="esActivaSinAlquiler(row)" class="text-xs text-amber-700">
                  Alquiler en curso
                </span>

                <span v-if="etiquetaEstadoFinal(row)" class="text-xs text-slate-500">
                  {{ etiquetaEstadoFinal(row) }}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AdminListCard>

  <!-- Modal cancelar reserva -->
  <Teleport to="body">
    <div
      v-if="modalCancelar"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-cancelar-title"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="modal-cancelar-title" class="text-lg font-semibold text-slate-900">
          Cancelar reserva
        </h2>
        <p v-if="reservaSeleccionada" class="mt-1 text-sm text-slate-600">
          Reserva {{ reservaSeleccionada.codigo }}
        </p>
        <p class="mt-4 text-sm text-slate-700">
          ¿Seguro que deseas cancelar esta reserva? Esta acción cambiará la reserva a CANCELADA.
        </p>

        <div class="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            :disabled="Boolean(cancelingReservaId)"
            @click="cerrarModalCancelar"
          >
            Volver
          </button>
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="Boolean(cancelingReservaId)"
            @click="onConfirmCancelarReserva"
          >
            {{ cancelingReservaId ? 'Cancelando…' : 'Sí, cancelar reserva' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

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

  <!-- Modal detalle reserva (solo lectura) -->
  <Teleport to="body">
    <div
      v-if="modalDetalle"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-detalle-title"
    >
      <div class="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
        <div class="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 id="modal-detalle-title" class="text-lg font-semibold text-slate-900">
              Detalle de reserva
            </h2>
            <p v-if="detalleAdmin" class="mt-0.5 font-mono text-sm text-slate-600">
              {{ detalleAdmin.reserva.codigo }}
            </p>
          </div>
          <button
            type="button"
            class="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Cerrar"
            @click="cerrarModalDetalle"
          >
            ✕
          </button>
        </div>

        <div class="overflow-y-auto px-6 py-4">
          <div v-if="loadingDetalle" class="flex items-center justify-center py-12 text-sm text-slate-500">
            Cargando detalle…
          </div>

          <template v-else-if="detalleAdmin">
            <!-- Información de reserva -->
            <section class="mb-6">
              <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Información de reserva
              </h3>
              <dl class="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt class="text-xs text-slate-500">Estado</dt>
                  <dd class="mt-0.5 font-medium text-slate-900">{{ detalleAdmin.reserva.estado }}</dd>
                </div>
                <div>
                  <dt class="text-xs text-slate-500">Total</dt>
                  <dd class="mt-0.5 font-medium text-slate-900">${{ detalleAdmin.reserva.total }}</dd>
                </div>
                <div class="sm:col-span-2">
                  <dt class="text-xs text-slate-500">Vehículo</dt>
                  <dd class="mt-0.5 text-slate-900">{{ detalleAdmin.reserva.vehiculo }}</dd>
                </div>
                <div class="sm:col-span-2">
                  <dt class="text-xs text-slate-500">Cliente</dt>
                  <dd class="mt-0.5 text-slate-900">{{ detalleAdmin.reserva.cliente }}</dd>
                </div>
                <div>
                  <dt class="text-xs text-slate-500">Fecha inicio</dt>
                  <dd class="mt-0.5 text-slate-900">{{ detalleAdmin.reserva.fechaInicio }}</dd>
                </div>
                <div>
                  <dt class="text-xs text-slate-500">Fecha fin</dt>
                  <dd class="mt-0.5 text-slate-900">{{ detalleAdmin.reserva.fechaFin }}</dd>
                </div>
              </dl>
            </section>

            <p
              v-if="detalleSuccess"
              class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
              role="status"
            >
              {{ detalleSuccess }}
            </p>

            <!-- Estado financiero -->
            <section class="mb-6">
              <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Estado financiero
                </h3>
                <button
                  v-if="detallePuedeRegistrarPago"
                  type="button"
                  class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  @click="abrirModalRegistrarPago"
                >
                  Registrar pago
                </button>
                <span
                  v-else-if="detalleTextoSinRegistrarPago"
                  class="text-xs font-medium text-slate-500"
                >
                  {{ detalleTextoSinRegistrarPago }}
                </span>
              </div>
              <dl
                v-if="detalleTotalesPago"
                class="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2"
              >
                <div>
                  <dt class="text-xs text-slate-500">Estado de pago</dt>
                  <dd class="mt-0.5 font-medium text-slate-900">
                    {{ detalleEtiquetaFinanciero }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs text-slate-500">Total reserva</dt>
                  <dd class="mt-0.5 font-medium text-slate-900">
                    ${{ detalleTotalesPago.totalReserva.toFixed(2) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs text-slate-500">Pagado confirmado</dt>
                  <dd class="mt-0.5 font-medium text-slate-900">
                    ${{ detalleTotalesPago.totalPagadoConfirmado.toFixed(2) }}
                  </dd>
                </div>
                <div v-if="detalleTotalesPago.totalPagadoPendiente > 0">
                  <dt class="text-xs text-slate-500">Pagado pendiente (sin confirmar)</dt>
                  <dd class="mt-0.5 text-amber-800">
                    ${{ detalleTotalesPago.totalPagadoPendiente.toFixed(2) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs text-slate-500">Saldo disponible para registrar</dt>
                  <dd class="mt-0.5 font-medium text-slate-900">
                    ${{ detalleTotalesPago.saldoDisponibleParaRegistrar.toFixed(2) }}
                  </dd>
                </div>
                <div v-if="detalleTotalesPago.saldoPendienteParaFacturar > 0">
                  <dt class="text-xs text-slate-500">Saldo pendiente de confirmación (factura)</dt>
                  <dd class="mt-0.5 text-slate-600">
                    ${{ detalleTotalesPago.saldoPendienteParaFacturar.toFixed(2) }}
                  </dd>
                </div>
              </dl>
              <p
                v-if="detalleAdmin.resumenPagoError"
                class="mt-2 text-xs text-slate-500"
              >
                Resumen booking no disponible.
              </p>
            </section>

            <!-- Pagos -->
            <section class="mb-6">
              <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Pagos
                </h3>
                <button
                  v-if="detallePuedeRegistrarPago"
                  type="button"
                  class="text-xs font-medium text-emerald-700 underline hover:text-emerald-900"
                  @click="abrirModalRegistrarPago"
                >
                  + Registrar pago
                </button>
              </div>
              <p
                v-if="detalleAdmin.pagosError"
                class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                role="alert"
              >
                {{ detalleAdmin.pagosError }}
              </p>
              <p v-else-if="detalleAdmin.pagos.length === 0" class="text-sm text-slate-500">
                Sin pagos registrados.
              </p>
              <ul v-else class="divide-y divide-slate-100 rounded-lg border border-slate-200">
                <li
                  v-for="pago in detalleAdmin.pagos"
                  :key="pago.id"
                  class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                >
                  <div>
                    <p class="font-medium text-slate-900">{{ pago.monto }}</p>
                    <p class="text-xs text-slate-500">
                      {{ pago.metodo }} · {{ pago.referencia }}
                    </p>
                  </div>
                  <div class="flex flex-col items-end gap-1.5 text-right text-xs text-slate-600">
                    <p>{{ pago.fecha }}</p>
                    <p class="font-medium text-slate-800">{{ pago.estado }}</p>
                    <button
                      v-if="esPagoEstadoPendiente(pago.estado)"
                      type="button"
                      class="rounded-md bg-sky-600 px-2 py-1 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                      :disabled="confirmingPagoId === pago.id"
                      @click="onConfirmarPagoEnDetalle(pago.id)"
                    >
                      {{ confirmingPagoId === pago.id ? 'Confirmando…' : 'Confirmar pago' }}
                    </button>
                  </div>
                </li>
              </ul>
            </section>

            <!-- Facturas -->
            <section>
              <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Facturas
                </h3>
                <button
                  v-if="detallePuedeGenerarFactura"
                  type="button"
                  class="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                  @click="abrirModalGenerarFactura"
                >
                  Generar factura
                </button>
                <span
                  v-else-if="detalleMensajeFactura && detalleEstadoFactura !== 'oculto-cancelada'"
                  class="text-xs font-medium text-slate-500"
                >
                  {{ detalleMensajeFactura }}
                </span>
              </div>
              <p
                v-if="detalleAdmin.facturasError"
                class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                role="alert"
              >
                {{ detalleAdmin.facturasError }}
              </p>
              <p v-else-if="detalleAdmin.facturas.length === 0" class="text-sm text-slate-500">
                Sin facturas emitidas.
              </p>
              <ul v-else class="divide-y divide-slate-100 rounded-lg border border-slate-200">
                <li
                  v-for="factura in detalleAdmin.facturas"
                  :key="factura.id"
                  class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                >
                  <div>
                    <p class="font-medium text-slate-900">{{ factura.numero }}</p>
                    <p class="text-xs text-slate-500">{{ factura.cliente }}</p>
                  </div>
                  <div class="text-right text-xs text-slate-600">
                    <p class="font-medium text-slate-900">{{ factura.total }}</p>
                    <p>{{ factura.fecha }} · {{ factura.estado }}</p>
                  </div>
                </li>
              </ul>
            </section>
          </template>
        </div>

        <div class="shrink-0 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            class="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
            @click="cerrarModalDetalle"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Modal registrar pago -->
  <Teleport to="body">
    <div
      v-if="modalRegistrarPago && detalleAdmin"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-pago-title"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="modal-pago-title" class="text-lg font-semibold text-slate-900">
          Registrar pago
        </h2>
        <p class="mt-1 text-sm text-slate-600">
          Reserva {{ detalleAdmin.reserva.codigo }}
        </p>
        <p
          v-if="detalleMontoPendiente !== null && detalleMontoPendiente > 0"
          class="mt-2 text-xs text-slate-500"
        >
          Saldo disponible para registrar:
          <span class="font-medium text-slate-800">${{ detalleMontoPendiente.toFixed(2) }}</span>
        </p>

        <form class="mt-4 space-y-4" @submit.prevent="onSubmitRegistrarPago">
          <div>
            <label for="pago-monto" class="block text-sm font-medium text-slate-700">
              Monto <span class="text-red-600">*</span>
            </label>
            <input
              id="pago-monto"
              v-model="montoPagoInput"
              type="number"
              min="0.01"
              step="0.01"
              required
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Ej. 72.00"
            />
          </div>

          <div>
            <label for="pago-metodo" class="block text-sm font-medium text-slate-700">
              Método de pago <span class="text-red-600">*</span>
            </label>
            <select
              id="pago-metodo"
              v-model="metodoPagoInput"
              required
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option v-for="metodo in METODOS_PAGO" :key="metodo" :value="metodo">
                {{ metodo }}
              </option>
            </select>
          </div>

          <div>
            <label for="pago-referencia" class="block text-sm font-medium text-slate-700">
              Referencia
            </label>
            <input
              id="pago-referencia"
              v-model="referenciaPagoInput"
              type="text"
              maxlength="100"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Opcional"
            />
          </div>

          <p v-if="pagoFormError" class="text-sm text-red-600" role="alert">{{ pagoFormError }}</p>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              :disabled="submittingPago"
              @click="cerrarModalRegistrarPago"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              :disabled="submittingPago"
            >
              {{ submittingPago ? 'Registrando…' : 'Registrar pago' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>

  <!-- Modal generar factura -->
  <Teleport to="body">
    <div
      v-if="modalGenerarFactura && detalleAdmin"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-factura-title"
    >
      <div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="modal-factura-title" class="text-lg font-semibold text-slate-900">
          Generar factura
        </h2>
        <p class="mt-1 text-sm text-slate-600">
          Reserva {{ detalleAdmin.reserva.codigo }}
        </p>

        <form class="mt-4 space-y-4" @submit.prevent="onSubmitGenerarFactura">
          <div>
            <label for="factura-ruc" class="block text-sm font-medium text-slate-700">
              RUC / identificación
            </label>
            <input
              id="factura-ruc"
              v-model="facturaRucInput"
              type="text"
              maxlength="13"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Opcional"
            />
          </div>

          <div>
            <label for="factura-razon" class="block text-sm font-medium text-slate-700">
              Razón social
            </label>
            <input
              id="factura-razon"
              v-model="facturaRazonSocialInput"
              type="text"
              maxlength="150"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Opcional"
            />
          </div>

          <div>
            <label for="factura-desc" class="block text-sm font-medium text-slate-700">
              Descripción <span class="text-red-600">*</span>
            </label>
            <textarea
              id="factura-desc"
              v-model="facturaDescripcionInput"
              rows="2"
              required
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="factura-cantidad" class="block text-sm font-medium text-slate-700">
                Cantidad <span class="text-red-600">*</span>
              </label>
              <input
                id="factura-cantidad"
                v-model="facturaCantidadInput"
                type="number"
                min="1"
                step="1"
                required
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label for="factura-precio" class="block text-sm font-medium text-slate-700">
                Precio unitario <span class="text-red-600">*</span>
              </label>
              <input
                id="factura-precio"
                v-model="facturaPrecioUnitInput"
                type="number"
                min="0.01"
                step="0.01"
                required
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <p v-if="facturaFormError" class="text-sm text-red-600" role="alert">
            {{ facturaFormError }}
          </p>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              :disabled="submittingFactura"
              @click="cerrarModalGenerarFactura"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
              :disabled="submittingFactura"
            >
              {{ submittingFactura ? 'Generando…' : 'Generar factura' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
