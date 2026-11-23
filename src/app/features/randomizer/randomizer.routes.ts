import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./components/randomizer-list/randomizer-list.component').then((m) => m.RandomizerListComponent),
    },
];
