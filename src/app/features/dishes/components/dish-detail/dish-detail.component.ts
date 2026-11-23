import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DishesService } from '@features/dishes';
import { Dish } from '@features/dishes';

@Component({
    selector: 'app-dish-detail',
    standalone: true,
    imports: [RouterLink, ButtonModule, ConfirmDialogModule, ToastModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ConfirmationService],
    templateUrl: './dish-detail.component.html',
    styleUrl: './dish-detail.component.scss',
})
export class DishDetailComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly dishesService = inject(DishesService);
    private readonly confirmationService = inject(ConfirmationService);

    protected readonly dish = signal<Dish | null>(null);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.dish.set(this.dishesService.getDishById(id) ?? null);
        }
    }

    getDifficultyLabel(difficulty: number): string {
        return '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
    }

    onDelete(): void {
        const dish = this.dish();
        if (!dish) return;

        this.confirmationService.confirm({
            message: `Вы уверены, что хотите удалить блюдо "${dish.name}"?`,
            header: 'Подтверждение удаления',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { severity: 'danger' },
            accept: () => {
                this.dishesService.deleteDish(dish.id).subscribe((success) => {
                    if (success) {
                        this.router.navigate(['/dishes']);
                    }
                });
            },
        });
    }
}
