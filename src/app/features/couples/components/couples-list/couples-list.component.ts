import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { CouplesService } from '@features/couples';
import { QuestionCategory } from '@features/couples';

@Component({
    selector: 'app-couples-list',
    standalone: true,
    imports: [
        FormsModule,
        ButtonModule,
        CardModule,
        CheckboxModule,
        DialogModule,
        InputTextModule,
        ProgressSpinnerModule,
        SelectModule,
        TabsModule,
        TagModule,
        ToastModule,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './couples-list.component.html',
})
export class CouplesListComponent {
    private readonly couplesService = inject(CouplesService);

    protected readonly questions = this.couplesService.questions;
    protected readonly tasks = this.couplesService.tasks;
    protected readonly loading = this.couplesService.loading;
    protected readonly dailyQuestion = this.couplesService.dailyQuestion;

    protected readonly searchQuery = signal('');
    protected readonly selectedCategory = signal<QuestionCategory | null>(null);
    protected readonly showAnswered = signal(true);

    protected readonly questionDialogVisible = signal(false);
    protected readonly newQuestionText = signal('');
    protected readonly newQuestionCategory = signal<QuestionCategory | null>(null);

    protected readonly taskDialogVisible = signal(false);
    protected readonly newTaskTitle = signal('');
    protected readonly newTaskDescription = signal('');

    protected readonly answerInputs: Record<string, string> = {};

    protected readonly categories = computed(() =>
        (['romantic', 'fun', 'deep', 'future', 'memories'] as QuestionCategory[]).map((c) => ({
            label: this.getCategoryLabel(c),
            value: c,
        })),
    );

    protected readonly allCategories = computed(() =>
        (['romantic', 'fun', 'deep', 'future', 'memories'] as QuestionCategory[]).map((c) => ({
            label: this.getCategoryLabel(c),
            value: c,
        })),
    );

    protected readonly filteredQuestions = computed(() => {
        let result = this.questions();
        const query = this.searchQuery().toLowerCase().trim();
        if (query) {
            result = result.filter((q) => q.text.toLowerCase().includes(query));
        }
        const selectedCat = this.selectedCategory();
        if (selectedCat) {
            result = result.filter((q) => q.category === selectedCat);
        }
        if (!this.showAnswered()) {
            result = result.filter((q) => !q.isAnswered);
        }
        return result;
    });

    protected readonly completedTasksCount = computed(() => this.tasks().filter((t) => t.isCompleted).length);

    getCategoryLabel(category: QuestionCategory): string {
        const labels: Record<QuestionCategory, string> = {
            romantic: 'Романтика',
            fun: 'Веселье',
            deep: 'Глубокие',
            future: 'Будущее',
            memories: 'Воспоминания',
        };
        return labels[category];
    }

    getCategorySeverity(category: QuestionCategory): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const severities: Record<QuestionCategory, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> =
            {
                romantic: 'danger',
                fun: 'success',
                deep: 'info',
                future: 'warn',
                memories: 'secondary',
            };
        return severities[category];
    }

    getQuestionText(questionId: string): string {
        const question = this.questions().find((q) => q.id === questionId);
        return question?.text ?? '';
    }

    openAddQuestion(): void {
        this.newQuestionText.set('');
        this.newQuestionCategory.set(null);
        this.questionDialogVisible.set(true);
    }

    openAddTask(): void {
        this.newTaskTitle.set('');
        this.newTaskDescription.set('');
        this.taskDialogVisible.set(true);
    }

    submitQuestion(): void {
        const text = this.newQuestionText().trim();
        const category = this.newQuestionCategory();
        if (!text || !category) return;

        this.couplesService.addQuestion({ text, category }).subscribe((result) => {
            if (result) this.questionDialogVisible.set(false);
        });
    }

    submitTask(): void {
        const title = this.newTaskTitle().trim();
        if (!title) return;

        this.couplesService
            .addTask({
                title,
                description: this.newTaskDescription(),
            })
            .subscribe((result) => {
                if (result) this.taskDialogVisible.set(false);
            });
    }

    toggleTask(taskId: string): void {
        this.couplesService.toggleTask(taskId).subscribe();
    }

    deleteQuestion(questionId: string): void {
        this.couplesService.deleteQuestion(questionId).subscribe();
    }

    deleteTask(taskId: string): void {
        this.couplesService.deleteTask(taskId).subscribe();
    }

    answerQuestion(questionId: string): void {
        const answer = this.answerInputs[questionId];
        if (answer?.trim()) {
            this.couplesService.answerQuestion(questionId, answer).subscribe();
        }
    }
}
