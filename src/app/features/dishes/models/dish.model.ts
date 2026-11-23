export interface Dish {
    id: string;
    name: string;
    photoUrl: string | null;
    cookTimeMinutes: number;
    difficulty: 1 | 2 | 3 | 4 | 5;
    ingredients: DishIngredient[];
    steps: string[];
    createdAt: string;
    updatedAt: string;
}

export interface DishIngredient {
    name: string;
    quantity: number;
    unit: string;
}

export interface DishFormData {
    name: string;
    photoUrl: string | null;
    cookTimeMinutes: number;
    difficulty: 1 | 2 | 3 | 4 | 5;
    ingredients: DishIngredient[];
    steps: string[];
}

export type DishDifficulty = 1 | 2 | 3 | 4 | 5;
