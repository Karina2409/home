export type ApplicationLabel =
    | 'head'
    | 'stomach'
    | 'throat'
    | 'ears'
    | 'menstrual'
    | 'nose'
    | 'teeth'
    | 'skin'
    | 'other';

export interface Medicine {
    id: string;
    name: string;
    photoUrl: string | null;
    expiryDate: string;
    applicationLabels: ApplicationLabel[];
    applicationMethods: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface MedicineFormData {
    name: string;
    photoUrl: string | null;
    expiryDate: string;
    applicationLabels: ApplicationLabel[];
    applicationMethods: string;
    description: string;
}

export const APPLICATION_LABEL_NAMES: Record<ApplicationLabel, string> = {
    head: 'Голова',
    stomach: 'Живот',
    throat: 'Горло',
    ears: 'Уши',
    menstrual: 'Месячные',
    nose: 'Насморк',
    teeth: 'Зубы',
    skin: 'Кожа',
    other: 'Другое',
};
