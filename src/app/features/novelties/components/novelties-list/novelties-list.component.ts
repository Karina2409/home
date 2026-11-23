import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { NoveltyService } from '@features/novelties';
import { Novelty } from '@features/novelties';

@Component({
    selector: 'app-novelties-list',
    standalone: true,
    imports: [
        ButtonModule,
        CardModule,
        DialogModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        TabsModule,
        FormsModule,
        ToastModule,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './novelties-list.component.html',
    styleUrl: './novelties-list.component.scss',
})
export class NoveltiesListComponent {
    private readonly noveltyService = inject(NoveltyService);
    private readonly router = inject(Router);

    protected readonly novelties = this.noveltyService.novelties;
    protected readonly loading = this.noveltyService.loading;

    protected readonly dialogVisible = signal(false);

    protected formName = '';
    protected formDescription = '';
    protected formPhotoUrl: string | null = null;

    protected readonly wantNovelties = computed(() => this.novelties().filter((n) => n.status === 'want'));

    protected readonly likedNovelties = computed(() => this.novelties().filter((n) => n.status === 'liked'));

    protected readonly dislikedNovelties = computed(() => this.novelties().filter((n) => n.status === 'disliked'));

    openAddDialog(): void {
        this.formName = '';
        this.formDescription = '';
        this.formPhotoUrl = null;
        this.dialogVisible.set(true);
    }

    closeDialog(): void {
        this.dialogVisible.set(false);
    }

    openNovelty(novelty: Novelty): void {
        this.router.navigate(['/novelties', novelty.id]);
    }

    saveNovelty(): void {
        this.noveltyService
            .addNovelty({
                name: this.formName,
                description: this.formDescription,
                photoUrl: this.formPhotoUrl,
                status: 'want',
            })
            .subscribe((result) => {
                if (result) this.dialogVisible.set(false);
            });
    }
}
