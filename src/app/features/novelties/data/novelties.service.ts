import { inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from '@services/supabase.service';
import { MessageService } from 'primeng/api';
import { catchError, finalize, from, map, Observable, of, tap } from 'rxjs';
import {
    Novelty,
    NoveltyComment,
    NoveltyCommentFormData,
    NoveltyFormData,
    NoveltyStatus,
} from '@features/novelties';

@Injectable({ providedIn: 'root' })
export class NoveltyService {
    private readonly supabase = inject(SupabaseService).client;
    private readonly messageService = inject(MessageService);

    private readonly _novelties = signal<Novelty[]>([]);
    readonly novelties = this._novelties.asReadonly();

    private readonly _loading = signal(false);
    readonly loading = this._loading.asReadonly();

    constructor() {
        this.loadNovelties().subscribe();
    }

    loadNovelties(): Observable<Novelty[]> {
        this._loading.set(true);

        return from(this.supabase.from('novelties').select('*').order('created_at', { ascending: false })).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return (data ?? []).map((row: any) => this.fromDb(row));
            }),
            tap((novelties) => this._novelties.set(novelties)),
            catchError((err) => {
                this.handleError('Ошибка загрузки новинок', err);
                this._novelties.set([]);
                return of([]);
            }),
            finalize(() => this._loading.set(false)),
        );
    }

    getNoveltyById(id: string): Novelty | undefined {
        return this._novelties().find((n) => n.id === id);
    }

    addNovelty(data: NoveltyFormData): Observable<Novelty | null> {
        return from(
            this.supabase
                .from('novelties')
                .insert({
                    name: data.name,
                    photo_url: data.photoUrl,
                    description: data.description,
                    status: data.status,
                    rating: 0,
                    likes: 0,
                    dislikes: 0,
                })
                .select()
                .single(),
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                const novelty = this.fromDb(data);
                this._novelties.update((list) => [novelty, ...list]);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Успешно',
                    detail: 'Новинка добавлена',
                });
                return novelty;
            }),
            catchError((err) => {
                this.handleError('Ошибка добавления новинки', err);
                return of(null);
            }),
        );
    }

    updateNovelty(id: string, data: NoveltyFormData): Observable<Novelty | null> {
        return from(
            this.supabase
                .from('novelties')
                .update({
                    name: data.name,
                    photo_url: data.photoUrl,
                    description: data.description,
                    status: data.status,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single(),
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                const novelty = this.fromDb(data);
                this._novelties.update((list) => list.map((n) => (n.id === id ? novelty : n)));
                this.messageService.add({
                    severity: 'success',
                    summary: 'Успешно',
                    detail: 'Новинка обновлена',
                });
                return novelty;
            }),
            catchError((err) => {
                this.handleError('Ошибка обновления новинки', err);
                return of(null);
            }),
        );
    }

    deleteNovelty(id: string): Observable<boolean> {
        return from(this.supabase.from('novelties').delete().eq('id', id)).pipe(
            map(({ error }) => {
                if (error) throw error;
                this._novelties.update((list) => list.filter((n) => n.id !== id));
                this.messageService.add({
                    severity: 'success',
                    summary: 'Успешно',
                    detail: 'Новинка удалена',
                });
                return true;
            }),
            catchError((err) => {
                this.handleError('Ошибка удаления новинки', err);
                return of(false);
            }),
        );
    }

    updateStatus(id: string, status: NoveltyStatus): Observable<Novelty | null> {
        return from(
            this.supabase
                .from('novelties')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single(),
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                const novelty = this.fromDb(data);
                this._novelties.update((list) => list.map((n) => (n.id === id ? novelty : n)));
                return novelty;
            }),
            catchError((err) => {
                this.handleError('Ошибка обновления статуса', err);
                return of(null);
            }),
        );
    }

    addComment(noveltyId: string, data: NoveltyCommentFormData): Observable<NoveltyComment | null> {
        return from(
            this.supabase
                .from('novelty_comments')
                .insert({
                    novelty_id: noveltyId,
                    text: data.text,
                    rating: data.rating,
                })
                .select()
                .single(),
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Успешно',
                    detail: 'Комментарий добавлен',
                });
                return this.commentFromDb(data);
            }),
            catchError((err) => {
                this.handleError('Ошибка добавления комментария', err);
                return of(null);
            }),
        );
    }

    private fromDb(row: any): Novelty {
        return {
            id: row.id,
            name: row.name,
            photoUrl: row.photo_url,
            description: row.description,
            status: row.status,
            rating: row.rating,
            likes: row.likes,
            dislikes: row.dislikes,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }

    private commentFromDb(row: any): NoveltyComment {
        return {
            id: row.id,
            noveltyId: row.novelty_id,
            text: row.text,
            rating: row.rating,
            createdAt: row.created_at,
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
