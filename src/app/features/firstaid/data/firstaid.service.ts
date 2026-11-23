import { inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from '@services/supabase.service';
import { MessageService } from 'primeng/api';
import { catchError, finalize, from, map, Observable, of, tap } from 'rxjs';
import { Medicine, MedicineFormData } from '@features/firstaid';

@Injectable({ providedIn: 'root' })
export class FirstaidService {
    private readonly supabase = inject(SupabaseService).client;
    private readonly messageService = inject(MessageService);

    private readonly _medicines = signal<Medicine[]>([]);
    readonly medicines = this._medicines.asReadonly();

    private readonly _loading = signal(false);
    readonly loading = this._loading.asReadonly();

    constructor() {
        this.loadMedicines().subscribe();
    }

    loadMedicines(): Observable<Medicine[]> {
        this._loading.set(true);

        return from(this.supabase.from('medicines').select('*').order('name')).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return (data ?? []).map((row: any) => this.fromDb(row));
            }),
            tap((medicines) => this._medicines.set(medicines)),
            catchError((err) => {
                this.handleError('Ошибка загрузки лекарств', err);
                this._medicines.set([]);
                return of([]);
            }),
            finalize(() => this._loading.set(false)),
        );
    }

    getMedicineById(id: string): Medicine | undefined {
        return this._medicines().find((m) => m.id === id);
    }

    addMedicine(data: MedicineFormData): Observable<Medicine | null> {
        return from(
            this.supabase
                .from('medicines')
                .insert({
                    name: data.name,
                    photo_url: data.photoUrl,
                    expiry_date: data.expiryDate,
                    application_labels: data.applicationLabels,
                    application_methods: data.applicationMethods,
                    description: data.description,
                })
                .select()
                .single(),
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                const medicine = this.fromDb(data);
                this._medicines.update((list) => [medicine, ...list]);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Успешно',
                    detail: 'Лекарство добавлено',
                });
                return medicine;
            }),
            catchError((err) => {
                this.handleError('Ошибка добавления лекарства', err);
                return of(null);
            }),
        );
    }

    updateMedicine(id: string, data: MedicineFormData): Observable<Medicine | null> {
        return from(
            this.supabase
                .from('medicines')
                .update({
                    name: data.name,
                    photo_url: data.photoUrl,
                    expiry_date: data.expiryDate,
                    application_labels: data.applicationLabels,
                    application_methods: data.applicationMethods,
                    description: data.description,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single(),
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                const medicine = this.fromDb(data);
                this._medicines.update((list) => list.map((m) => (m.id === id ? medicine : m)));
                this.messageService.add({
                    severity: 'success',
                    summary: 'Успешно',
                    detail: 'Лекарство обновлено',
                });
                return medicine;
            }),
            catchError((err) => {
                this.handleError('Ошибка обновления лекарства', err);
                return of(null);
            }),
        );
    }

    deleteMedicine(id: string): Observable<boolean> {
        return from(this.supabase.from('medicines').delete().eq('id', id)).pipe(
            map(({ error }) => {
                if (error) throw error;
                this._medicines.update((list) => list.filter((m) => m.id !== id));
                this.messageService.add({
                    severity: 'success',
                    summary: 'Успешно',
                    detail: 'Лекарство удалено',
                });
                return true;
            }),
            catchError((err) => {
                this.handleError('Ошибка удаления лекарства', err);
                return of(false);
            }),
        );
    }

    isExpired(expiryDate: string): boolean {
        return new Date(expiryDate) < new Date();
    }

    isExpiringSoon(expiryDate: string, days: number = 30): boolean {
        const now = new Date();
        const expiry = new Date(expiryDate);
        const diffDays = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= days;
    }

    private fromDb(row: any): Medicine {
        return {
            id: row.id,
            name: row.name,
            photoUrl: row.photo_url,
            expiryDate: row.expiry_date,
            applicationLabels: row.application_labels || [],
            applicationMethods: row.application_methods || '',
            description: row.description || '',
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
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
