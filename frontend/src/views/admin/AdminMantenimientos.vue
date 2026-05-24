<script setup lang="ts">
import { onMounted } from 'vue';
import AdminListCard from '@/components/admin/AdminListCard.vue';
import { useAdminMantenimientos } from '@/composables/useAdminMantenimientos';

const MANT_HEADERS = [
  { key: 'vehiculo', label: 'Vehículo' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'fechaInicio', label: 'Inicio' },
  { key: 'fechaFin', label: 'Fin' },
  { key: 'costo', label: 'Costo' },
  { key: 'estado', label: 'Estado' },
] as const;

const { mantenimientos, loadingMantenimientos, errorMantenimientos, fetchMantenimientos } =
  useAdminMantenimientos();

onMounted(() => {
  void fetchMantenimientos();
});
</script>

<template>
  <AdminListCard
    title="Mantenimientos"
    description="Historial de mantenimientos del Admin Gateway."
    :loading="loadingMantenimientos"
    :error="errorMantenimientos"
    :empty="!loadingMantenimientos && !errorMantenimientos && mantenimientos.length === 0"
    empty-message="No hay mantenimientos registrados."
  >
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50">
          <tr>
            <th
              v-for="col in MANT_HEADERS"
              :key="col.key"
              class="px-3 py-2 text-left font-medium text-slate-600"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="row in mantenimientos" :key="row.id" class="hover:bg-slate-50">
            <td
              v-for="col in MANT_HEADERS"
              :key="col.key"
              class="max-w-[180px] truncate px-3 py-3 text-slate-800"
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
