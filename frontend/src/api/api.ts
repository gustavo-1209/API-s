import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { Router } from 'vue-router';
import { getToken } from '@/lib/auth-storage';
import { useAuthStore } from '@/stores/auth';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15_000,
});

/** Alias para compatibilidad con imports existentes. */
export const apiClient = api;

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes('/auth/login') || url.includes('/auth/register');
}

export function setupApiInterceptors(router: Router): void {
  api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const status = error.response?.status;
      const requestUrl = error.config?.url;

      if ((status === 401 || status === 403) && !isAuthEndpoint(requestUrl)) {
        const authStore = useAuthStore();
        authStore.clearSession();

        if (router.currentRoute.value.path !== '/login') {
          void router.push('/login');
        }
      }

      return Promise.reject(error);
    },
  );
}
