import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TasksService } from '@features/tasks';
import { RepeatConfig, TaskFormData } from '@features/tasks';

@Component({
    selector: 'app-task-form',
    standalone: true,
    imports: [
        RouterLink,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        DatePickerModule,
        SelectModule,
        ToastModule,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './task-form.component.html',
    styleUrl: './task-form.component.scss',
})
export class TaskFormComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly tasksService = inject(TasksService);

    protected readonly isEdit = signal(false);
    protected readonly taskId = signal<string | null>(null);

    protected readonly repeatOptions = [
        { label: 'Не повторять', value: 'none' },
        { label: 'Ежедневно', value: 'daily' },
        { label: 'Еженедельно', value: 'weekly' },
        { label: 'Ежемесячно', value: 'monthly' },
    ];

    protected readonly form = this.fb.group({
        title: ['', Validators.required],
        description: [''],
        deadline: [null as Date | null],
        repeatType: ['none'],
    });

    protected readonly assignees = signal<string[]>([]);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEdit.set(true);
            this.taskId.set(id);
            const task = this.tasksService.getTaskById(id);
            if (task) {
                this.form.patchValue({
                    title: task.title,
                    description: task.description,
                    deadline: task.deadline ? new Date(task.deadline) : null,
                    repeatType: task.repeatConfig?.type ?? 'none',
                });
                this.assignees.set(task.assignees);
            }
        }
    }

    addAssignee(): void {
        this.assignees.update((current) => [...current, '']);
    }

    removeAssignee(index: number): void {
        this.assignees.update((current) => current.filter((_, i) => i !== index));
    }

    onSubmit(): void {
        if (this.form.invalid) return;

        const repeatType = this.form.value.repeatType;
        let repeatConfig: RepeatConfig | null = null;

        if (repeatType && repeatType !== 'none') {
            repeatConfig = {
                type: repeatType as 'daily' | 'weekly' | 'monthly',
                daysOfWeek: repeatType === 'weekly' ? [1, 3, 5] : undefined,
                dayOfMonth: repeatType === 'monthly' ? 1 : undefined,
            };
        }

        const formData: TaskFormData = {
            title: this.form.value.title!,
            description: this.form.value.description || null,
            deadline: this.form.value.deadline ? this.form.value.deadline.toISOString().split('T')[0] : null,
            assignees: this.assignees().filter((a) => a.trim() !== ''),
            repeatConfig,
        };

        const request$ = this.isEdit()
            ? this.tasksService.updateTask(this.taskId()!, formData)
            : this.tasksService.addTask(formData);

        request$.subscribe((result) => {
            if (result) {
                this.router.navigate(['/tasks']);
            }
        });
    }
}
