<script setup lang="ts">
import { onMounted, ref } from 'vue';
import AdminListCard from '@/components/admin/AdminListCard.vue';
import { useAdminFinanciero } from '@/composables/useAdminFinanciero';
import {
  confirmarPago,
  esPagoEstadoPendiente,
  FinancieroAdminError,
  mensajeErrorConfirmarPago,
} from '@/composables/useAdminReservaFinanciero';

const PAGO_HEADERS = [
  { key: 'referencia', label: 'Referencia' },
  { key: 'reserva', label: 'Reserva' },
  { key: 'monto', label: 'Monto' },
  { key: 'metodo', label: 'Método' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'estado', label: 'Estado' },
] as const;

const { pagos, loadingPagos, errorPagos, fetchPagos } = useAdminFinanciero();

const confirmingPagoId = ref<string | null>(null);
const actionSuccess = ref<string | null>(null);
const actionError = ref<string | null>(null);

onMounted(() => {
  void fetchPagos();
});

async function onConfirmarPago(pagoId: string): Promise<void> {
  confirmingPagoId.value = pagoId;
  actionError.value = null;
  actionSuccess.value = null;

  try {
    await confirmarPago(pagoId);
    actionSuccess.value = 'Pago confirmado correctamente.';
    await fetchPagos();
  } catch (err: unknown) {
    const serviceErr =
      err instanceof FinancieroAdminError
        ? err
        : new FinancieroAdminError('No se pudo confirmar el pago.');
    actionError.value = mensajeErrorConfirmarPago(serviceErr);
  } finally {
    confirmingPagoId.value = null;
  }
}
</script>

<template>
  <AdminListCard
    title="Pagos"
    description="Pagos registrados en el Admin Gateway."
    :loading="loadingPagos"
    :error="errorPagos"
    :empty="!loadingPagos && !errorPagos && pagos.length === 0"
    empty-message="No hay pagos registrados."
    @retry="fetchPagos()"
  >
    <p
      v-if="actionSuccess"
      class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
      role="status"
    >
      {{ actionSuccess }}
    </p>

    <p
      v-if="actionError"
      class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      role="alert"
    >
      {{ actionError }}
    </p>

    <div class="min-w-[720px] overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50">
          <tr>
            <th
              v-for="col in PAGO_HEADERS"
              :key="col.key"
              class="px-3 py-2 text-left font-medium text-slate-600"
            >
              {{ col.label }}
            </th>
            <th class="px-3 py-2 text-left font-medium text-slate-600">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="row in pagos" :key="row.id" class="hover:bg-slate-50">
            <td
              v-for="col in PAGO_HEADERS"
              :key="col.key"
              class="max-w-[160px] truncate px-3 py-3 text-slate-800"
              :title="row[col.key]"
            >
              {{ row[col.key] }}
            </td>
            <td class="px-3 py-3">
              <button
                v-if="esPagoEstadoPendiente(row.estado)"
                type="button"
                class="rounded-md bg-sky-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                :disabled="confirmingPagoId === row.id"
                @click="onConfirmarPago(row.id)"
              >
                {{ confirmingPagoId === row.id ? 'Confirmando…' : 'Confirmar' }}
              </button>
              <span v-else class="text-xs text-slate-400">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AdminListCard>
</template>
