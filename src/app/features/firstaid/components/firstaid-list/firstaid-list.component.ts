import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FirstaidService } from '@firstaid/data/firstaid.service';
import { APPLICATION_LABEL_NAMES, ApplicationLabel, Medicine } from '@firstaid/models/medicine.model';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-firstaid-list',
    standalone: true,
    imports: [
        ButtonModule,
        CardModule,
        DialogModule,
        InputTextModule,
        TextareaModule,
        DatePickerModule,
        MultiSelectModule,
        FormsModule,
        ToastModule,
        DatePipe,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './firstaid-list.component.html',
    styleUrl: './firstaid-list.component.scss',
})
export class FirstaidListComponent {
    private readonly firstaidService = inject(FirstaidService);
    private readonly router = inject(Router);

    protected readonly medicines = this.firstaidService.medicines;
    protected readonly loading = this.firstaidService.loading;

    protected readonly dialogVisible = signal(false);

    // Форма для диалога (не signal, так как используется с ngModel)
    protected formName = '';
    protected formExpiryDate: Date | null = null;
    protected formApplicationLabels: ApplicationLabel[] = [];
    protected formPhotoUrl: string | null = null;
    protected formApplicationMethods = '';
    protected formDescription = '';

    protected readonly labelOptions = Object.entries(APPLICATION_LABEL_NAMES).map(([value, label]) => ({
        label,
        value,
    }));

    openAddDialog(): void {
        this.formName = '';
        this.formExpiryDate = null;
        this.formApplicationLabels = [];
        this.formPhotoUrl = null;
        this.formApplicationMethods = '';
        this.formDescription = '';
        this.dialogVisible.set(true);
    }

    openMedicine(medicine: Medicine): void {
        this.router.navigate(['/firstaid', medicine.id]);
    }

    saveMedicine(): void {
        if (!this.formExpiryDate) return;

        this.firstaidService
            .addMedicine({
                name: this.formName,
                expiryDate: this.formExpiryDate.toISOString(),
                applicationLabels: this.formApplicationLabels,
                photoUrl: this.formPhotoUrl,
                applicationMethods: this.formApplicationMethods,
                description: this.formDescription,
            })
            .subscribe((result) => {
                if (result) this.dialogVisible.set(false);
            });
    }

    getLabelName(label: ApplicationLabel): string {
        return APPLICATION_LABEL_NAMES[label];
    }

    getExpiryColor(expiryDate: string): string {
        const now = new Date();
        const expiry = new Date(expiryDate);
        const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return '#ef4444';
        if (diffDays < 30) return '#f59e0b';
        return '#22c55e';
    }
}
