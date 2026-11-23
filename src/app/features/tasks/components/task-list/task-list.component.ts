import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TasksService } from '@features/tasks';

@Component({
    selector: 'app-task-list',
    standalone: true,
    imports: [RouterLink, ButtonModule, ProgressSpinnerModule, DatePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './task-list.component.html',
    styleUrl: './task-list.component.scss',
})
export class TaskListComponent {
    protected readonly tasksService = inject(TasksService);

    protected readonly activeTab = signal<'active' | 'completed'>('active');

    protected readonly loading = this.tasksService.loading;

    protected readonly filteredTasks = computed(() => {
        const tab = this.activeTab();
        return this.tasksService.tasks().filter((t) => (tab === 'active' ? !t.completed : t.completed));
    });

    onComplete(id: string, event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        this.tasksService.completeTask(id).subscribe();
    }
}
