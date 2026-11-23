import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./components/fridge-list/fridge-list.component').then((m) => m.FridgeListComponent),
    },
    {
        path: 'form',
        loadComponent: () =>
            import('./components/fridge-form/fridge-form.component').then((m) => m.FridgeFormComponent),
    },
    {
        path: ':id',
        loadComponent: () =>
            import('./components/fridge-detail/fridge-detail.component').then((m) => m.FridgeDetailComponent),
    },
    {
        path: ':id/form',
        loadComponent: () =>
            import('./components/fridge-form/fridge-form.component').then((m) => m.FridgeFormComponent),
    },
];
