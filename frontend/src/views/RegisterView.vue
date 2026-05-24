<script setup lang="ts">
import { isAxiosError } from 'axios';
import { computed, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { clientApi } from '@/api/api';
import { useAuthStore } from '@/stores/auth';
import {
  normalizeAuthResponse,
  type AuthApiResponse,
  type RegisterPayload,
} from '@/types/auth';

const router = useRouter();
const authStore = useAuthStore();

const nombres = ref('');
const apellidos = ref('');
const email = ref('');
const telefono = ref('');
const password = ref('');
const confirmarPassword = ref('');

const loading = ref(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const passwordsMatch = computed(
  () => !confirmarPassword.value || password.value === confirmarPassword.value,
);

const formValido = computed(
  () =>
    nombres.value.trim().length > 0 &&
    apellidos.value.trim().length > 0 &&
    email.value.trim().length > 0 &&
    telefono.value.trim().length > 0 &&
    password.value.length >= 8 &&
    passwordsMatch.value,
);

function registerErrorMessage(err: unknown): string {
  if (!isAxiosError(err)) {
    return 'No se pudo completar el registro. Intenta de nuevo.';
  }

  const status = err.response?.status;
  const data = err.response?.data as { message?: string; error?: { message?: string } } | undefined;
  const backendMsg = data?.error?.message ?? data?.message;

  if (status === 409) {
    return backendMsg ?? 'Ya existe una cuenta con este correo electrónico.';
  }
  if (status === 400) {
    return backendMsg ?? 'Revisa los datos ingresados e intenta de nuevo.';
  }
  if (!err.response) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión.';
  }

  return backendMsg ?? 'No se pudo completar el registro. Intenta de nuevo.';
}

async function onSubmit(): Promise<void> {
  error.value = null;
  successMessage.value = null;

  if (!formValido.value) {
    if (password.value.length < 8) {
      error.value = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }
    if (!passwordsMatch.value) {
      error.value = 'Las contraseñas no coinciden.';
      return;
    }
    error.value = 'Completa todos los campos obligatorios.';
    return;
  }

  const payload: RegisterPayload = {
    email: email.value.trim(),
    password: password.value,
    nombres: nombres.value.trim(),
    apellidos: apellidos.value.trim(),
    telefono: telefono.value.trim(),
  };

  loading.value = true;

  try {
    const { data } = await clientApi.post<AuthApiResponse>('/auth/register', payload);
    const { token, user } = normalizeAuthResponse(data);

    authStore.setSession(token, {
      ...user,
      role: 'CLIENTE',
      nombres: user.nombres ?? payload.nombres,
      apellidos: user.apellidos ?? payload.apellidos,
    });

    successMessage.value = '¡Cuenta creada! Redirigiendo al catálogo…';

    await router.push({ name: 'marketplace' });
  } catch (err: unknown) {
    error.value = registerErrorMessage(err);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
    <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p class="text-sm font-medium uppercase tracking-wider text-brand-600">RentWheels</p>
      <h1 class="mt-1 text-2xl font-bold text-slate-900">Crear cuenta</h1>
      <p class="mt-1 text-sm text-slate-600">Regístrate para reservar vehículos en el catálogo.</p>

      <form class="mt-8 space-y-4" @submit.prevent="onSubmit">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="nombres" class="block text-sm font-medium text-slate-700">Nombres</label>
            <input
              id="nombres"
              v-model="nombres"
              type="text"
              required
              autocomplete="given-name"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div>
            <label for="apellidos" class="block text-sm font-medium text-slate-700">Apellidos</label>
            <input
              id="apellidos"
              v-model="apellidos"
              type="text"
              required
              autocomplete="family-name"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

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
          <label for="telefono" class="block text-sm font-medium text-slate-700">Teléfono</label>
          <input
            id="telefono"
            v-model="telefono"
            type="tel"
            required
            autocomplete="tel"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            placeholder="0999999999"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-slate-700">Contraseña</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <p class="mt-1 text-xs text-slate-500">Mínimo 8 caracteres.</p>
        </div>

        <div>
          <label for="confirmar-password" class="block text-sm font-medium text-slate-700">
            Confirmar contraseña
          </label>
          <input
            id="confirmar-password"
            v-model="confirmarPassword"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <p v-if="confirmarPassword && !passwordsMatch" class="mt-1 text-xs text-red-600">
            Las contraseñas no coinciden.
          </p>
        </div>

        <p v-if="error" class="text-sm text-red-600" role="alert">{{ error }}</p>
        <p v-if="successMessage" class="text-sm text-emerald-700" role="status">{{ successMessage }}</p>

        <button
          type="submit"
          :disabled="loading || !formValido"
          class="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ loading ? 'Creando cuenta…' : 'Registrarme' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-slate-600">
        ¿Ya tienes cuenta?
        <RouterLink :to="{ name: 'login' }" class="font-semibold text-brand-600 hover:text-brand-700">
          Iniciar sesión
        </RouterLink>
      </p>
    </div>
  </div>
</template>
