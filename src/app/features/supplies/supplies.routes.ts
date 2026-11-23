import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./supplies-page.component').then((m) => m.SuppliesPageComponent),
    },
];
