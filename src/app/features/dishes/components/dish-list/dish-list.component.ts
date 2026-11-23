import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { DishesService } from '@features/dishes';

@Component({
    selector: 'app-dish-list',
    standalone: true,
    imports: [RouterLink, FormsModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, SelectModule, ProgressSpinnerModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './dish-list.component.html',
    styleUrl: './dish-list.component.scss',
})
export class DishListComponent {
    protected readonly dishesService = inject(DishesService);

    protected readonly searchQuery = signal('');
    protected readonly difficultyFilter = signal<number | null>(null);

    protected readonly loading = this.dishesService.loading;

    protected readonly difficultyOptions = [
        { label: 'Все', value: null },
        { label: '1 звезда', value: 1 },
        { label: '2 звезды', value: 2 },
        { label: '3 звезды', value: 3 },
        { label: '4 звезды', value: 4 },
        { label: '5 звёзд', value: 5 },
    ];

    protected readonly filteredDishes = computed(() => {
        let result = this.dishesService.dishes();
        const query = this.searchQuery().toLowerCase().trim();
        if (query) {
            result = result.filter((d) => d.name.toLowerCase().includes(query));
        }
        const difficulty = this.difficultyFilter();
        if (difficulty !== null) {
            result = result.filter((d) => d.difficulty === difficulty);
        }
        return result;
    });

    getDifficultyLabel(difficulty: number): string {
        return '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
    }
}
