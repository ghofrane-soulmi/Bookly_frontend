export const routes = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/',
    component: () => import('@/layouts/default.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        component: () => import('@/pages/dashboard.vue'),
      },
      {
        path: 'services',
        component: () => import('@/pages/services.vue'),
      },
      {
        path: 'services/add',
        component: () => import('@/pages/service-add.vue'),
      },
      {
        path: 'services/:id/edit',
        component: () => import('@/pages/service-add.vue'),
      },
      {
        path: 'clients',
        component: () => import('@/pages/clients.vue'),
      },
      {
        path: 'clients/add',
        component: () => import('@/pages/client-add.vue'),
      },
      {
        path: 'clients/:id/edit',
        component: () => import('@/pages/client-add.vue'),
      },
      {
        path: 'clients/:id',
        component: () => import('@/pages/client-detail.vue'),
      },
      {
        path: 'appointments',
        component: () => import('@/pages/appointments.vue'),
      },
      {
        path: 'appointments/add',
        component: () => import('@/pages/appointment-add.vue'),
      },
      {
        path: 'appointments/:id/edit',
        component: () => import('@/pages/appointment-add.vue'),
      },
      {
        path: 'calendar',
        component: () => import('@/pages/calendar.vue'),
      },
      {
        path: 'staff',
        component: () => import('@/pages/staff.vue'),
      },
      {
        path: 'staff/add',
        component: () => import('@/pages/staff-add.vue'),
      },
      {
        path: 'staff/:id/edit',
        component: () => import('@/pages/staff-add.vue'),
      },
      {
        path: 'roles',
        component: () => import('@/pages/roles.vue'),
      },
      {
        path: 'roles/add',
        component: () => import('@/pages/role-add.vue'),
      },
      {
        path: 'roles/:id/edit',
        component: () => import('@/pages/role-add.vue'),
      },
      {
        path: 'permissions',
        component: () => import('@/pages/permissions.vue'),
      },
      {
        path: 'invoices',
        component: () => import('@/pages/invoices.vue'),
      },
      {
        path: 'invoices/add',
        component: () => import('@/pages/invoice-add.vue'),
      },
      {
        path: 'invoices/:id/edit',
        component: () => import('@/pages/invoice-add.vue'),
      },
      {
        path: 'invoices/:id/preview',
        component: () => import('@/pages/invoice-preview.vue'),
      },
      {
        path: 'account-settings',
        component: () => import('@/pages/account-settings.vue'),
      },
    ],
  },
  {
    path: '/',
    component: () => import('@/layouts/blank.vue'),
    children: [
      {
        path: 'login',
        component: () => import('@/pages/login.vue'),
      },
      {
        path: 'register',
        component: () => import('@/pages/register.vue'),
      },
      {
        path: 'forgot-password',
        component: () => import('@/pages/forgot-password.vue'),
      },
      {
        path: 'reset-password',
        component: () => import('@/pages/reset-password.vue'),
      },
      {
        path: '/:pathMatch(.*)*',
        component: () => import('@/pages/[...error].vue'),
      },
    ],
  },
]
