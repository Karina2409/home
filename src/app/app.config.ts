import {ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideServiceWorker} from '@angular/service-worker';
import {providePrimeNG} from 'primeng/config';
import {MessageService} from 'primeng/api';
import {FamilyHearthPreset} from './assets/family-hearth-preset';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes),
        provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000',
        }),
        providePrimeNG({
            theme: {
                preset: FamilyHearthPreset,
                options: {
                    darkModeSelector: '.app-dark',
                }
            }
        }),
        MessageService
    ],
};
