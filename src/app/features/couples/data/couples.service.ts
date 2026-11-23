import { inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from '@services/supabase.service';
import { MessageService } from 'primeng/api';
import { catchError, finalize, from, map, Observable, of, tap } from 'rxjs';
import {
    CouplesTask,
    CouplesTaskFormData,
    DailyQuestion,
    Question,
    QuestionCategory,
    QuestionFormData,
} from '@features/couples';

interface QuestionRow {
    id: string;
    text: string;
    category: QuestionCategory;
    is_answered: boolean;
    answer: string | null;
    answered_at: string | null;
    created_at: string;
    user_id: string;
}

interface TaskRow {
    id: string;
    title: string;
    description: string;
    is_completed: boolean;
    completed_at: string | null;
    created_at: string;
}

@Injectable({ providedIn: 'root' })
export class CouplesService {
    private readonly supabase = inject(SupabaseService).client;
    private readonly messageService = inject(MessageService);

    private readonly _questions = signal<Question[]>([]);
    readonly questions = this._questions.asReadonly();

    private readonly _tasks = signal<CouplesTask[]>([]);
    readonly tasks = this._tasks.asReadonly();

    private readonly _dailyQuestion = signal<DailyQuestion | null>(null);
    readonly dailyQuestion = this._dailyQuestion.asReadonly();

    private readonly _loading = signal(false);
    readonly loading = this._loading.asReadonly();

    constructor() {
        this.loadQuestions().subscribe();
        this.loadTasks().subscribe();
        this.loadDailyQuestion().subscribe();
    }

    loadQuestions(): Observable<Question[]> {
        this._loading.set(true);
        return from(this.supabase.from('couples_questions').select('*').order('created_at', { ascending: false })).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return (data ?? []).map((row: QuestionRow) => this.fromQuestionRow(row));
            }),
            tap((questions) => this._questions.set(questions)),
            catchError((err) => {
                this.handleError('Ошибка загрузки вопросов', err);
                this._questions.set([]);
                return of([]);
            }),
            finalize(() => this._loading.set(false)),
        );
    }

    loadTasks(): Observable<CouplesTask[]> {
        return from(this.supabase.from('couples_tasks').select('*').order('created_at', { ascending: false })).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return (data ?? []).map((row: TaskRow) => this.fromTaskRow(row));
            }),
            tap((tasks) => this._tasks.set(tasks)),
            catchError((err) => {
                this.handleError('Ошибка загрузки заданий', err);
                this._tasks.set([]);
                return of([]);
            }),
        );
    }

    loadDailyQuestion(): Observable<DailyQuestion | null> {
        const today = new Date().toISOString().split('T')[0];
        return from(this.supabase.from('couples_daily_questions').select('*').eq('date', today).maybeSingle()).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return data as DailyQuestion | null;
            }),
            tap((dq) => this._dailyQuestion.set(dq)),
            catchError((err) => {
                this.handleError('Ошибка загрузки вопроса дня', err);
                return of(null);
            }),
        );
    }

    addQuestion(data: QuestionFormData): Observable<Question | null> {
        return from(
            this.supabase
                .from('couples_questions')
                .insert({
                    text: data.text,
                    category: data.category,
                    is_answered: false,
                })
                .select()
                .single(),
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return this.fromQuestionRow(data as QuestionRow);
            }),
            tap((question) => this._questions.update((q) => [question, ...q])),
            tap(() => this.messageService.add({ severity: 'success', summary: 'Вопрос добавлен' })),
            catchError((err) => {
                this.handleError('Ошибка добавления вопроса', err);
                return of(null);
            }),
        );
    }

    answerQuestion(id: string, answer: string): Observable<Question | null> {
        return from(
            this.supabase
                .from('couples_questions')
                .update({
                    is_answered: true,
                    answer,
                    answered_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single(),
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return this.fromQuestionRow(data as QuestionRow);
            }),
            tap((updated) => this._questions.update((qs) => qs.map((q) => (q.id === id ? updated : q)))),
            catchError((err) => {
                this.handleError('Ошибка сохранения ответа', err);
                return of(null);
            }),
        );
    }

    deleteQuestion(id: string): Observable<boolean> {
        return from(this.supabase.from('couples_questions').delete().eq('id', id)).pipe(
            map(({ error }) => {
                if (error) throw error;
                return true;
            }),
            tap(() => this._questions.update((qs) => qs.filter((q) => q.id !== id))),
            tap(() => this.messageService.add({ severity: 'success', summary: 'Вопрос удалён' })),
            catchError((err) => {
                this.handleError('Ошибка удаления вопроса', err);
                return of(false);
            }),
        );
    }

    addTask(data: CouplesTaskFormData): Observable<CouplesTask | null> {
        return from(
            this.supabase
                .from('couples_tasks')
                .insert({
                    title: data.title,
                    description: data.description,
                    is_completed: false,
                })
                .select()
                .single(),
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return this.fromTaskRow(data as TaskRow);
            }),
            tap((task) => this._tasks.update((t) => [task, ...t])),
            tap(() => this.messageService.add({ severity: 'success', summary: 'Задание добавлено' })),
            catchError((err) => {
                this.handleError('Ошибка добавления задания', err);
                return of(null);
            }),
        );
    }

    toggleTask(id: string): Observable<CouplesTask | null> {
        const task = this._tasks().find((t) => t.id === id);
        if (!task) return of(null);
        const newStatus = !task.isCompleted;
        return from(
            this.supabase
                .from('couples_tasks')
                .update({
                    is_completed: newStatus,
                    completed_at: newStatus ? new Date().toISOString() : null,
                })
                .eq('id', id)
                .select()
                .single(),
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return this.fromTaskRow(data as TaskRow);
            }),
            tap((updated) => this._tasks.update((ts) => ts.map((t) => (t.id === id ? updated : t)))),
            catchError((err) => {
                this.handleError('Ошибка обновления задания', err);
                return of(null);
            }),
        );
    }

    deleteTask(id: string): Observable<boolean> {
        return from(this.supabase.from('couples_tasks').delete().eq('id', id)).pipe(
            map(({ error }) => {
                if (error) throw error;
                return true;
            }),
            tap(() => this._tasks.update((ts) => ts.filter((t) => t.id !== id))),
            tap(() => this.messageService.add({ severity: 'success', summary: 'Задание удалено' })),
            catchError((err) => {
                this.handleError('Ошибка удаления задания', err);
                return of(false);
            }),
        );
    }

    getQuestionById(id: string): Question | undefined {
        return this._questions().find((q) => q.id === id);
    }

    private fromQuestionRow(row: QuestionRow): Question {
        return {
            id: row.id,
            text: row.text,
            category: row.category,
            isAnswered: row.is_answered,
            answer: row.answer ?? undefined,
            answeredAt: row.answered_at ?? undefined,
            createdAt: row.created_at,
            userId: row.user_id,
        };
    }

    private fromTaskRow(row: TaskRow): CouplesTask {
        return {
            id: row.id,
            title: row.title,
            description: row.description,
            isCompleted: row.is_completed,
            completedAt: row.completed_at ?? undefined,
            createdAt: row.created_at,
        };
    }

    private handleError(summary: string, error: unknown): void {
        console.error(error);
        this.messageService.add({ severity: 'error', summary, detail: String(error) });
    }
}
