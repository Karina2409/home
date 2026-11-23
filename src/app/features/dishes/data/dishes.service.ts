import { inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from '@services/supabase.service';
import { MessageService } from 'primeng/api';
import { catchError, finalize, from, map, Observable, of, tap } from 'rxjs';
import { Dish, DishFormData } from '@features/dishes';

@Injectable({ providedIn: 'root' })
export class DishesService {
    private readonly supabase = inject(SupabaseService).client;
    private readonly messageService = inject(MessageService);

    private readonly _dishes = signal<Dish[]>([]);
    readonly dishes = this._dishes.asReadonly();

    private readonly _loading = signal(false);
    readonly loading = this._loading.asReadonly();

    constructor() {
        this.loadDishes().subscribe();
    }

    loadDishes(): Observable<Dish[]> {
        this._loading.set(true);

        return from(this.supabase.from('dishes').select('*').order('created_at', { ascending: false })).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return (data ?? []).map((row: any) => this.fromDb(row));
            }),
            tap((dishes) => this._dishes.set(dishes)),
            catchError((err) => {
                this.handleError('Ошибка загрузки блюд', err);
                this._dishes.set([]);
                return of([]);
            }),
            finalize(() => this._loading.set(false)),
        );
    }

    getDishById(id: string): Dish | undefined {
        return this._dishes().find((d) => d.id === id);
    }

    addDish(data: DishFormData): Observable<Dish | null> {
        const row = this.toDb(data);

        return from(this.supabase.from('dishes').insert(row).select().single()).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return this.fromDb(data);
            }),
            tap((dish) => this._dishes.update((current) => [dish, ...current])),
            catchError((err) => {
                this.handleError('Ошибка добавления блюда', err);
                return of(null);
            }),
        );
    }

    updateDish(id: string, data: DishFormData): Observable<Dish | null> {
        const row = this.toDb(data);

        return from(this.supabase.from('dishes').update(row).eq('id', id).select().single()).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return this.fromDb(data);
            }),
            tap((updated) => this._dishes.update((current) => current.map((d) => (d.id === id ? updated : d)))),
            catchError((err) => {
                this.handleError('Ошибка обновления блюда', err);
                return of(null);
            }),
        );
    }

    deleteDish(id: string): Observable<boolean> {
        return from(this.supabase.from('dishes').delete().eq('id', id)).pipe(
            map(({ error }) => {
                if (error) throw error;
                return true;
            }),
            tap(() => this._dishes.update((current) => current.filter((d) => d.id !== id))),
            catchError((err) => {
                this.handleError('Ошибка удаления блюда', err);
                return of(false);
            }),
        );
    }

    private fromDb(row: any): Dish {
        return {
            id: row.id,
            name: row.name,
            photoUrl: row.photo_url ?? null,
            cookTimeMinutes: row.cook_time_minutes,
            difficulty: row.difficulty,
            ingredients: row.ingredients ?? [],
            steps: row.steps ?? [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }

    private toDb(data: DishFormData): any {
        return {
            name: data.name,
            photo_url: data.photoUrl,
            cook_time_minutes: data.cookTimeMinutes,
            difficulty: data.difficulty,
            ingredients: data.ingredients,
            steps: data.steps,
        };
    }

    private handleError(message: string, error: any): void {
        this.messageService.add({ severity: 'error', summary: message, detail: error?.message });
    }
}
