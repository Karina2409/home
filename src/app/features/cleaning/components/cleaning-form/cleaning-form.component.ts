import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CleaningService } from '@cleaning/data/cleaning.service';
import { ButtonModule } from 'primeng/button';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-cleaning-form',
    standalone: true,
    imports: [ReactiveFormsModule, ButtonModule, InputTextModule, ColorPickerModule, ToastModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './cleaning-form.component.html',
    styleUrl: './cleaning-form.component.scss',
})
export class CleaningFormComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly cleaningService = inject(CleaningService);

    protected readonly isEdit = signal(false);
    protected readonly roomId = signal<string | null>(null);

    protected readonly form = this.fb.nonNullable.group({
        name: ['', Validators.required],
        color: ['#C26D55', Validators.required],
    });

    ngOnInit(): void {
        // Если есть roomId в query params, это режим редактирования
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) {
            this.isEdit.set(true);
            this.roomId.set(id);
            this.loadRoom(id);
        }
    }

    private loadRoom(id: string): void {
        const rooms = this.cleaningService.rooms();
        const room = rooms.find((r) => r.id === id);
        if (room) {
            this.form.patchValue({
                name: room.name,
                color: room.color,
            });
        }
    }

    onSubmit(): void {
        if (this.form.invalid) return;

        const formData = this.form.getRawValue();
        const currentRoomId = this.roomId();

        if (currentRoomId) {
            this.cleaningService.updateRoom(currentRoomId, formData).subscribe((result) => {
                if (result) this.goBack();
            });
        } else {
            this.cleaningService.addRoom(formData).subscribe((result) => {
                if (result) this.goBack();
            });
        }
    }

    goBack(): void {
        this.router.navigate(['/cleaning']);
    }
}
