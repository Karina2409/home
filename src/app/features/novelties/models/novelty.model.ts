export type NoveltyStatus = 'want' | 'liked' | 'disliked';

export interface Novelty {
    id: string;
    name: string;
    photoUrl: string | null;
    description: string;
    status: NoveltyStatus;
    rating: number;
    likes: number;
    dislikes: number;
    createdAt: string;
    updatedAt: string;
}

export interface NoveltyComment {
    id: string;
    noveltyId: string;
    text: string;
    rating: number;
    createdAt: string;
}

export interface NoveltyFormData {
    name: string;
    photoUrl: string | null;
    description: string;
    status: NoveltyStatus;
}

export interface NoveltyCommentFormData {
    text: string;
    rating: number;
}
