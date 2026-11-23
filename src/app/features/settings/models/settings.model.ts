export type ThemeMode = 'light' | 'dark' | 'system';

export const ThemeMode = {
    Light: 'light' as ThemeMode,
    Dark: 'dark' as ThemeMode,
    System: 'system' as ThemeMode,
};

export type VisibleTab =
    | 'dishes'
    | 'fridge'
    | 'supplies'
    | 'tasks'
    | 'cleaning'
    | 'novelties'
    | 'firstaid'
    | 'couples'
    | 'randomizer';

export interface UserSettings {
    id: string;
    userId: string;
    theme: ThemeMode;
    visibleTabs: VisibleTab[];
    pushEnabled: boolean;
    pushTaskDeadline: boolean;
    pushTaskAssigned: boolean;
    pushFridgeExpiry: boolean;
    updatedAt: string;
}

export interface UserSettingsUpdate {
    theme?: ThemeMode;
    visibleTabs?: VisibleTab[];
    pushEnabled?: boolean;
    pushTaskDeadline?: boolean;
    pushTaskAssigned?: boolean;
    pushFridgeExpiry?: boolean;
}
