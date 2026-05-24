<script setup lang="ts">
import { onMounted } from 'vue';
import AdminListCard from '@/components/admin/AdminListCard.vue';
import { useAdminMantenimientos } from '@/composables/useAdminMantenimientos';

const KARDEX_HEADERS = [
  { key: 'vehiculo', label: 'Vehículo' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'kilometraje', label: 'Kilometraje' },
  { key: 'referencia', label: 'Referencia' },
] as const;

const { kardex, loadingKardex, errorKardex, fetchKardex } = useAdminMantenimientos();

onMounted(() => {
  void fetchKardex();
});
</script>

<template>
  <AdminListCard
    title="Kardex"
    description="Movimientos de kardex vehicular."
    :loading="loadingKardex"
    :error="errorKardex"
    :empty="!loadingKardex && !errorKardex && kardex.length === 0"
    empty-message="No hay movimientos en el kardex."
  >
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50">
          <tr>
            <th
              v-for="col in KARDEX_HEADERS"
              :key="col.key"
              class="px-3 py-2 text-left font-medium text-slate-600"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="row in kardex" :key="row.id" class="hover:bg-slate-50">
            <td
              v-for="col in KARDEX_HEADERS"
              :key="col.key"
              class="max-w-[180px] truncate px-3 py-3 text-slate-800"
              :class="col.key === 'kilometraje' && row.kilometraje === 'No registrado' ? 'text-slate-400' : ''"
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
