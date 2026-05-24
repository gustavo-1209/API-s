<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    size?: 'sm' | 'md' | 'lg';
  }>(),
  {
    label: 'Cargando…',
    size: 'md',
  },
);

const sizeClass = {
  sm: 'h-8 w-8 border-2',
  md: 'h-12 w-12 border-4',
  lg: 'h-14 w-14 border-4',
} as const;
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-3 py-8"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div
      :class="[
        'animate-spin rounded-full border-brand-100 border-t-brand-600',
        sizeClass[size],
      ]"
    />
    <p v-if="label" class="text-sm text-slate-600">{{ label }}</p>
  </div>
</template>
