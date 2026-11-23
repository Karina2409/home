import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CleaningService } from '@cleaning/data/cleaning.service';
import { CleaningRoom, CleaningTask } from '@cleaning/models/cleaning.model';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-cleaning-detail',
    standalone: true,
    imports: [
        ButtonModule,
        CardModule,
        DialogModule,
        InputTextModule,
        SelectModule,
        FormsModule,
        ToastModule,
        ConfirmDialogModule,
        DatePipe,
    ],
    providers: [ConfirmationService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './cleaning-detail.component.html',
    styleUrl: './cleaning-detail.component.scss',
})
export class CleaningDetailComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly cleaningService = inject(CleaningService);
    private readonly confirmationService = inject(ConfirmationService);

    protected readonly room = signal<CleaningRoom | null>(null);
    protected readonly tasks = signal<CleaningTask[]>([]);

    protected readonly taskDialogVisible = signal(false);
    protected readonly taskFormName = signal('');
    protected readonly taskFormFrequencyType = signal('daily');

    protected readonly frequencyOptions = [
        { label: 'Ежедневно', value: 'daily' },
        { label: 'Каждые N дней', value: 'everyNDays' },
        { label: 'Еженедельно', value: 'weekly' },
        { label: 'Каждые N недель', value: 'everyNWeeks' },
        { label: 'Ежемесячно', value: 'monthly' },
    ];

    ngOnInit(): void {
        const roomId = this.route.snapshot.paramMap.get('id');
        if (roomId) {
            this.cleaningService.loadTasksByRoom(roomId).subscribe((tasks) => {
                this.tasks.set(tasks);
            });

            const rooms = this.cleaningService.rooms();
            const room = rooms.find((r) => r.id === roomId);
            if (room) {
                this.room.set(room);
            }
        }
    }

    goBack(): void {
        this.router.navigate(['/cleaning']);
    }

    openAddTaskDialog(): void {
        this.taskFormName.set('');
        this.taskFormFrequencyType.set('daily');
        this.taskDialogVisible.set(true);
    }

    saveTask(): void {
        const room = this.room();
        const name = this.taskFormName();
        const frequencyType = this.taskFormFrequencyType();
        if (!room) return;

        this.cleaningService
            .addTask({
                roomId: room.id,
                name: name,
                repeatConfig: { type: frequencyType as any },
            })
            .subscribe((result) => {
                if (result) {
                    this.taskDialogVisible.set(false);
                    this.cleaningService.loadTasksByRoom(room.id).subscribe((tasks) => {
                        this.tasks.set(tasks);
                    });
                }
            });
    }

    completeTask(task: CleaningTask): void {
        this.cleaningService.completeTask(task.id).subscribe(() => {
            const room = this.room();
            if (room) {
                this.cleaningService.loadTasksByRoom(room.id).subscribe((tasks) => {
                    this.tasks.set(tasks);
                });
            }
        });
    }

    deleteTask(task: CleaningTask): void {
        this.confirmationService.confirm({
            message: 'Вы уверены, что хотите удалить эту задачу?',
            accept: () => {
                this.cleaningService.deleteTask(task.id).subscribe(() => {
                    const room = this.room();
                    if (room) {
                        this.cleaningService.loadTasksByRoom(room.id).subscribe((tasks) => {
                            this.tasks.set(tasks);
                        });
                    }
                });
            },
        });
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'completed':
                return '#8FA18B';
            case 'due-soon':
                return '#90EE90';
            case 'due-today':
                return '#FFD700';
            case 'overdue':
                return '#FFA500';
            case 'overdue-critical':
                return '#FF6B6B';
            default:
                return '#ccc';
        }
    }
}
