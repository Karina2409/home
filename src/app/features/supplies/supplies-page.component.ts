import {ChangeDetectionStrategy, Component, computed, inject, signal, DestroyRef} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {InputTextModule} from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {ToastModule} from 'primeng/toast';
import {SupplyStatsComponent} from '@supplies/supply-stats/supply-stats.component';
import {SupplyFormComponent} from '@supplies/supply-form/supply-form.component';
import {Supply, SupplyFormData} from '@models/supply.model';
import {SupplyCardComponent} from '@supplies/supply-card/supply-card.component';
import {SupplyService} from '@services/supplies.service';

@Component({
    selector: 'app-supplies-page',
    standalone: true,
    imports: [
        FormsModule,
        InputTextModule,
        ButtonModule,
        ProgressSpinnerModule,
        ToastModule,
        SupplyStatsComponent,
        SupplyCardComponent,
        SupplyFormComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './supplies-page.component.html',
})
export class SuppliesPageComponent {
    private readonly supplyService = inject(SupplyService);
    private readonly destroyRef = inject(DestroyRef);

    protected readonly searchQuery = signal('');
    protected readonly dialogVisible = signal(false);
    protected readonly selectedSupply = signal<Supply | null>(null);

    protected readonly loading = this.supplyService.loading;

    protected readonly totalCount = computed(() => this.supplyService.supplies().length);
    protected readonly lowCount = computed(() =>
        this.supplyService.supplies().filter((s) => s.status === 'low').length
    );
    protected readonly outCount = computed(() =>
        this.supplyService.supplies().filter((s) => s.status === 'out').length
    );

    protected readonly filteredSupplies = computed(() => {
        const query = this.searchQuery().toLowerCase().trim();
        if (!query) return this.supplyService.supplies();
        return this.supplyService.supplies().filter(
            (s) =>
                s.name.toLowerCase().includes(query) ||
                s.category.toLowerCase().includes(query) ||
                s.location.toLowerCase().includes(query)
        );
    });

    openAddDialog(): void {
        this.selectedSupply.set(null);
        this.dialogVisible.set(true);
    }

    onIncrement(id: string): void {
        this.supplyService
            .updateQuantity(id, 1)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
    }

    onDecrement(id: string): void {
        this.supplyService
            .updateQuantity(id, -1)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
    }

    onDelete(id: string): void {
        this.supplyService
            .deleteSupply(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
    }

    onFormSubmit(data: SupplyFormData): void {
        const currentSelected = this.selectedSupply();
        const request$ = currentSelected
            ? this.supplyService.updateSupply(currentSelected.id, data)
            : this.supplyService.addSupply(data);

        request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
            if (result) {
                this.dialogVisible.set(false);
            }
        });
    }
}
