import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'expenses', // Renamed path
        loadComponent: () =>
          import('../pages/expenses/expenses.page').then(m => m.ExpensesPage), // Updated import
      },
      {
        path: 'add',
        loadComponent: () =>
          import('../pages/add-record/add-record.page').then(m => m.AddRecordPage),
      },
      {
        path: 'cajas',
        loadComponent: () =>
          import('../pages/cajas/cajas.page').then(m => m.CajasPage),
      },
      {
        path: 'cajas/:id',
        loadComponent: () =>
          import('../pages/cajas/caja-detail.page').then(m => m.CajaDetailPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../pages/app-settings/app-settings.page').then(m => m.AppSettingsPage),
      },
      {
        path: '',
        redirectTo: 'expenses', // Updated redirectTo
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/expenses', // Updated redirectTo
    pathMatch: 'full',
  },
];