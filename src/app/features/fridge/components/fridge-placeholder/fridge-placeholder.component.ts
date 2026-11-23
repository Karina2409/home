import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-fridge-placeholder',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './fridge-placeholder.component.html',
})
export class FridgePlaceholderComponent {}
