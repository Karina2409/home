import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./components/settings-page/settings-page.component').then((m) => m.SettingsPageComponent),
    },
];
