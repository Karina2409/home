import {ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideServiceWorker} from '@angular/service-worker';
import {providePrimeNG} from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import {MessageService} from 'primeng/api';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes),
        provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000',
        }),
        provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000',
        }),
        providePrimeNG({
            theme: {
                preset: Aura
            }
        }),
        MessageService
    ],
};
