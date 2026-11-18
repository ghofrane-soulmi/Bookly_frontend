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
        meta: { permission: 'dashboard.view' },
      },
      {
        path: 'services',
        component: () => import('@/pages/services.vue'),
        meta: { permission: 'services.view' },
      },
      {
        path: 'services/add',
        component: () => import('@/pages/service-add.vue'),
        meta: { permission: 'services.manage' },
      },
      {
        path: 'services/:id/edit',
        component: () => import('@/pages/service-add.vue'),
        meta: { permission: 'services.manage' },
      },
      {
        path: 'clients',
        component: () => import('@/pages/clients.vue'),
        meta: { permission: 'clients.view' },
      },
      {
        path: 'clients/add',
        component: () => import('@/pages/client-add.vue'),
        meta: { permission: 'clients.manage' },
      },
      {
        path: 'clients/:id/edit',
        component: () => import('@/pages/client-add.vue'),
        meta: { permission: 'clients.manage' },
      },
      {
        path: 'clients/:id',
        component: () => import('@/pages/client-detail.vue'),
        meta: { permission: 'clients.view' },
      },
      {
        path: 'appointments',
        component: () => import('@/pages/appointments.vue'),
        meta: { permission: 'appointments.view' },
      },
      {
        path: 'appointments/add',
        component: () => import('@/pages/appointment-add.vue'),
        meta: { permission: 'appointments.manage' },
      },
      {
        path: 'appointments/:id/edit',
        component: () => import('@/pages/appointment-add.vue'),
        meta: { permission: 'appointments.manage' },
      },
      {
        path: 'calendar',
        component: () => import('@/pages/calendar.vue'),
        meta: { permission: 'appointments.view' },
      },
      {
        path: 'staff',
        component: () => import('@/pages/staff.vue'),
        meta: { permission: 'staff.view' },
      },
      {
        path: 'staff/add',
        component: () => import('@/pages/staff-add.vue'),
        meta: { permission: 'staff.manage' },
      },
      {
        path: 'staff/:id/edit',
        component: () => import('@/pages/staff-add.vue'),
        meta: { permission: 'staff.manage' },
      },
      {
        path: 'roles',
        component: () => import('@/pages/roles.vue'),
        meta: { permission: 'roles.manage' },
      },
      {
        path: 'roles/add',
        component: () => import('@/pages/role-add.vue'),
        meta: { permission: 'roles.manage' },
      },
      {
        path: 'roles/:id/edit',
        component: () => import('@/pages/role-add.vue'),
        meta: { permission: 'roles.manage' },
      },
      {
        path: 'permissions',
        component: () => import('@/pages/permissions.vue'),
        meta: { permission: 'roles.manage' },
      },
      {
        path: 'invoices',
        component: () => import('@/pages/invoices.vue'),
        meta: { permission: 'invoices.view' },
      },
      {
        path: 'invoices/add',
        component: () => import('@/pages/invoice-add.vue'),
        meta: { permission: 'invoices.manage' },
      },
      {
        path: 'invoices/:id/edit',
        component: () => import('@/pages/invoice-add.vue'),
        meta: { permission: 'invoices.manage' },
      },
      {
        path: 'invoices/:id/preview',
        component: () => import('@/pages/invoice-preview.vue'),
        meta: { permission: 'invoices.view' },
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
