import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./components/cleaning-list/cleaning-list.component').then((m) => m.CleaningListComponent),
    },
    {
        path: ':id',
        loadComponent: () =>
            import('./components/cleaning-detail/cleaning-detail.component').then((m) => m.CleaningDetailComponent),
    },
];
