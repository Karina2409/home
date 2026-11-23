import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { SupplyService } from './data/supplies.service';
import { Supply, SupplyFormData } from './models/supply.model';
import { SupplyCardComponent } from './supply-card/supply-card.component';
import { SupplyFormComponent } from './supply-form/supply-form.component';
import { SupplyStatsComponent } from './supply-stats/supply-stats.component';

@Component({
    selector: 'app-supplies-page',
    standalone: true,
    imports: [
        FormsModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        ButtonModule,
        ProgressSpinnerModule,
        ToastModule,
        SupplyStatsComponent,
        SupplyCardComponent,
        SupplyFormComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './supplies-page.component.html',
    styleUrl: './supplies-page.component.scss',
})
export class SuppliesPageComponent {
    private readonly supplyService = inject(SupplyService);
    private readonly destroyRef = inject(DestroyRef);

    protected readonly searchQuery = signal('');
    protected readonly dialogVisible = signal(false);
    protected readonly selectedSupply = signal<Supply | null>(null);

    protected readonly loading = this.supplyService.loading;

    protected readonly totalCount = computed(() => this.supplyService.supplies().length);
    protected readonly lowCount = computed(
        () => this.supplyService.supplies().filter((s) => s.status === 'low').length,
    );
    protected readonly outCount = computed(
        () => this.supplyService.supplies().filter((s) => s.status === 'out').length,
    );

    protected readonly filteredSupplies = computed(() => {
        const query = this.searchQuery().toLowerCase().trim();
        if (!query) return this.supplyService.supplies();
        return this.supplyService
            .supplies()
            .filter(
                (s) =>
                    s.name.toLowerCase().includes(query) ||
                    s.category.toLowerCase().includes(query) ||
                    s.location.toLowerCase().includes(query),
            );
    });

    openAddDialog(): void {
        this.selectedSupply.set(null);
        this.dialogVisible.set(true);
    }

    onIncrement(id: string): void {
        this.supplyService.updateQuantity(id, 1).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }

    onDecrement(id: string): void {
        this.supplyService.updateQuantity(id, -1).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }

    onDelete(id: string): void {
        this.supplyService.deleteSupply(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
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
