import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';

interface NavItem {
    label: string;
    icon: string;
    route: string;
}

const NAV_ITEMS: NavItem[] = [
    {label: 'Recipes', icon: 'pi pi-utensils', route: '/dishes'},
    {label: 'Inventory', icon: 'pi pi-box', route: '/fridge'},
    {label: 'Household', icon: 'pi pi-shopping-bag', route: '/supplies'},
    {label: 'To-Do', icon: 'pi pi-list-check', route: '/tasks'},
];

@Component({
    selector: 'app-sidebar',
    imports: [RouterLink, RouterLinkActive],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
    protected readonly navItems = NAV_ITEMS;
}
