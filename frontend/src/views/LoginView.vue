<script setup lang="ts">
import { isAxiosError } from 'axios';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/api/api';
import { useAuthStore } from '@/stores/auth';
import type { ApiResponse, LoginPayload, LoginResponseData } from '@/types/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref<string | null>(null);

async function onSubmit(): Promise<void> {
  loading.value = true;
  error.value = null;

  try {
    const payload: LoginPayload = {
      email: email.value.trim(),
      password: password.value,
    };

    const { data } = await api.post<ApiResponse<LoginResponseData>>('/auth/login', payload);
    authStore.setSession(data.data.token, data.data.user);
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null;
    if (redirect) {
      await router.push(redirect);
      return;
    }
    await router.push(
      authStore.userRole === 'ADMIN' ? { name: 'admin-dashboard' } : { name: 'marketplace' },
    );
  } catch (err: unknown) {
    if (isAxiosError(err) && err.response?.status === 401) {
      error.value = 'Credenciales incorrectas. Verifica tu email y contraseña.';
    } else {
      error.value = 'No se pudo iniciar sesión. Intenta de nuevo.';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
    <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p class="text-sm font-medium uppercase tracking-wider text-brand-600">Urban Car</p>
      <h1 class="mt-1 text-2xl font-bold text-slate-900">Iniciar sesión</h1>
      <p class="mt-1 text-sm text-slate-600">Accede a tu cuenta para continuar.</p>

      <form class="mt-8 space-y-5" @submit.prevent="onSubmit">
        <div>
          <label for="email" class="block text-sm font-medium text-slate-700">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-slate-700">Contraseña</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <p v-if="error" class="text-sm text-red-600" role="alert">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ loading ? 'Ingresando…' : 'Entrar' }}
        </button>
      </form>
    </div>
  </div>
</template>
