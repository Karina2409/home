import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from '@layout/bottom-nav/bottom-nav.component';
import { SidebarComponent } from '@layout/sidebar/sidebar.component';
import { AuthService } from '@services/auth.service';
import { ProgressSpinner } from 'primeng/progressspinner';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, SidebarComponent, BottomNavComponent, ProgressSpinner],
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {
    readonly authService = inject(AuthService);
}
