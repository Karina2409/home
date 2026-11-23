export type CleaningTaskStatus = 'completed' | 'due-soon' | 'due-today' | 'overdue' | 'overdue-critical';

export type FrequencyType = 'daily' | 'everyNDays' | 'weekly' | 'specificDays' | 'everyNWeeks' | 'monthly';

export interface RepeatConfig {
    type: FrequencyType;
    interval?: number;
    dayOfWeek?: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
}

export interface CleaningRoom {
    id: string;
    name: string;
    color: string;
    order: number;
    status: CleaningTaskStatus;
    taskCount: number;
    completedTaskCount: number;
}

export interface CleaningTask {
    id: string;
    roomId: string;
    name: string;
    frequency: string;
    repeatConfig: RepeatConfig;
    lastCompletedAt: string | null;
    nextDueAt: string;
    status: CleaningTaskStatus;
    createdAt: string;
}

export interface CleaningHistory {
    id: string;
    taskId: string;
    completedAt: string;
    completedBy: string;
}

export interface CleaningRoomFormData {
    name: string;
    color: string;
}

export interface CleaningTaskFormData {
    roomId: string;
    name: string;
    repeatConfig: RepeatConfig;
}
