<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const isLoggedIn = computed(() => authStore.isAuthenticated);
const isAdmin = computed(() => authStore.userRole === 'ADMIN');

function logout(): void {
  authStore.clearSession();
  void router.push({ name: 'login' });
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-50">
    <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <RouterLink :to="{ name: 'marketplace' }" class="flex items-center gap-2">
          <span class="text-lg font-bold text-brand-700">Urban Car</span>
        </RouterLink>

        <div class="flex items-center gap-1 sm:gap-4">
          <RouterLink
            :to="{ name: 'marketplace' }"
            class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            active-class="!text-brand-700 !bg-brand-50"
          >
            Catálogo
          </RouterLink>

          <RouterLink
            v-if="isAdmin"
            :to="{ name: 'admin-dashboard' }"
            class="rounded-lg px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
          >
            Panel admin
          </RouterLink>

          <RouterLink
            v-if="!isLoggedIn"
            :to="{ name: 'login' }"
            class="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Iniciar sesión
          </RouterLink>

          <button
            v-else
            type="button"
            class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            @click="logout"
          >
            Salir
          </button>
        </div>
      </nav>
    </header>

    <main class="flex-1">
      <RouterView />
    </main>
  </div>
</template>
