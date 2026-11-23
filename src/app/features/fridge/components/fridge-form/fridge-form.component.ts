import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { FridgeService } from '@features/fridge';
import { FridgeItemFormData } from '@features/fridge';

@Component({
    selector: 'app-fridge-form',
    standalone: true,
    imports: [
        RouterLink,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        DatePickerModule,
        ToastModule,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './fridge-form.component.html',
    styleUrl: './fridge-form.component.scss',
})
export class FridgeFormComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly fridgeService = inject(FridgeService);

    protected readonly isEdit = signal(false);
    protected readonly itemId = signal<string | null>(null);

    protected readonly form = this.fb.group({
        productName: ['', Validators.required],
        photoUrl: [''],
        quantity: [1, [Validators.required, Validators.min(1)]],
        unit: ['шт', Validators.required],
        expirationDate: [null as Date | null, Validators.required],
    });

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEdit.set(true);
            this.itemId.set(id);
            const item = this.fridgeService.getItemById(id);
            if (item) {
                this.form.patchValue({
                    productName: item.productName,
                    photoUrl: item.photoUrl ?? '',
                    quantity: item.quantity,
                    unit: item.unit,
                    expirationDate: new Date(item.expirationDate),
                });
            }
        }
    }

    onSubmit(): void {
        if (this.form.invalid) return;

        const formData: FridgeItemFormData = {
            productName: this.form.value.productName!,
            photoUrl: this.form.value.photoUrl || null,
            quantity: this.form.value.quantity!,
            unit: this.form.value.unit!,
            expirationDate: this.form.value.expirationDate!.toISOString().split('T')[0],
        };

        const request$ = this.isEdit()
            ? this.fridgeService.updateItem(this.itemId()!, formData)
            : this.fridgeService.addItem(formData);

        request$.subscribe((result) => {
            if (result) {
                this.router.navigate(['/fridge']);
            }
        });
    }
}
