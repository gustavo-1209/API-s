<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h3 class="text-lg font-semibold text-slate-900">Bienvenido, administrador</h3>
    <p class="mt-2 text-slate-600">
      Sesión activa como
      <span class="font-medium text-slate-900">{{ authStore.user?.email ?? '—' }}</span>
    </p>
    <p class="mt-4 text-sm text-slate-500">
      Usa el menú lateral para gestionar el inventario de vehículos y las reservas.
    </p>
  </div>
</template>
