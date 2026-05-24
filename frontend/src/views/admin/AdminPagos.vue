<script setup lang="ts">
import { onMounted } from 'vue';
import AdminListCard from '@/components/admin/AdminListCard.vue';
import { useAdminFinanciero } from '@/composables/useAdminFinanciero';

const PAGO_HEADERS = [
  { key: 'referencia', label: 'Referencia' },
  { key: 'reserva', label: 'Reserva' },
  { key: 'monto', label: 'Monto' },
  { key: 'metodo', label: 'Método' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'estado', label: 'Estado' },
] as const;

const { pagos, loadingPagos, errorPagos, fetchPagos } = useAdminFinanciero();

onMounted(() => {
  void fetchPagos();
});
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
    <div class="min-w-[640px] overflow-x-auto">
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
          </tr>
        </tbody>
      </table>
    </div>
  </AdminListCard>
</template>
