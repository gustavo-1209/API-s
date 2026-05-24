<script setup lang="ts">
defineProps<{
  title: string;
  message?: string;
}>();
</script>

<template>
  <div
    class="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-12 text-center"
  >
    <div
      class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm"
    >
      <svg
        class="h-7 w-7 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
    </div>
    <h3 class="text-base font-semibold text-slate-900">{{ title }}</h3>
    <p v-if="message" class="mx-auto mt-2 max-w-sm text-sm text-slate-600">{{ message }}</p>
    <slot />
  </div>
</template>
