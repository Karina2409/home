import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./components/novelties-list/novelties-list.component').then((m) => m.NoveltiesListComponent),
    },
    {
        path: ':id',
        loadComponent: () =>
            import('./components/novelties-detail/novelties-detail.component').then((m) => m.NoveltiesDetailComponent),
    },
];
