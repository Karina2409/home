import {Supply, SupplyFormData, SupplyStatus} from '@models/supply.model';

export interface SupplyRow {
    id: string;
    name: string;
    category: string;
    location: string;
    quantity: number;
    min_quantity: number;
    unit: string;
    icon: string | null;
    icon_bg: string | null;
    status: SupplyStatus;
    created_at: string;
    updated_at: string;
}

export function fromDb(row: SupplyRow): Supply {
    return {
        id: row.id,
        name: row.name,
        category: row.category,
        location: row.location,
        quantity: row.quantity,
        minQuantity: row.min_quantity,
        unit: row.unit,
        icon: row.icon ?? 'pi pi-box',
        iconBg: row.icon_bg ?? getRandomIconBg(),
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function toDb(data: SupplyFormData): Omit<SupplyRow, 'id' | 'created_at' | 'updated_at' | 'status' | 'icon' | 'icon_bg'> {
    return {
        name: data.name,
        category: data.category,
        location: data.location,
        quantity: data.quantity,
        min_quantity: data.minQuantity,
        unit: data.unit,
    };
}

export function calculateStatus(quantity: number, minQuantity: number): SupplyStatus {
    if (quantity === 0) return 'out';
    if (quantity <= minQuantity) return 'low';
    return 'enough';
}

export function getRandomIconBg(): string {
    const colors = ['#e8f5e9', '#fff3e0', '#e3f2fd', '#fce4ec', '#f3e5f5', '#e0f2f1'];
    return colors[Math.floor(Math.random() * colors.length)];
}
