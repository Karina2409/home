import {ChangeDetectionStrategy, Component, effect, input, output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {DialogModule} from 'primeng/dialog';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {InputNumberModule} from 'primeng/inputnumber';
import {SelectModule} from 'primeng/select';
import {Supply, SupplyFormData} from '@models/supply.model';

const CATEGORIES = [
    {label: 'Ванная комната', value: 'Ванная комната'},
    {label: 'Гигиена', value: 'Гигиена'},
    {label: 'Хозтовары', value: 'Хозтовары'},
    {label: 'Кухня', value: 'Кухня'},
    {label: 'Кладовая', value: 'Кладовая'},
    {label: 'Хозблок', value: 'Хозблок'},
];

const UNITS = [
    {label: 'шт', value: 'шт'},
    {label: 'л', value: 'л'},
    {label: 'кг', value: 'кг'},
    {label: 'мл', value: 'мл'},
    {label: 'упак', value: 'упак'},
];

@Component({
    selector: 'app-supply-form',
    imports: [
        ReactiveFormsModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        SelectModule,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './supply-form.component.html',
    styleUrl: './supply-form.component.scss',
})
export class SupplyFormComponent {
    visible = input.required<boolean>();
    supply = input<Supply | null>(null);

    visibleChange = output<boolean>();
    submit = output<SupplyFormData>();

    protected readonly categories = CATEGORIES;
    protected readonly units = UNITS;
    protected readonly form: FormGroup;

    constructor(private fb: FormBuilder) {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            category: ['', Validators.required],
            location: ['', Validators.required],
            quantity: [0, [Validators.required, Validators.min(0)]],
            minQuantity: [0, [Validators.required, Validators.min(0)]],
            unit: ['шт', Validators.required],
        });

        effect(() => {
            const s = this.supply();
            if (s) {
                this.form.patchValue({
                    name: s.name,
                    category: s.category,
                    location: s.location,
                    quantity: s.quantity,
                    minQuantity: s.minQuantity,
                    unit: s.unit,
                });
            } else {
                this.form.reset({unit: 'шт'});
            }
        });
    }

    protected get isEdit(): () => boolean {
        return () => !!this.supply();
    }

    onVisibleChange(visible: boolean): void {
        this.visibleChange.emit(visible);
    }

    onCancel(): void {
        this.visibleChange.emit(false);
    }

    onSubmit(): void {
        if (this.form.invalid) return;
        this.submit.emit(this.form.value as SupplyFormData);
        this.visibleChange.emit(false);
        this.form.reset({unit: 'шт'});
    }
}
