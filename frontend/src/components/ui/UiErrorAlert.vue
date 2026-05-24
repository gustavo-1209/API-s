<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    message: string;
    showRetry?: boolean;
  }>(),
  { showRetry: true },
);

defineEmits<{
  retry: [];
}>();
</script>

<template>
  <div class="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-center" role="alert">
    <p class="font-semibold text-red-800">{{ title ?? 'No se pudo completar la operación' }}</p>
    <p class="mt-1 text-sm text-red-700">{{ message }}</p>
    <button
      v-if="showRetry"
      type="button"
      class="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
      @click="$emit('retry')"
    >
      Reintentar
    </button>
    <slot />
  </div>
</template>
