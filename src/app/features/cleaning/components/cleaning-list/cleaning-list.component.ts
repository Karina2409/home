import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CleaningService } from '@cleaning/data/cleaning.service';
import { CleaningRoom } from '@cleaning/models/cleaning.model';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ColorPickerModule } from 'primeng/colorpicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-cleaning-list',
    standalone: true,
    imports: [ButtonModule, CardModule, DialogModule, InputTextModule, ColorPickerModule, FormsModule, ToastModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './cleaning-list.component.html',
    styleUrl: './cleaning-list.component.scss',
})
export class CleaningListComponent {
    private readonly cleaningService = inject(CleaningService);
    private readonly router = inject(Router);

    protected readonly rooms = this.cleaningService.rooms;
    protected readonly loading = this.cleaningService.loading;

    protected readonly dialogVisible = signal(false);
    protected readonly selectedRoom = signal<CleaningRoom | null>(null);
    protected readonly roomFormName = signal('');
    protected readonly roomFormColor = signal('#C26D55');

    openAddRoomDialog(): void {
        this.selectedRoom.set(null);
        this.roomFormName.set('');
        this.roomFormColor.set('#C26D55');
        this.dialogVisible.set(true);
    }

    openRoom(room: CleaningRoom): void {
        this.router.navigate(['/cleaning', room.id]);
    }

    saveRoom(): void {
        const name = this.roomFormName();
        const color = this.roomFormColor();
        const currentRoom = this.selectedRoom();

        if (currentRoom) {
            this.cleaningService.updateRoom(currentRoom.id, { name, color }).subscribe((result) => {
                if (result) this.dialogVisible.set(false);
            });
        } else {
            this.cleaningService.addRoom({ name, color }).subscribe((result) => {
                if (result) this.dialogVisible.set(false);
            });
        }
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
