import { inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from '@services/supabase.service';
import { MessageService } from 'primeng/api';
import { catchError, finalize, from, map, Observable, of, tap } from 'rxjs';
import { FridgeItem, FridgeItemFormData, FridgeItemStatus } from '@features/fridge';

@Injectable({ providedIn: 'root' })
export class FridgeService {
    private readonly supabase = inject(SupabaseService).client;
    private readonly messageService = inject(MessageService);

    private readonly _items = signal<FridgeItem[]>([]);
    readonly items = this._items.asReadonly();

    private readonly _loading = signal(false);
    readonly loading = this._loading.asReadonly();

    constructor() {
        this.loadItems().subscribe();
    }

    loadItems(): Observable<FridgeItem[]> {
        this._loading.set(true);

        return from(this.supabase.from('fridge').select('*').order('expiration_date', { ascending: true })).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return (data ?? []).map((row: any) => this.fromDb(row));
            }),
            tap((items) => this._items.set(items)),
            catchError((err) => {
                this.handleError('Ошибка загрузки продуктов', err);
                this._items.set([]);
                return of([]);
            }),
            finalize(() => this._loading.set(false)),
        );
    }

    getItemById(id: string): FridgeItem | undefined {
        return this._items().find((i) => i.id === id);
    }

    addItem(data: FridgeItemFormData): Observable<FridgeItem | null> {
        const row = this.toDb(data);

        return from(this.supabase.from('fridge').insert(row).select().single()).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return this.fromDb(data);
            }),
            tap((item) => this._items.update((current) => [item, ...current])),
            catchError((err) => {
                this.handleError('Ошибка добавления продукта', err);
                return of(null);
            }),
        );
    }

    updateItem(id: string, data: FridgeItemFormData): Observable<FridgeItem | null> {
        const row = this.toDb(data);

        return from(this.supabase.from('fridge').update(row).eq('id', id).select().single()).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return this.fromDb(data);
            }),
            tap((updated) => this._items.update((current) => current.map((i) => (i.id === id ? updated : i)))),
            catchError((err) => {
                this.handleError('Ошибка обновления продукта', err);
                return of(null);
            }),
        );
    }

    deleteItem(id: string): Observable<boolean> {
        return from(this.supabase.from('fridge').delete().eq('id', id)).pipe(
            map(({ error }) => {
                if (error) throw error;
                return true;
            }),
            tap(() => this._items.update((current) => current.filter((i) => i.id !== id))),
            catchError((err) => {
                this.handleError('Ошибка удаления продукта', err);
                return of(false);
            }),
        );
    }

    private calculateStatus(expirationDate: string): FridgeItemStatus {
        const now = new Date();
        const exp = new Date(expirationDate);
        const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'expired';
        if (diffDays === 0) return 'expiring_today';
        if (diffDays <= 3) return 'expiring_soon';
        return 'ok';
    }

    private fromDb(row: any): FridgeItem {
        return {
            id: row.id,
            productName: row.product_name,
            photoUrl: row.photo_url ?? null,
            quantity: row.quantity,
            unit: row.unit,
            expirationDate: row.expiration_date,
            status: this.calculateStatus(row.expiration_date),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }

    private toDb(data: FridgeItemFormData): any {
        return {
            product_name: data.productName,
            photo_url: data.photoUrl,
            quantity: data.quantity,
            unit: data.unit,
            expiration_date: data.expirationDate,
        };
    }

    private handleError(message: string, error: any): void {
        this.messageService.add({ severity: 'error', summary: message, detail: error?.message });
    }
}
