import {inject, Injectable, signal} from '@angular/core';
import {Router} from '@angular/router';
import {SupabaseService} from '@core/services/supabase.service';
import {User, Session} from '@supabase/supabase-js';
import {MessageService} from 'primeng/api';
import {from, Observable, of} from 'rxjs';
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

    // Проверка авторизации для шаблонов
    get isAuthenticated(): boolean {
        return !!this.session();
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
            tap(() => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Успешно',
                    detail: 'Вы вошли в систему'
                });
                this.router.navigate(['/supplies']);
            }),
            catchError((err) => {
                this.showError('Ошибка входа', err.message);
                return of(false);
            }),
            tap(() => this.loading.set(false))
        );
    }

    // Регистрация нового пользователя
    // Благодаря вашему триггеру on_auth_user_created в Supabase автоматически создастся запись в public.profiles
    register(credentials: AuthCredentials): Observable<boolean> {
        this.loading.set(true);

        return from(
            this.supabase.auth.signUp({
                email: credentials.email,
                password: credentials.password,
                options: {
                    data: {
                        full_name: credentials.fullName || credentials.email.split('@')[0]
                    }
                }
            })
        ).pipe(
            map(({error}) => {
                if (error) throw error;
                return true;
            }),
            tap(() => {
                this.messageService.add({
                    severity: 'info',
                    summary: 'Регистрация успешна',
                    detail: 'Если включено подтверждение — проверьте почту, иначе можете войти.'
                });
            }),
            catchError((err) => {
                this.showError('Ошибка регистрации', err.message);
                return of(false);
            }),
            tap(() => this.loading.set(false))
        );
    }

    // Выход из системы
    logout(): Observable<boolean> {
        return from(this.supabase.auth.signOut()).pipe(
            map(({error}) => {
                if (error) throw error;
                return true;
            }),
            tap(() => {
                this.session.set(null);
                this.currentUser.set(null);
                this.router.navigate(['/login']);
            }),
            catchError((err) => {
                this.showError('Ошибка выхода', err.message);
                return of(false);
            })
        );
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
