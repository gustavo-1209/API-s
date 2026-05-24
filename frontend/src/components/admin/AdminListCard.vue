<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyMessage?: string;
}>();
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div class="border-b border-slate-100 px-6 py-4">
      <h3 class="text-lg font-semibold text-slate-900">{{ title }}</h3>
      <p v-if="description" class="mt-1 text-sm text-slate-500">{{ description }}</p>
    </div>

    <div class="p-6">
      <p v-if="loading" class="text-sm text-slate-500">Cargando datos…</p>

      <p
        v-else-if="error"
        class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        role="alert"
      >
        {{ error }}
      </p>

      <p v-else-if="empty" class="text-sm text-slate-500">
        {{ emptyMessage ?? 'No hay registros para mostrar.' }}
      </p>

      <slot v-else />
    </div>
  </div>
</template>
