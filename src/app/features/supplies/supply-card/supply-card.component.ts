import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {Supply} from '@models/supply.model';

@Component({
    selector: 'app-supply-card',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './supply-card.component.html',
    styleUrl: './supply-card.component.scss'
})
export class SupplyCardComponent {
    supply = input.required<Supply>();

    increment = output<string>();
    decrement = output<string>();
    delete = output<string>();

    onIncrement(): void {
        this.increment.emit(this.supply().id);
    }

    onDecrement(): void {
        this.decrement.emit(this.supply().id);
    }

    onDelete(): void {
        this.delete.emit(this.supply().id);
    }
}
