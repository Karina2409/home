import { Routes } from '@angular/router';
import { authGuard } from '@guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/supplies', pathMatch: 'full' },
    {
        path: 'login',
        loadComponent: () => import('./features/login/login-page').then((m) => m.LoginPage),
    },
    {
        path: 'supplies',
        canActivate: [authGuard],
        loadChildren: () => import('./features/supplies/supplies.routes').then((m) => m.routes),
    },
    {
        path: 'dishes',
        canActivate: [authGuard],
        loadChildren: () => import('./features/dishes/dishes.routes').then((m) => m.routes),
    },
    {
        path: 'fridge',
        canActivate: [authGuard],
        loadChildren: () => import('./features/fridge/fridge.routes').then((m) => m.routes),
    },
    {
        path: 'tasks',
        canActivate: [authGuard],
        loadChildren: () => import('./features/tasks/tasks.routes').then((m) => m.routes),
    },
    {
        path: 'cleaning',
        canActivate: [authGuard],
        loadChildren: () => import('./features/cleaning/cleaning.routes').then((m) => m.routes),
    },
    {
        path: 'novelties',
        canActivate: [authGuard],
        loadChildren: () => import('./features/novelties/novelties.routes').then((m) => m.routes),
    },
    {
        path: 'firstaid',
        canActivate: [authGuard],
        loadChildren: () => import('./features/firstaid/firstaid.routes').then((m) => m.routes),
    },
    {
        path: 'couples',
        canActivate: [authGuard],
        loadChildren: () => import('./features/couples/couples.routes').then((m) => m.routes),
    },
    {
        path: 'randomizer',
        canActivate: [authGuard],
        loadChildren: () => import('./features/randomizer/randomizer.routes').then((m) => m.routes),
    },
    {
        path: 'settings',
        canActivate: [authGuard],
        loadChildren: () => import('./features/settings/settings.routes').then((m) => m.routes),
    },
];
