<script setup lang="ts">
import { isAxiosError } from 'axios';
import { ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { loginWithAdminOrClient } from '@/lib/auth-login';
import { useAuthStore } from '@/stores/auth';
import type { LoginPayload } from '@/types/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref<string | null>(null);

function loginErrorMessage(err: unknown): string {
  if (!isAxiosError(err)) {
    return 'No se pudo iniciar sesión. Intenta de nuevo.';
  }

  const status = err.response?.status;
  const data = err.response?.data as { message?: string; error?: { message?: string } } | undefined;
  const backendMsg = data?.error?.message ?? data?.message;

  if (status === 401) {
    return backendMsg ?? 'Credenciales incorrectas. Verifica tu email y contraseña.';
  }
  if (status === 403) {
    return backendMsg ?? 'Tu usuario no tiene permisos para acceder.';
  }
  if (!err.response) {
    return 'No se pudo conectar con el servidor de autenticación.';
  }

  return backendMsg ?? 'No se pudo iniciar sesión. Intenta de nuevo.';
}

async function onSubmit(): Promise<void> {
  loading.value = true;
  error.value = null;

  try {
    const payload: LoginPayload = {
      email: email.value.trim(),
      password: password.value,
    };

    const { token, user } = await loginWithAdminOrClient(payload);
    authStore.setSession(token, user);

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null;
    if (redirect) {
      await router.push(redirect);
      return;
    }
    await router.push(
      authStore.userRole === 'ADMIN' ? { name: 'admin-dashboard' } : { name: 'marketplace' },
    );
  } catch (err: unknown) {
    error.value = loginErrorMessage(err);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
    <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p class="text-sm font-medium uppercase tracking-wider text-brand-600">RentWheels</p>
      <h1 class="mt-1 text-2xl font-bold text-slate-900">Iniciar sesión</h1>
      <p class="mt-1 text-sm text-slate-600">
        Accede con tu cuenta de cliente o administrador.
      </p>

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

      <p class="mt-6 text-center text-sm text-slate-600">
        ¿No tienes cuenta?
        <RouterLink
          :to="{ name: 'register' }"
          class="font-semibold text-brand-600 hover:text-brand-700"
        >
          Crear cuenta
        </RouterLink>
      </p>
    </div>
  </div>
</template>
