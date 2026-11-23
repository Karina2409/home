import { inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from '@services/supabase.service';
import { MessageService } from 'primeng/api';
import { catchError, finalize, from, map, Observable, of, tap } from 'rxjs';
import { Task, TaskFormData } from '@features/tasks';

@Injectable({ providedIn: 'root' })
export class TasksService {
    private readonly supabase = inject(SupabaseService).client;
    private readonly messageService = inject(MessageService);

    private readonly _tasks = signal<Task[]>([]);
    readonly tasks = this._tasks.asReadonly();

    private readonly _loading = signal(false);
    readonly loading = this._loading.asReadonly();

    constructor() {
        this.loadTasks().subscribe();
    }

    loadTasks(): Observable<Task[]> {
        this._loading.set(true);

        return from(this.supabase.from('tasks').select('*').order('created_at', { ascending: false })).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return (data ?? []).map((row: any) => this.fromDb(row));
            }),
            tap((tasks) => this._tasks.set(tasks)),
            catchError((err) => {
                this.handleError('Ошибка загрузки заданий', err);
                this._tasks.set([]);
                return of([]);
            }),
            finalize(() => this._loading.set(false)),
        );
    }

    getTaskById(id: string): Task | undefined {
        return this._tasks().find((t) => t.id === id);
    }

    addTask(data: TaskFormData): Observable<Task | null> {
        const row = this.toDb(data);

        return from(this.supabase.from('tasks').insert(row).select().single()).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return this.fromDb(data);
            }),
            tap((task) => this._tasks.update((current) => [task, ...current])),
            catchError((err) => {
                this.handleError('Ошибка добавления задания', err);
                return of(null);
            }),
        );
    }

    updateTask(id: string, data: TaskFormData): Observable<Task | null> {
        const row = this.toDb(data);

        return from(this.supabase.from('tasks').update(row).eq('id', id).select().single()).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return this.fromDb(data);
            }),
            tap((updated) => this._tasks.update((current) => current.map((t) => (t.id === id ? updated : t)))),
            catchError((err) => {
                this.handleError('Ошибка обновления задания', err);
                return of(null);
            }),
        );
    }

    completeTask(id: string): Observable<boolean> {
        return from(this.supabase.from('tasks').update({ completed: true }).eq('id', id)).pipe(
            map(({ error }) => {
                if (error) throw error;
                return true;
            }),
            tap(() =>
                this._tasks.update((current) => current.map((t) => (t.id === id ? { ...t, completed: true } : t))),
            ),
            catchError((err) => {
                this.handleError('Ошибка завершения задания', err);
                return of(false);
            }),
        );
    }

    deleteTask(id: string): Observable<boolean> {
        return from(this.supabase.from('tasks').delete().eq('id', id)).pipe(
            map(({ error }) => {
                if (error) throw error;
                return true;
            }),
            tap(() => this._tasks.update((current) => current.filter((t) => t.id !== id))),
            catchError((err) => {
                this.handleError('Ошибка удаления задания', err);
                return of(false);
            }),
        );
    }

    private fromDb(row: any): Task {
        return {
            id: row.id,
            title: row.title,
            description: row.description ?? null,
            deadline: row.deadline ?? null,
            assignees: row.assignees ?? [],
            repeatConfig: row.repeat_config ?? null,
            completed: row.completed ?? false,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }

    private toDb(data: TaskFormData): any {
        return {
            title: data.title,
            description: data.description,
            deadline: data.deadline,
            assignees: data.assignees,
            repeat_config: data.repeatConfig,
            completed: false,
        };
    }

    private handleError(message: string, error: any): void {
        this.messageService.add({ severity: 'error', summary: message, detail: error?.message });
    }
}
