import {Routes} from '@angular/router';
import {authGuard} from '@guards/auth.guard';

export const routes: Routes = [
    {path: '', redirectTo: '/supplies', pathMatch: 'full'},{
        path: 'login',
        loadComponent: () =>
            import('./features/login/login-page').then((m) => m.LoginPage),
    },
    {
        path: 'supplies',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./features/supplies/supplies-page.component').then(
                (m) => m.SuppliesPageComponent
            ),
    },
    // {
    //     path: 'dishes',
    //     loadComponent: () =>
    //         import('./features/supplies/pages/supplies-page/supplies-page.component').then(
    //             (m) => m.SuppliesPageComponent
    //         ),
    // },
    // {
    //     path: 'fridge',
    //     loadComponent: () =>
    //         import('./features/supplies/pages/supplies-page/supplies-page.component').then(
    //             (m) => m.SuppliesPageComponent
    //         ),
    // },
    // {
    //     path: 'tasks',
    //     loadComponent: () =>
    //         import('./features/supplies/pages/supplies-page/supplies-page.component').then(
    //             (m) => m.SuppliesPageComponent
    //         ),
    // },
];
