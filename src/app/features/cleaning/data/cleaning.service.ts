import { inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from '@services/supabase.service';
import { MessageService } from 'primeng/api';
import { catchError, finalize, from, map, Observable, of, tap } from 'rxjs';
import {
    CleaningRoom,
    CleaningRoomFormData,
    CleaningTask,
    CleaningTaskFormData,
    CleaningTaskStatus,
} from '@features/cleaning';

@Injectable({ providedIn: 'root' })
export class CleaningService {
    private readonly supabase = inject(SupabaseService).client;
    private readonly messageService = inject(MessageService);

    private readonly _rooms = signal<CleaningRoom[]>([]);
    readonly rooms = this._rooms.asReadonly();

    private readonly _tasks = signal<CleaningTask[]>([]);
    readonly tasks = this._tasks.asReadonly();

    private readonly _loading = signal(false);
    readonly loading = this._loading.asReadonly();

    constructor() {
        this.loadRooms().subscribe();
    }

    loadRooms(): Observable<CleaningRoom[]> {
        this._loading.set(true);

        return from(this.supabase.from('cleaning_rooms').select('*').order('order')).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return (data ?? []).map((row: any) => this.roomFromDb(row));
            }),
            tap((rooms) => this._rooms.set(rooms)),
            catchError((err) => {
                this.handleError('Ошибка загрузки комнат', err);
                this._rooms.set([]);
                return of([]);
            }),
            finalize(() => this._loading.set(false)),
        );
    }

    loadTasksByRoom(roomId: string): Observable<CleaningTask[]> {
        return from(this.supabase.from('cleaning_tasks').select('*').eq('room_id', roomId)).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return (data ?? []).map((row: any) => this.taskFromDb(row));
            }),
            tap((tasks) => this._tasks.set(tasks)),
            catchError((err) => {
                this.handleError('Ошибка загрузки задач', err);
                this._tasks.set([]);
                return of([]);
            }),
        );
    }

    addRoom(data: CleaningRoomFormData): Observable<CleaningRoom | null> {
        const maxOrder = Math.max(0, ...this._rooms().map((r) => r.order));
        return from(
            this.supabase
                .from('cleaning_rooms')
                .insert({
                    name: data.name,
                    color: data.color,
                    order: maxOrder + 1,
                })
                .select()
                .single(),
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                const room = this.roomFromDb(data);
                this._rooms.update((list) => [...list, room]);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Успешно',
                    detail: 'Комната добавлена',
                });
                return room;
            }),
            catchError((err) => {
                this.handleError('Ошибка добавления комнаты', err);
                return of(null);
            }),
        );
    }

    updateRoom(id: string, data: CleaningRoomFormData): Observable<CleaningRoom | null> {
        return from(
            this.supabase
                .from('cleaning_rooms')
                .update({
                    name: data.name,
                    color: data.color,
                })
                .eq('id', id)
                .select()
                .single(),
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                const room = this.roomFromDb(data);
                this._rooms.update((list) => list.map((r) => (r.id === id ? room : r)));
                this.messageService.add({
                    severity: 'success',
                    summary: 'Успешно',
                    detail: 'Комната обновлена',
                });
                return room;
            }),
            catchError((err) => {
                this.handleError('Ошибка обновления комнаты', err);
                return of(null);
            }),
        );
    }

    deleteRoom(id: string): Observable<boolean> {
        return from(this.supabase.from('cleaning_rooms').delete().eq('id', id)).pipe(
            map(({ error }) => {
                if (error) throw error;
                this._rooms.update((list) => list.filter((r) => r.id !== id));
                this.messageService.add({
                    severity: 'success',
                    summary: 'Успешно',
                    detail: 'Комната удалена',
                });
                return true;
            }),
            catchError((err) => {
                this.handleError('Ошибка удаления комнаты', err);
                return of(false);
            }),
        );
    }

    addTask(data: CleaningTaskFormData): Observable<CleaningTask | null> {
        return from(
            this.supabase
                .from('cleaning_tasks')
                .insert({
                    room_id: data.roomId,
                    name: data.name,
                    repeat_config: data.repeatConfig,
                    next_due_at: this.calculateNextDue(data.repeatConfig),
                })
                .select()
                .single(),
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                const task = this.taskFromDb(data);
                this._tasks.update((list) => [...list, task]);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Успешно',
                    detail: 'Задача добавлена',
                });
                return task;
            }),
            catchError((err) => {
                this.handleError('Ошибка добавления задачи', err);
                return of(null);
            }),
        );
    }

    completeTask(id: string): Observable<CleaningTask | null> {
        const task = this._tasks().find((t) => t.id === id);
        if (!task) return of(null);

        return from(
            this.supabase
                .from('cleaning_tasks')
                .update({
                    last_completed_at: new Date().toISOString(),
                    next_due_at: this.calculateNextDue(task.repeatConfig),
                })
                .eq('id', id)
                .select()
                .single(),
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                const updatedTask = this.taskFromDb(data);
                this._tasks.update((list) => list.map((t) => (t.id === id ? updatedTask : t)));
                this.messageService.add({
                    severity: 'success',
                    summary: 'Успешно',
                    detail: 'Задача выполнена',
                });
                return updatedTask;
            }),
            catchError((err) => {
                this.handleError('Ошибка выполнения задачи', err);
                return of(null);
            }),
        );
    }

    deleteTask(id: string): Observable<boolean> {
        return from(this.supabase.from('cleaning_tasks').delete().eq('id', id)).pipe(
            map(({ error }) => {
                if (error) throw error;
                this._tasks.update((list) => list.filter((t) => t.id !== id));
                this.messageService.add({
                    severity: 'success',
                    summary: 'Успешно',
                    detail: 'Задача удалена',
                });
                return true;
            }),
            catchError((err) => {
                this.handleError('Ошибка удаления задачи', err);
                return of(false);
            }),
        );
    }

    private calculateNextDue(repeatConfig: any): string {
        const now = new Date();
        switch (repeatConfig.type) {
            case 'daily':
                now.setDate(now.getDate() + 1);
                break;
            case 'everyNDays':
                now.setDate(now.getDate() + (repeatConfig.interval || 1));
                break;
            case 'weekly':
                now.setDate(now.getDate() + 7);
                break;
            case 'everyNWeeks':
                now.setDate(now.getDate() + (repeatConfig.interval || 1) * 7);
                break;
            case 'monthly':
                now.setMonth(now.getMonth() + 1);
                break;
        }
        return now.toISOString();
    }

    private roomFromDb(row: any): CleaningRoom {
        return {
            id: row.id,
            name: row.name,
            color: row.color,
            order: row.order,
            status: row.status || 'completed',
            taskCount: row.task_count || 0,
            completedTaskCount: row.completed_task_count || 0,
        };
    }

    private taskFromDb(row: any): CleaningTask {
        return {
            id: row.id,
            roomId: row.room_id,
            name: row.name,
            frequency: row.frequency || '',
            repeatConfig: row.repeat_config,
            lastCompletedAt: row.last_completed_at,
            nextDueAt: row.next_due_at,
            status: this.calculateStatus(row.next_due_at, row.last_completed_at),
            createdAt: row.created_at,
        };
    }

    private calculateStatus(nextDueAt: string, lastCompletedAt: string | null): CleaningTaskStatus {
        const now = new Date();
        const dueDate = new Date(nextDueAt);
        const diffDays = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (lastCompletedAt && diffDays > 0) return 'completed';
        if (diffDays === 1) return 'due-soon';
        if (diffDays === 0) return 'due-today';
        if (diffDays === -1) return 'overdue';
        if (diffDays < -1) return 'overdue-critical';
        return 'completed';
    }

    private handleError(summary: string, error: any): void {
        console.error(error);
        this.messageService.add({
            severity: 'error',
            summary,
            detail: error.message || 'Произошла ошибка',
        });
    }
}
