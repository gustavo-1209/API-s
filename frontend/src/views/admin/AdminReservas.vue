<script setup lang="ts">
import { onMounted } from 'vue';
import AdminListCard from '@/components/admin/AdminListCard.vue';
import { useAdminReservas } from '@/composables/useAdminReservas';

const { reservas, loading, error, fetchReservas } = useAdminReservas();

onMounted(() => {
  void fetchReservas();
});
</script>

<template>
  <AdminListCard
    title="Reservas"
    description="Listado de reservas del Admin Gateway (solo lectura)."
    :loading="loading"
    :error="error"
    :empty="!loading && !error && reservas.length === 0"
    empty-message="No hay reservas registradas."
    @retry="fetchReservas()"
  >
    <div class="min-w-[800px] overflow-x-auto">
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
          </tr>
        </tbody>
      </table>
    </div>
  </AdminListCard>
</template>
