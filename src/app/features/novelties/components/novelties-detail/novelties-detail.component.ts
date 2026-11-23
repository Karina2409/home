import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NoveltyService } from '@novelties/data/novelties.service';
import { Novelty, NoveltyStatus } from '@novelties/models/novelty.model';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { RatingModule } from 'primeng/rating';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-novelties-detail',
    standalone: true,
    imports: [ButtonModule, CardModule, RatingModule, FormsModule, ToastModule, ConfirmDialogModule, DatePipe],
    providers: [ConfirmationService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './novelties-detail.component.html',
    styleUrl: './novelties-detail.component.scss',
})
export class NoveltiesDetailComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly noveltyService = inject(NoveltyService);
    private readonly confirmationService = inject(ConfirmationService);

    protected readonly novelty = signal<Novelty | null>(null);
    protected readonly noveltyRating = signal(0);

    ngOnInit(): void {
        const noveltyId = this.route.snapshot.paramMap.get('id');
        if (noveltyId) {
            const novelty = this.noveltyService.getNoveltyById(noveltyId);
            if (novelty) {
                this.novelty.set(novelty);
                this.noveltyRating.set(novelty.rating);
            }
        }
    }

    goBack(): void {
        this.router.navigate(['/novelties']);
    }

    updateStatus(status: NoveltyStatus): void {
        const novelty = this.novelty();
        if (!novelty) return;

        this.noveltyService.updateStatus(novelty.id, status).subscribe((result) => {
            if (result) {
                this.novelty.set(result);
            }
        });
    }

    deleteNovelty(): void {
        const novelty = this.novelty();
        if (!novelty) return;

        this.confirmationService.confirm({
            message: 'Вы уверены, что хотите удалить эту новинку?',
            accept: () => {
                this.noveltyService.deleteNovelty(novelty.id).subscribe((success) => {
                    if (success) {
                        this.router.navigate(['/novelties']);
                    }
                });
            },
        });
    }
}
