import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./components/task-list/task-list.component').then((m) => m.TaskListComponent),
    },
    {
        path: 'form',
        loadComponent: () => import('./components/task-form/task-form.component').then((m) => m.TaskFormComponent),
    },
    {
        path: ':id',
        loadComponent: () =>
            import('./components/task-detail/task-detail.component').then((m) => m.TaskDetailComponent),
    },
    {
        path: ':id/form',
        loadComponent: () => import('./components/task-form/task-form.component').then((m) => m.TaskFormComponent),
    },
];
