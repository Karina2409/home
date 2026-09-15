import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    readonly isDarkMode = signal<boolean>(false);

    constructor() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
        this.setTheme(isDark);
    }

    toggleTheme(): void {
        this.setTheme(!this.isDarkMode());
    }

    private setTheme(isDark: boolean): void {
        this.isDarkMode.set(isDark);
        const element = document.querySelector('html');

        if (element) {
            if (isDark) {
                element.classList.add('app-dark');
            } else {
                element.classList.remove('app-dark');
            }
        }

        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
}
