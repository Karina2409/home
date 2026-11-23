import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-novelties-placeholder',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './novelties-placeholder.component.html',
})
export class NoveltiesPlaceholderComponent {}
