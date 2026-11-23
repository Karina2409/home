import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FirstaidService } from '@firstaid/data/firstaid.service';
import { APPLICATION_LABEL_NAMES, Medicine } from '@firstaid/models/medicine.model';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-firstaid-detail',
    standalone: true,
    imports: [ButtonModule, CardModule, ToastModule, ConfirmDialogModule, DatePipe],
    providers: [ConfirmationService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './firstaid-detail.component.html',
    styleUrl: './firstaid-detail.component.scss',
})
export class FirstaidDetailComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly firstaidService = inject(FirstaidService);
    private readonly confirmationService = inject(ConfirmationService);

    protected readonly medicine = signal<Medicine | null>(null);

    ngOnInit(): void {
        const medicineId = this.route.snapshot.paramMap.get('id');
        if (medicineId) {
            const medicine = this.firstaidService.getMedicineById(medicineId);
            if (medicine) {
                this.medicine.set(medicine);
            }
        }
    }

    goBack(): void {
        this.router.navigate(['/firstaid']);
    }

    getLabelName(label: string): string {
        return APPLICATION_LABEL_NAMES[label as keyof typeof APPLICATION_LABEL_NAMES];
    }

    isExpired(expiryDate: string): boolean {
        return this.firstaidService.isExpired(expiryDate);
    }

    isExpiringSoon(expiryDate: string): boolean {
        return this.firstaidService.isExpiringSoon(expiryDate, 30);
    }

    getExpiryTextColor(expiryDate: string): string {
        if (this.isExpired(expiryDate)) {
            return '#FF6B6B';
        }
        if (this.isExpiringSoon(expiryDate)) {
            return '#FFA500';
        }
        return '#8FA18B';
    }

    deleteMedicine(): void {
        const medicine = this.medicine();
        if (!medicine) return;

        this.confirmationService.confirm({
            message: 'Вы уверены, что хотите удалить это лекарство?',
            accept: () => {
                this.firstaidService.deleteMedicine(medicine.id).subscribe((success) => {
                    if (success) {
                        this.router.navigate(['/firstaid']);
                    }
                });
            },
        });
    }
}
