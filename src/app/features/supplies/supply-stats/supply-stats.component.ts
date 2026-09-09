import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {StatCard} from '@models/supply.model';

@Component({
    selector: 'app-supply-stats',
    standalone: true,
    imports: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './supply-stats.component.html',
    styleUrl: './supply-stats.component.scss'
})
export class SupplyStatsComponent {
    totalCount = input.required<number>();
    lowCount = input.required<number>();
    outCount = input.required<number>();

    protected stats() {
        return [
            {
                label: 'Всего позиций',
                value: this.totalCount(),
                icon: 'pi pi-check-circle',
                iconBg: '#e8f5e9',
                iconColor: '#4caf50',
            },
            {
                label: 'Заканчивается',
                value: this.lowCount(),
                icon: 'pi pi-exclamation-triangle',
                iconBg: '#fff3e0',
                iconColor: '#ff9800',
            },
            {
                label: 'В корзине',
                value: this.outCount(),
                icon: 'pi pi-shopping-cart',
                iconBg: '#ffebee',
                iconColor: '#f44336',
            },
        ] as StatCard[];
    }
}
