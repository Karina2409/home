import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TasksService } from '@features/tasks';
import { RepeatConfig, Task } from '@features/tasks';

@Component({
    selector: 'app-task-detail',
    standalone: true,
    imports: [RouterLink, ButtonModule, ConfirmDialogModule, ToastModule, DatePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ConfirmationService],
    templateUrl: './task-detail.component.html',
    styleUrl: './task-detail.component.scss',
})
export class TaskDetailComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly tasksService = inject(TasksService);
    private readonly confirmationService = inject(ConfirmationService);

    protected readonly task = signal<Task | null>(null);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.task.set(this.tasksService.getTaskById(id) ?? null);
        }
    }

    getRepeatLabel(config: RepeatConfig): string {
        switch (config.type) {
            case 'daily':
                return 'Ежедневно';
            case 'weekly':
                return `Еженедельно (${config.daysOfWeek?.join(', ')})`;
            case 'monthly':
                return `Ежемесячно (${config.dayOfMonth}-го числа)`;
            default:
                return 'Не повторяется';
        }
    }

    onComplete(): void {
        const task = this.task();
        if (!task) return;

        this.tasksService.completeTask(task.id).subscribe((success) => {
            if (success) {
                this.task.update((t) => (t ? { ...t, completed: true } : null));
            }
        });
    }

    onDelete(): void {
        const task = this.task();
        if (!task) return;

        this.confirmationService.confirm({
            message: `Вы уверены, что хотите удалить задание "${task.title}"?`,
            header: 'Подтверждение удаления',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { severity: 'danger' },
            accept: () => {
                this.tasksService.deleteTask(task.id).subscribe((success) => {
                    if (success) {
                        this.router.navigate(['/tasks']);
                    }
                });
            },
        });
    }
}
