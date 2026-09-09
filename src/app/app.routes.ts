import {Routes} from '@angular/router';

export const routes: Routes = [
    {path: '', redirectTo: '/supplies', pathMatch: 'full'},
    {
        path: 'supplies',
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
