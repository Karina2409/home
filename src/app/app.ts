import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {SidebarComponent} from '@layout/sidebar/sidebar.component';
import {BottomNavComponent} from '@layout/bottom-nav/bottom-nav.component';

@Component({
    selector: 'app-root',
    imports: [
        RouterOutlet, SidebarComponent, BottomNavComponent
    ],
    templateUrl: './app.html',
    styleUrl: './app.scss'
})
export class App {
}
