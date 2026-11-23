import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CouplesService } from '@features/couples';
import { QuestionCategory } from '@features/couples';

@Component({
    selector: 'app-couples-form',
    standalone: true,
    imports: [ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './couples-form.component.html',
})
export class CouplesFormComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly couplesService = inject(CouplesService);

    protected readonly isEdit = signal(false);
    protected readonly questionId = signal<string | null>(null);

    protected readonly form: FormGroup = this.fb.group({
        text: ['', [Validators.required, Validators.minLength(3)]],
        category: [null, Validators.required],
    });

    protected readonly categories = computed(() =>
        (['romantic', 'fun', 'deep', 'future', 'memories'] as QuestionCategory[]).map((c) => ({
            label: this.getCategoryLabel(c),
            value: c,
        })),
    );

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEdit.set(true);
            this.questionId.set(id);
            const question = this.couplesService.getQuestionById(id);
            if (question) {
                this.form.patchValue({
                    text: question.text,
                    category: question.category,
                });
            }
        }
    }

    getCategoryLabel(category: QuestionCategory): string {
        const labels: Record<QuestionCategory, string> = {
            romantic: 'Романтика',
            fun: 'Весёлое',
            deep: 'Глубокое',
            future: 'Будущее',
            memories: 'Воспоминания',
        };
        return labels[category];
    }

    onSubmit(): void {
        if (this.form.invalid) return;
        const data = this.form.value;
        this.couplesService.addQuestion(data).subscribe((result) => {
            if (result) this.router.navigate(['/couples']);
        });
    }

    goBack(): void {
        this.router.navigate(['/couples']);
    }
}
