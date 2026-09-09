import {inject, Injectable} from '@angular/core';
import {createClient, SupabaseClient} from '@supabase/supabase-js';
import {environment} from '@core/environments/environment';
import {MessageService} from 'primeng/api';

@Injectable({providedIn: 'root'})
export class SupabaseService {
    private readonly messageService = inject(MessageService);

    readonly client: SupabaseClient = createClient(
        environment.supabaseUrl,
        environment.supabaseKey,
        {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
            },
            global: {
                fetch: async (url, options) => {
                    const response = await fetch(url, options);

                    // Перехватывает 401 Unauthorized и 403 Forbidden от Supabase PostgREST API
                    if (response.status === 401 || response.status === 403) {
                        this.handleUnauthorized();
                    }

                    return response;
                },
            },
        }
    );

    private handleUnauthorized(): void {
        this.messageService.add({
            severity: 'error',
            summary: 'Ошибка доступа',
            detail: 'Сессия истекла или требуется авторизация в системе.',
            life: 3000,
        });
    }
}
