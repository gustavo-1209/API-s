import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { Router } from 'vue-router';
import { getToken } from '@/lib/auth-storage';
import { useAuthStore } from '@/stores/auth';

const defaultHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

const requestTimeoutMs = 15_000;

export const adminApi: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_ADMIN_API_BASE_URL,
  headers: defaultHeaders,
  timeout: requestTimeoutMs,
});

export const bookingApi: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BOOKING_API_BASE_URL,
  headers: defaultHeaders,
  timeout: requestTimeoutMs,
});

/** Compatibilidad temporal — usar `adminApi` (admin) y `bookingApi` (marketplace/reservas). */
export const api = bookingApi;
/** @see api */
export const apiClient = bookingApi;

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes('/auth/login') || url.includes('/auth/register');
}

function attachBearerToken(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

function attachUnauthorizedHandler(instance: AxiosInstance, router: Router): void {
  instance.interceptors.response.use(
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

export function setupApiInterceptors(router: Router): void {
  adminApi.interceptors.request.use(attachBearerToken);
  bookingApi.interceptors.request.use(attachBearerToken);

  attachUnauthorizedHandler(adminApi, router);
  attachUnauthorizedHandler(bookingApi, router);
}
