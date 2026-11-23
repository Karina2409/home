export interface Task {
    id: string;
    title: string;
    description: string | null;
    deadline: string | null;
    assignees: string[];
    repeatConfig: RepeatConfig | null;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface TaskFormData {
    title: string;
    description: string | null;
    deadline: string | null;
    assignees: string[];
    repeatConfig: RepeatConfig | null;
}

export interface RepeatConfig {
    type: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[];
    dayOfMonth?: number;
}
