import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { FridgeService } from '@features/fridge';
import { FridgeItemStatus } from '@features/fridge';

@Component({
    selector: 'app-fridge-list',
    standalone: true,
    imports: [RouterLink, FormsModule, DatePipe, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, SelectModule, ProgressSpinnerModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './fridge-list.component.html',
    styleUrl: './fridge-list.component.scss',
})
export class FridgeListComponent {
    protected readonly fridgeService = inject(FridgeService);

    protected readonly searchQuery = signal('');
    protected readonly statusFilter = signal<FridgeItemStatus | null>(null);

    protected readonly loading = this.fridgeService.loading;

    protected readonly statusOptions = [
        { label: 'Все', value: null },
        { label: 'Просрочено', value: 'expired' },
        { label: 'Истекает сегодня', value: 'expiring_today' },
        { label: 'Истекает скоро', value: 'expiring_soon' },
        { label: 'Нормально', value: 'ok' },
    ];

    protected readonly filteredItems = computed(() => {
        let result = this.fridgeService.items();
        const query = this.searchQuery().toLowerCase().trim();
        if (query) {
            result = result.filter((i) => i.productName.toLowerCase().includes(query));
        }
        const status = this.statusFilter();
        if (status !== null) {
            result = result.filter((i) => i.status === status);
        }
        return result;
    });

    getStatusColor(status: FridgeItemStatus): string {
        switch (status) {
            case 'expired':
                return 'bg-red-500';
            case 'expiring_today':
                return 'bg-orange-500';
            case 'expiring_soon':
                return 'bg-yellow-500';
            case 'ok':
                return 'bg-green-500';
        }
    }

    getStatusLabel(status: FridgeItemStatus): string {
        switch (status) {
            case 'expired':
                return 'Просрочено';
            case 'expiring_today':
                return 'Истекает сегодня';
            case 'expiring_soon':
                return 'Истекает скоро';
            case 'ok':
                return 'Нормально';
        }
    }
}
