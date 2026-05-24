<script setup lang="ts">
import { onMounted } from 'vue';
import AdminListCard from '@/components/admin/AdminListCard.vue';
import { useAdminVehiculos } from '@/composables/useAdminVehiculos';

const { vehiculos, loading, error, fetchVehiculos } = useAdminVehiculos();

onMounted(() => {
  void fetchVehiculos();
});
</script>

<template>
  <AdminListCard
    title="Vehículos"
    description="Inventario del Admin Gateway (solo lectura)."
    :loading="loading"
    :error="error"
    :empty="!loading && !error && vehiculos.length === 0"
    empty-message="No hay vehículos registrados."
  >
    <div class="overflow-x-auto">
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
                class="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
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
