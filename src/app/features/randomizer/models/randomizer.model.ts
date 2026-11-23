export interface RandomizerList {
    id: string;
    name: string;
    items: string[];
    createdAt: string;
    updatedAt: string;
}

export interface RandomizerListFormData {
    name: string;
    items: string[];
}

export interface RandomizerChoice {
    id: string;
    listId: string;
    selectedItem: string;
    chosenAt: string;
    choiceType: 'list' | 'yesno';
}

export interface YesNoDecision {
    id: string;
    question: string;
    answer: 'yes' | 'no';
    decidedAt: string;
}

export interface YesNoDecisionFormData {
    question: string;
}
