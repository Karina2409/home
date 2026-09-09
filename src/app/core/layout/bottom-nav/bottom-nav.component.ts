import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';

interface NavItem {
    label: string;
    icon: string;
    route: string;
}

const NAV_ITEMS: NavItem[] = [
    {label: 'Dishes', icon: 'pi pi-utensils', route: '/dishes'},
    {label: 'Fridge', icon: 'pi pi-box', route: '/fridge'},
    {label: 'Supplies', icon: 'pi pi-shopping-bag', route: '/supplies'},
    {label: 'Tasks', icon: 'pi pi-list-check', route: '/tasks'},
];

@Component({
    selector: 'app-bottom-nav',
    imports: [RouterLink, RouterLinkActive],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './bottom-nav.component.html',
    styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
    protected readonly navItems = NAV_ITEMS;
}
