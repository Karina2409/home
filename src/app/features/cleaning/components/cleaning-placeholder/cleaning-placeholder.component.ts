import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-cleaning-placeholder',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './cleaning-placeholder.component.html',
})
export class CleaningPlaceholderComponent {}
