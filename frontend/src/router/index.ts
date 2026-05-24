import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/ClienteLayout.vue'),
      children: [
        {
          path: '',
          name: 'marketplace',
          alias: '/marketplace',
          component: () => import('@/views/Marketplace.vue'),
          meta: { public: true },
        },
        {
          path: 'reserva/:vehiculoId',
          name: 'reserva',
          component: () => import('@/views/ReservaView.vue'),
          props: true,
          meta: { requiresAuth: true },
        },
        {
          path: 'no-autorizado',
          name: 'no-autorizado',
          alias: '/unauthorized',
          component: () => import('@/views/UnauthorizedView.vue'),
          meta: { public: true },
        },
      ],
    },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, role: 'ADMIN' },
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: () => import('@/views/admin/AdminDashboard.vue'),
        },
        {
          path: 'vehiculos',
          name: 'admin-vehiculos',
          component: () => import('@/views/admin/AdminVehiculos.vue'),
        },
        {
          path: 'reservas',
          name: 'admin-reservas',
          component: () => import('@/views/admin/AdminReservas.vue'),
        },
        {
          path: 'pagos',
          name: 'admin-pagos',
          component: () => import('@/views/admin/AdminPagos.vue'),
        },
        {
          path: 'facturas',
          name: 'admin-facturas',
          component: () => import('@/views/admin/AdminFacturas.vue'),
        },
        {
          path: 'mantenimientos',
          name: 'admin-mantenimientos',
          component: () => import('@/views/admin/AdminMantenimientos.vue'),
        },
        {
          path: 'kardex',
          name: 'admin-kardex',
          component: () => import('@/views/admin/AdminKardex.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'marketplace' },
    },
  ],
});

export default router;
