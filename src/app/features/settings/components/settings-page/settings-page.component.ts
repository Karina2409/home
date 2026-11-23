import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SettingsService } from '@features/settings';
import { ThemeMode, VisibleTab } from '@features/settings';

@Component({
    selector: 'app-settings-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        CheckboxModule,
        DividerModule,
        ToggleSwitchModule,
        ProgressSpinnerModule,
        SelectButtonModule,
        ToastModule,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './settings-page.component.html',
})
export class SettingsPageComponent {
    private readonly settingsService = inject(SettingsService);

    protected readonly settings = this.settingsService.settings;
    protected readonly loading = this.settingsService.loading;

    protected readonly themeOptions = [
        { label: 'Светлая', value: ThemeMode.Light },
        { label: 'Тёмная', value: ThemeMode.Dark },
        { label: 'Системная', value: ThemeMode.System },
    ];

    protected readonly allTabs: VisibleTab[] = [
        'dishes',
        'fridge',
        'supplies',
        'tasks',
        'cleaning',
        'novelties',
        'firstaid',
        'couples',
        'randomizer',
    ];

    protected readonly tabLabels: Record<VisibleTab, string> = {
        dishes: 'Блюда',
        fridge: 'Холодильник',
        supplies: 'Запасы',
        tasks: 'Задания',
        cleaning: 'Уборка',
        novelties: 'Новинки',
        firstaid: 'Аптечка',
        couples: 'Вопросы пары',
        randomizer: 'Рандомайзер',
    };

    protected readonly theme = computed(() => this.settings()?.theme ?? ThemeMode.System);
    protected readonly pushEnabled = computed(() => this.settings()?.pushEnabled ?? false);
    protected readonly visibleTabs = computed(() => this.settings()?.visibleTabs ?? []);

    onThemeChange(mode: ThemeMode): void {
        this.settingsService.updateSettings({ theme: mode }).subscribe();
    }

    onPushToggle(enabled: boolean): void {
        this.settingsService.updateSettings({ pushEnabled: enabled }).subscribe();
    }

    onTabToggle(tab: VisibleTab, checked: boolean): void {
        const current = this.visibleTabs();
        const updated = checked ? [...current, tab] : current.filter((t) => t !== tab);
        if (updated.length > 0) {
            this.settingsService.updateSettings({ visibleTabs: updated }).subscribe();
        }
    }

    isTabVisible(tab: VisibleTab): boolean {
        return this.visibleTabs().includes(tab);
    }
}
