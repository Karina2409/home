import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./components/firstaid-list/firstaid-list.component').then((m) => m.FirstaidListComponent),
    },
    {
        path: ':id',
        loadComponent: () =>
            import('./components/firstaid-detail/firstaid-detail.component').then((m) => m.FirstaidDetailComponent),
    },
];
