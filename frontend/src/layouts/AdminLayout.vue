<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const navItems = [
  { name: 'admin-dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'admin-vehiculos', label: 'Vehículos', icon: 'M8 17h8M6 11h12l-1-4H7l-1 4zm2-6h8a2 2 0 012 2v1H6V7a2 2 0 012-2z' },
  { name: 'admin-reservas', label: 'Reservas', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
] as const;

const pageTitle = computed(() => {
  const match = navItems.find((item) => item.name === route.name);
  return match?.label ?? 'Administración';
});

function logout(): void {
  authStore.clearSession();
  void router.push({ name: 'login' });
}
</script>

<template>
  <div class="flex min-h-screen bg-slate-100">
  <aside class="flex w-64 flex-col border-r border-slate-200 bg-slate-900 text-slate-100">
    <div class="border-b border-slate-700 px-5 py-5">
      <p class="text-xs font-semibold uppercase tracking-wider text-brand-300">Urban Car</p>
      <h1 class="text-lg font-bold">Panel Admin</h1>
    </div>

    <nav class="flex-1 space-y-1 p-3">
      <RouterLink
        v-for="item in navItems"
        :key="item.name"
        :to="{ name: item.name }"
        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
        active-class="!bg-brand-600 !text-white"
      >
        <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="item.icon" />
        </svg>
        {{ item.label }}
      </RouterLink>
    </nav>

    <div class="space-y-1 border-t border-slate-700 p-3">
      <RouterLink
        :to="{ name: 'marketplace' }"
        class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
      >
        ← Volver al catálogo
      </RouterLink>
      <button
        type="button"
        class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
        @click="logout"
      >
        Cerrar sesión
      </button>
    </div>
  </aside>

  <div class="flex min-w-0 flex-1 flex-col">
    <header class="border-b border-slate-200 bg-white px-6 py-4">
      <h2 class="text-xl font-semibold text-slate-900">{{ pageTitle }}</h2>
    </header>
    <main class="flex-1 overflow-auto p-6">
      <RouterView />
    </main>
  </div>
  </div>
</template>
