import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { DishesService } from '@features/dishes';
import { DishFormData, DishIngredient } from '@features/dishes';

@Component({
    selector: 'app-dish-form',
    standalone: true,
    imports: [
        RouterLink,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        SelectModule,
        TextareaModule,
        ToastModule,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './dish-form.component.html',
    styleUrl: './dish-form.component.scss',
})
export class DishFormComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly dishesService = inject(DishesService);

    protected readonly isEdit = signal(false);
    protected readonly dishId = signal<string | null>(null);

    protected readonly difficultyOptions = [
        { label: '1 — очень простое', value: 1 },
        { label: '2 — простое', value: 2 },
        { label: '3 — среднее', value: 3 },
        { label: '4 — сложное', value: 4 },
        { label: '5 — очень сложное', value: 5 },
    ];

    protected readonly form = this.fb.group({
        name: ['', Validators.required],
        photoUrl: [''],
        cookTimeMinutes: [30, [Validators.required, Validators.min(1)]],
        difficulty: [3 as number, Validators.required],
    });

    protected readonly ingredients = signal<DishIngredient[]>([]);
    protected readonly steps = signal<string[]>([]);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEdit.set(true);
            this.dishId.set(id);
            const dish = this.dishesService.getDishById(id);
            if (dish) {
                this.form.patchValue({
                    name: dish.name,
                    photoUrl: dish.photoUrl ?? '',
                    cookTimeMinutes: dish.cookTimeMinutes,
                    difficulty: dish.difficulty,
                });
                this.ingredients.set(dish.ingredients);
                this.steps.set(dish.steps);
            }
        }
    }

    addIngredient(): void {
        this.ingredients.update((current) => [...current, { name: '', quantity: 1, unit: 'шт' }]);
    }

    removeIngredient(index: number): void {
        this.ingredients.update((current) => current.filter((_, i) => i !== index));
    }

    addStep(): void {
        this.steps.update((current) => [...current, '']);
    }

    removeStep(index: number): void {
        this.steps.update((current) => current.filter((_, i) => i !== index));
    }

    onSubmit(): void {
        if (this.form.invalid) return;

        const formData: DishFormData = {
            name: this.form.value.name!,
            photoUrl: this.form.value.photoUrl || null,
            cookTimeMinutes: this.form.value.cookTimeMinutes!,
            difficulty: this.form.value.difficulty as 1 | 2 | 3 | 4 | 5,
            ingredients: this.ingredients(),
            steps: this.steps(),
        };

        const request$ = this.isEdit()
            ? this.dishesService.updateDish(this.dishId()!, formData)
            : this.dishesService.addDish(formData);

        request$.subscribe((result) => {
            if (result) {
                this.router.navigate(['/dishes']);
            }
        });
    }
}
