import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-settings-page',
    templateUrl: './settings-page.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent {}
