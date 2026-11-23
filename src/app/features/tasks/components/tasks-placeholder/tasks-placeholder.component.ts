import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-tasks-placeholder',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './tasks-placeholder.component.html',
})
export class TasksPlaceholderComponent {}
