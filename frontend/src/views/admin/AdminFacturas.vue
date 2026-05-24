<script setup lang="ts">
import { onMounted } from 'vue';
import AdminListCard from '@/components/admin/AdminListCard.vue';
import { useAdminFinanciero } from '@/composables/useAdminFinanciero';

const FACTURA_HEADERS = [
  { key: 'numero', label: 'Número' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'reserva', label: 'Reserva' },
  { key: 'subtotal', label: 'Subtotal' },
  { key: 'total', label: 'Total' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'estado', label: 'Estado' },
] as const;

const { facturas, loadingFacturas, errorFacturas, fetchFacturas } = useAdminFinanciero();

onMounted(() => {
  void fetchFacturas();
});
</script>

<template>
  <AdminListCard
    title="Facturas"
    description="Facturas emitidas en el Admin Gateway."
    :loading="loadingFacturas"
    :error="errorFacturas"
    :empty="!loadingFacturas && !errorFacturas && facturas.length === 0"
    empty-message="No hay facturas registradas."
    @retry="fetchFacturas()"
  >
    <div class="min-w-[720px] overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50">
          <tr>
            <th
              v-for="col in FACTURA_HEADERS"
              :key="col.key"
              class="px-3 py-2 text-left font-medium text-slate-600"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="row in facturas" :key="row.id" class="hover:bg-slate-50">
            <td v-for="col in FACTURA_HEADERS" :key="col.key" class="px-3 py-3 text-slate-800">
              {{ row[col.key] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AdminListCard>
</template>
