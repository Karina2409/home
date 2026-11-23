import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./components/couples-list/couples-list.component').then((m) => m.CouplesListComponent),
    },
    {
        path: 'new',
        loadComponent: () =>
            import('./components/couples-form/couples-form.component').then((m) => m.CouplesFormComponent),
    },
    {
        path: ':id',
        loadComponent: () =>
            import('./components/couples-detail/couples-detail.component').then((m) => m.CouplesDetailComponent),
    },
    {
        path: ':id/edit',
        loadComponent: () =>
            import('./components/couples-form/couples-form.component').then((m) => m.CouplesFormComponent),
    },
];
