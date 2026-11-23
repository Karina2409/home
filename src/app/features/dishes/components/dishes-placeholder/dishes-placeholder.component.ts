import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-dishes-placeholder',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './dishes-placeholder.component.html',
})
export class DishesPlaceholderComponent {}
