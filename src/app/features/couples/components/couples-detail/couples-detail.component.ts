import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { CouplesService } from '@features/couples';
import { QuestionCategory } from '@features/couples';

@Component({
    selector: 'app-couples-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TagModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './couples-detail.component.html',
})
export class CouplesDetailComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly couplesService = inject(CouplesService);

    protected readonly question = signal(this.couplesService.questions().find((q) => q.id === '') ?? null);
    protected readonly answer = signal('');

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            const q = this.couplesService.getQuestionById(id);
            this.question.set(q ?? null);
            if (q?.answer) {
                this.answer.set(q.answer);
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

    getCategorySeverity(category: QuestionCategory): 'danger' | 'success' | 'warn' | 'info' | 'secondary' {
        const severities: Record<QuestionCategory, 'danger' | 'success' | 'warn' | 'info' | 'secondary'> = {
            romantic: 'danger',
            fun: 'success',
            deep: 'warn',
            future: 'info',
            memories: 'secondary',
        };
        return severities[category];
    }

    submitAnswer(): void {
        const q = this.question();
        const answer = this.answer();
        if (!q || !answer.trim()) return;
        this.couplesService.answerQuestion(q.id, answer).subscribe((updated) => {
            if (updated) this.question.set(updated);
        });
    }

    goBack(): void {
        this.router.navigate(['/couples']);
    }
}
