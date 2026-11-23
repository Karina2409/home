export type QuestionCategory = 'romantic' | 'fun' | 'deep' | 'future' | 'memories';

export const QUESTION_CATEGORIES: { label: string; value: QuestionCategory }[] = [
    { label: 'Романтика', value: 'romantic' },
    { label: 'Весёлые', value: 'fun' },
    { label: 'Глубокие', value: 'deep' },
    { label: 'Будущее', value: 'future' },
    { label: 'Воспоминания', value: 'memories' },
];

export interface Question {
    id: string;
    text: string;
    category: QuestionCategory;
    isAnswered: boolean;
    answer?: string;
    answeredAt?: string;
    createdAt: string;
    userId: string;
}

export interface QuestionFormData {
    text: string;
    category: QuestionCategory;
}

export interface DailyQuestion {
    id: string;
    questionId: string;
    date: string;
    answeredByUser1: boolean;
    answeredByUser2: boolean;
    user1Answer?: string;
    user2Answer?: string;
}

export interface CouplesTask {
    id: string;
    title: string;
    description: string;
    isCompleted: boolean;
    completedAt?: string;
    createdAt: string;
}

export interface CouplesTaskFormData {
    title: string;
    description: string;
}
