import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'history',
        loadComponent: () =>
          import('../history/history.page').then(m => m.HistoryPage),
      },
      {
        path: 'add',
        loadComponent: () =>
          import('../add-record/add-record.page').then(m => m.AddRecordPage),
      },
      {
        path: '',
        redirectTo: 'history',
        pathMatch: 'full',
      },
    ],
  },
];
