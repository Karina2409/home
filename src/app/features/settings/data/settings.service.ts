import { inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from '@services/supabase.service';
import { MessageService } from 'primeng/api';
import { catchError, finalize, from, map, Observable, of, tap } from 'rxjs';
import { ThemeMode, UserSettings, UserSettingsUpdate, VisibleTab } from '@features/settings';

interface SettingsRow {
    id: string;
    user_id: string;
    theme: ThemeMode;
    visible_tabs: VisibleTab[];
    push_enabled: boolean;
    push_task_deadline: boolean;
    push_task_assigned: boolean;
    push_fridge_expiry: boolean;
    updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
    private readonly supabase = inject(SupabaseService).client;
    private readonly messageService = inject(MessageService);

    private readonly _settings = signal<UserSettings | null>(null);
    readonly settings = this._settings.asReadonly();

    private readonly _loading = signal(false);
    readonly loading = this._loading.asReadonly();

    constructor() {
        this.loadSettings().subscribe();
    }

    loadSettings(): Observable<UserSettings | null> {
        this._loading.set(true);
        return from(this.supabase.from('user_settings').select('*').maybeSingle()).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return data ? this.fromRow(data as SettingsRow) : null;
            }),
            tap((settings) => this._settings.set(settings)),
            catchError((err) => {
                this.handleError('Ошибка загрузки настроек', err);
                return of(null);
            }),
            finalize(() => this._loading.set(false)),
        );
    }

    updateSettings(data: UserSettingsUpdate): Observable<UserSettings | null> {
        const current = this._settings();
        if (!current) return of(null);

        const updateData: Partial<SettingsRow> = {};
        if (data.theme !== undefined) updateData.theme = data.theme;
        if (data.visibleTabs !== undefined) updateData.visible_tabs = data.visibleTabs;
        if (data.pushEnabled !== undefined) updateData.push_enabled = data.pushEnabled;
        if (data.pushTaskDeadline !== undefined) updateData.push_task_deadline = data.pushTaskDeadline;
        if (data.pushTaskAssigned !== undefined) updateData.push_task_assigned = data.pushTaskAssigned;
        if (data.pushFridgeExpiry !== undefined) updateData.push_fridge_expiry = data.pushFridgeExpiry;
        updateData.updated_at = new Date().toISOString();

        return from(this.supabase.from('user_settings').update(updateData).eq('id', current.id).select().single()).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return this.fromRow(data as SettingsRow);
            }),
            tap((updated) => this._settings.set(updated)),
            tap(() => this.messageService.add({ severity: 'success', summary: 'Настройки сохранены' })),
            catchError((err) => {
                this.handleError('Ошибка сохранения настроек', err);
                return of(null);
            }),
        );
    }

    private fromRow(row: SettingsRow): UserSettings {
        return {
            id: row.id,
            userId: row.user_id,
            theme: row.theme,
            visibleTabs: row.visible_tabs,
            pushEnabled: row.push_enabled,
            pushTaskDeadline: row.push_task_deadline,
            pushTaskAssigned: row.push_task_assigned,
            pushFridgeExpiry: row.push_fridge_expiry,
            updatedAt: row.updated_at,
        };
    }

    private handleError(summary: string, error: unknown): void {
        console.error(error);
        this.messageService.add({ severity: 'error', summary, detail: String(error) });
    }
}
