import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { FridgeService } from '@features/fridge';
import { FridgeItem } from '@features/fridge';

@Component({
    selector: 'app-fridge-detail',
    standalone: true,
    imports: [RouterLink, ButtonModule, ConfirmDialogModule, ToastModule, DatePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ConfirmationService],
    templateUrl: './fridge-detail.component.html',
    styleUrl: './fridge-detail.component.scss',
})
export class FridgeDetailComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly fridgeService = inject(FridgeService);
    private readonly confirmationService = inject(ConfirmationService);

    protected readonly item = signal<FridgeItem | null>(null);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.item.set(this.fridgeService.getItemById(id) ?? null);
        }
    }

    onDelete(): void {
        const item = this.item();
        if (!item) return;

        this.confirmationService.confirm({
            message: `Вы уверены, что хотите удалить продукт "${item.productName}"?`,
            header: 'Подтверждение удаления',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { severity: 'danger' },
            accept: () => {
                this.fridgeService.deleteItem(item.id).subscribe((success) => {
                    if (success) {
                        this.router.navigate(['/fridge']);
                    }
                });
            },
        });
    }
}
