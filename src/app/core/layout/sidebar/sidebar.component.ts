import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@services/auth.service';

interface NavItem {
    label: string;
    icon: string;
    route: string;
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Рецепты', icon: 'pi pi-utensils', route: '/dishes' },
    { label: 'Продукты', icon: 'pi pi-box', route: '/fridge' },
    { label: 'Запасы', icon: 'pi pi-shopping-bag', route: '/supplies' },
    { label: 'Задачи', icon: 'pi pi-list-check', route: '/tasks' },
];

@Component({
    selector: 'app-sidebar',
    imports: [RouterLink, RouterLinkActive],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
    protected readonly navItems = NAV_ITEMS;

    readonly authService = inject(AuthService);
}
