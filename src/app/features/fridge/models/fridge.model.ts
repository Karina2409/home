export type FridgeItemStatus = 'expired' | 'expiring_today' | 'expiring_soon' | 'ok';

export interface FridgeItem {
    id: string;
    productName: string;
    photoUrl: string | null;
    quantity: number;
    unit: string;
    expirationDate: string;
    status: FridgeItemStatus;
    createdAt: string;
    updatedAt: string;
}

export interface FridgeItemFormData {
    productName: string;
    photoUrl: string | null;
    quantity: number;
    unit: string;
    expirationDate: string;
}
