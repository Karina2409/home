import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-firstaid-placeholder',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './firstaid-placeholder.component.html',
})
export class FirstaidPlaceholderComponent {}
