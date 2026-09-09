export type SupplyStatus = 'enough' | 'low' | 'out';

export interface Supply {
    id: string;
    name: string;
    category: string;
    location: string;
    quantity: number;
    minQuantity: number;
    unit: string;
    icon: string;
    iconBg: string;
    status: SupplyStatus;
    createdAt: string;
    updatedAt: string;
}

export interface SupplyFormData {
    name: string;
    category: string;
    location: string;
    quantity: number;
    minQuantity: number;
    unit: string;
}

export interface StatCard {
    label: string;
    value: number;
    icon: string;
    iconBg: string;
    iconColor: string;
}
