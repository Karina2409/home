import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';

interface NavItem {
    label: string;
    icon: string;
    route: string;
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Блюда', icon: 'pi pi-apple', route: '/dishes' },
    { label: 'Холодильник', icon: 'pi pi-box', route: '/fridge' },
    { label: 'Запасы', icon: 'pi pi-shopping-bag', route: '/supplies' },
    { label: 'Задания', icon: 'pi pi-list-check', route: '/tasks' },
    { label: 'Уборка', icon: 'pi pi-home', route: '/cleaning' },
    { label: 'Новинки', icon: 'pi pi-star', route: '/novelties' },
    { label: 'Аптечка', icon: 'pi pi-heart', route: '/firstaid' },
    { label: 'Вопросы пары', icon: 'pi pi-comments', route: '/couples' },
    { label: 'Рандомайзер', icon: 'pi pi-sync', route: '/randomizer' },
    { label: 'Настройки', icon: 'pi pi-cog', route: '/settings' },
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
