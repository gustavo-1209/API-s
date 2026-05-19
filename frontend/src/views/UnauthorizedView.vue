<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
    <div class="rounded-full bg-amber-100 p-4">
      <svg class="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        />
      </svg>
    </div>
    <h1 class="mt-6 text-2xl font-bold text-slate-900">No autorizado</h1>
    <p class="mt-2 max-w-md text-slate-600">
      No tienes permisos para acceder al panel de administración. Si crees que es un error,
      contacta al soporte.
    </p>
    <div class="mt-8 flex flex-wrap justify-center gap-3">
      <RouterLink
        :to="{ name: 'marketplace' }"
        class="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Ir al catálogo
      </RouterLink>
      <RouterLink
        :to="{ name: 'login' }"
        class="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Cambiar cuenta
      </RouterLink>
    </div>
  </div>
</template>
