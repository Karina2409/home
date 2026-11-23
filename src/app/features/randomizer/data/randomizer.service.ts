import { inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from '@services/supabase.service';
import { MessageService } from 'primeng/api';
import { catchError, finalize, from, map, Observable, of, tap } from 'rxjs';
import {
    RandomizerChoice,
    RandomizerList,
    RandomizerListFormData,
    YesNoDecision,
    YesNoDecisionFormData,
} from '@features/randomizer';

interface ListRow {
    id: string;
    name: string;
    items: string[];
    created_at: string;
    updated_at: string;
}

interface ChoiceRow {
    id: string;
    list_id: string;
    selected_item: string;
    chosen_at: string;
    choice_type: 'list' | 'yesno';
}

interface YesNoRow {
    id: string;
    question: string;
    answer: 'yes' | 'no';
    decided_at: string;
}

@Injectable({ providedIn: 'root' })
export class RandomizerService {
    private readonly supabase = inject(SupabaseService).client;
    private readonly messageService = inject(MessageService);

    private readonly _lists = signal<RandomizerList[]>([]);
    readonly lists = this._lists.asReadonly();

    private readonly _history = signal<RandomizerChoice[]>([]);
    readonly history = this._history.asReadonly();

    private readonly _yesNoHistory = signal<YesNoDecision[]>([]);
    readonly yesNoHistory = this._yesNoHistory.asReadonly();

    private readonly _loading = signal(false);
    readonly loading = this._loading.asReadonly();

    private readonly _currentResult = signal<string | null>(null);
    readonly currentResult = this._currentResult.asReadonly();

    constructor() {
        this.loadLists().subscribe();
        this.loadHistory().subscribe();
    }

    loadLists(): Observable<RandomizerList[]> {
        this._loading.set(true);
        return from(this.supabase.from('randomizer_lists').select('*').order('created_at', { ascending: false })).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return (data ?? []).map((row: ListRow) => this.fromListRow(row));
            }),
            tap((lists) => this._lists.set(lists)),
            catchError((err) => {
                this.handleError('Ошибка загрузки списков', err);
                this._lists.set([]);
                return of([]);
            }),
            finalize(() => this._loading.set(false)),
        );
    }

    loadHistory(): Observable<RandomizerChoice[]> {
        return from(
            this.supabase.from('randomizer_history').select('*').order('chosen_at', { ascending: false }).limit(50),
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return (data ?? []).map((row: ChoiceRow) => this.fromChoiceRow(row));
            }),
            tap((h) => this._history.set(h)),
            catchError((err) => {
                this.handleError('Ошибка загрузки истории', err);
                return of([]);
            }),
        );
    }

    addList(data: RandomizerListFormData): Observable<RandomizerList | null> {
        return from(
            this.supabase
                .from('randomizer_lists')
                .insert({
                    name: data.name,
                    items: data.items,
                })
                .select()
                .single(),
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return this.fromListRow(data as ListRow);
            }),
            tap((list) => this._lists.update((l) => [list, ...l])),
            tap(() => this.messageService.add({ severity: 'success', summary: 'Список добавлен' })),
            catchError((err) => {
                this.handleError('Ошибка добавления списка', err);
                return of(null);
            }),
        );
    }

    updateList(id: string, data: RandomizerListFormData): Observable<RandomizerList | null> {
        return from(
            this.supabase
                .from('randomizer_lists')
                .update({
                    name: data.name,
                    items: data.items,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single(),
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return this.fromListRow(data as ListRow);
            }),
            tap((updated) => this._lists.update((ls) => ls.map((l) => (l.id === id ? updated : l)))),
            tap(() => this.messageService.add({ severity: 'success', summary: 'Список обновлён' })),
            catchError((err) => {
                this.handleError('Ошибка обновления списка', err);
                return of(null);
            }),
        );
    }

    deleteList(id: string): Observable<boolean> {
        return from(this.supabase.from('randomizer_lists').delete().eq('id', id)).pipe(
            map(({ error }) => {
                if (error) throw error;
                return true;
            }),
            tap(() => this._lists.update((ls) => ls.filter((l) => l.id !== id))),
            tap(() => this.messageService.add({ severity: 'success', summary: 'Список удалён' })),
            catchError((err) => {
                this.handleError('Ошибка удаления списка', err);
                return of(false);
            }),
        );
    }

    pickRandom(listId: string): Observable<RandomizerChoice | null> {
        const list = this._lists().find((l) => l.id === listId);
        if (!list || list.items.length === 0) return of(null);

        const randomIndex = Math.floor(Math.random() * list.items.length);
        const selectedItem = list.items[randomIndex];

        return from(
            this.supabase
                .from('randomizer_history')
                .insert({
                    list_id: listId,
                    selected_item: selectedItem,
                    choice_type: 'list',
                })
                .select()
                .single(),
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return this.fromChoiceRow(data as ChoiceRow);
            }),
            tap((choice) => {
                this._history.update((h) => [choice, ...h]);
                this._currentResult.set(selectedItem);
            }),
            catchError((err) => {
                this.handleError('Ошибка выбора', err);
                return of(null);
            }),
        );
    }

    decideYesNo(data: YesNoDecisionFormData): Observable<YesNoDecision | null> {
        const answer: 'yes' | 'no' = Math.random() > 0.5 ? 'yes' : 'no';
        return from(
            this.supabase
                .from('randomizer_yesno')
                .insert({
                    question: data.question,
                    answer,
                })
                .select()
                .single(),
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return this.fromYesNoRow(data as YesNoRow);
            }),
            tap((decision) => {
                this._yesNoHistory.update((h) => [decision, ...h]);
                this._currentResult.set(answer === 'yes' ? 'Да!' : 'Нет!');
            }),
            catchError((err) => {
                this.handleError('Ошибка решения', err);
                return of(null);
            }),
        );
    }

    getListById(id: string): RandomizerList | undefined {
        return this._lists().find((l) => l.id === id);
    }

    clearResult(): void {
        this._currentResult.set(null);
    }

    private fromListRow(row: ListRow): RandomizerList {
        return {
            id: row.id,
            name: row.name,
            items: row.items,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }

    private fromChoiceRow(row: ChoiceRow): RandomizerChoice {
        return {
            id: row.id,
            listId: row.list_id,
            selectedItem: row.selected_item,
            chosenAt: row.chosen_at,
            choiceType: row.choice_type,
        };
    }

    private fromYesNoRow(row: YesNoRow): YesNoDecision {
        return {
            id: row.id,
            question: row.question,
            answer: row.answer,
            decidedAt: row.decided_at,
        };
    }

    private handleError(summary: string, error: unknown): void {
        console.error(error);
        this.messageService.add({ severity: 'error', summary, detail: String(error) });
    }
}
