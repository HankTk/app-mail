import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/mail',
    pathMatch: 'full'
  },
  {
    path: 'mail',
    loadComponent: () => import('./components/mail-view/mail-view.component').then(m => m.MailViewComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent)
  }
];

