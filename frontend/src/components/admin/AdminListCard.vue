<script setup lang="ts">
import UiEmptyState from '@/components/ui/UiEmptyState.vue';
import UiErrorAlert from '@/components/ui/UiErrorAlert.vue';
import UiSpinner from '@/components/ui/UiSpinner.vue';

defineProps<{
  title: string;
  description?: string;
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyMessage?: string;
  loadingLabel?: string;
}>();

defineEmits<{
  retry: [];
}>();
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div class="border-b border-slate-100 px-4 py-4 sm:px-6">
      <h3 class="text-lg font-semibold text-slate-900">{{ title }}</h3>
      <p v-if="description" class="mt-1 text-sm text-slate-500">{{ description }}</p>
    </div>

    <div class="p-4 sm:p-6">
      <UiSpinner v-if="loading" :label="loadingLabel ?? 'Cargando datos…'" />

      <UiErrorAlert
        v-else-if="error"
        :message="error"
        @retry="$emit('retry')"
      />

      <UiEmptyState
        v-else-if="empty"
        title="Sin registros"
        :message="emptyMessage ?? 'No hay registros para mostrar.'"
      />

      <div v-else class="-mx-4 overflow-x-auto sm:mx-0">
        <slot />
      </div>
    </div>
  </div>
</template>
