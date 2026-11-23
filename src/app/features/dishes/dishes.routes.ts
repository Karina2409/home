import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./components/dish-list/dish-list.component').then((m) => m.DishListComponent),
    },
    {
        path: 'form',
        loadComponent: () => import('./components/dish-form/dish-form.component').then((m) => m.DishFormComponent),
    },
    {
        path: ':id',
        loadComponent: () =>
            import('./components/dish-detail/dish-detail.component').then((m) => m.DishDetailComponent),
    },
    {
        path: ':id/form',
        loadComponent: () => import('./components/dish-form/dish-form.component').then((m) => m.DishFormComponent),
    },
];
