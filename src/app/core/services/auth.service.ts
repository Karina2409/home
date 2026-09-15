import {computed, inject, Injectable, signal} from '@angular/core';
import {Router} from '@angular/router';
import {SupabaseService} from '@core/services/supabase.service';
import {User, Session} from '@supabase/supabase-js';
import {MessageService} from 'primeng/api';
import {finalize, from, Observable, of, switchMap} from 'rxjs';
import {catchError, map, tap} from 'rxjs/operators';

export interface AuthCredentials {
    email: string;
    password: string;
    fullName?: string;
}

@Injectable({providedIn: 'root'})
export class AuthService {
    private readonly supabase = inject(SupabaseService).client;
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    // Signals состояния пользователя и загрузки
    readonly currentUser = signal<User | null>(null);
    readonly session = signal<Session | null>(null);
    readonly loading = signal<boolean>(false);

    readonly isAuthenticated = computed(() => !!this.session());

    constructor() {
        // Инициализируем сессию при старте приложения
        this.supabase.auth.getSession().then(({data}) => {
            this.session.set(data.session);
            this.currentUser.set(data.session?.user ?? null);
        });

        // Слушаем изменения авторизации (вход, выход, авто-продление токена)
        this.supabase.auth.onAuthStateChange((_event, session) => {
            this.session.set(session);
            this.currentUser.set(session?.user ?? null);
        });
    }

    // Вход по Email и Паролю
    login(credentials: AuthCredentials): Observable<boolean> {
        this.loading.set(true);

        return from(
            this.supabase.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password
            })
        ).pipe(
            map(({data, error}) => {
                if (error) throw error;
                this.session.set(data.session);
                this.currentUser.set(data.user);
                return true;
            }),
            switchMap(() => from(this.router.navigate(['/supplies']))),
            tap(() => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Успешно',
                    detail: 'Вы вошли в систему'
                });
            }),
            map(() => true),
            catchError((err) => {
                this.showError('Ошибка входа', err.message);
                return of(false);
            }),
            finalize(() => this.loading.set(false))
        );
    }

    // Выход из системы
    logout() {
        this.loading.set(true);

        from(this.supabase.auth.signOut()).pipe(
            map(({error}) => {
                if (error) throw error;
                return true;
            }),
            tap(() => {
                this.session.set(null);
                this.currentUser.set(null);
            }),
            switchMap(() => from(this.router.navigate(['/login']))),
            catchError((err) => {
                this.showError('Ошибка выхода', err.message);
                return of(false);
            }),
            finalize(() => this.loading.set(false))
        ).subscribe();
    }

    private showError(title: string, detail: string): void {
        this.messageService.add({
            severity: 'error',
            summary: title,
            detail: detail,
            life: 5000
        });
    }
}
