import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'history',
        loadComponent: () =>
          import('../pages/history/history.page').then(m => m.HistoryPage),
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
        redirectTo: 'history',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/history',
    pathMatch: 'full',
  },
];
