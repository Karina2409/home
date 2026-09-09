import {Component, input, output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './header.component.html'
})
export class HeaderComponent {
    // Входные параметры (Inputs в виде Angular Signal Inputs)
    totalCount = input<number>(0);
    searchQuery = input<string>('');

    // События наружу (Outputs)
    searchQueryChange = output<string>();
    openAddModal = output<void>();

    onSearchChange(value: string): void {
        this.searchQueryChange.emit(value);
    }
}
