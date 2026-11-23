import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { RandomizerService } from '@features/randomizer';

@Component({
    selector: 'app-randomizer-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        ProgressSpinnerModule,
        TabsModule,
        TagModule,
        ToastModule,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './randomizer-list.component.html',
})
export class RandomizerListComponent {
    private readonly randomizerService = inject(RandomizerService);

    protected readonly lists = this.randomizerService.lists;
    protected readonly history = this.randomizerService.history;
    protected readonly yesNoHistory = this.randomizerService.yesNoHistory;
    protected readonly loading = this.randomizerService.loading;
    protected readonly currentResult = this.randomizerService.currentResult;

    protected readonly listDialogVisible = signal(false);
    protected readonly resultDialogVisible = signal(false);
    protected readonly isEditing = signal(false);
    protected readonly editingListId = signal<string | null>(null);
    protected readonly listName = signal('');
    protected readonly listItemsText = signal('');
    protected readonly yesNoQuestion = signal('');

    openAddList(): void {
        this.isEditing.set(false);
        this.editingListId.set(null);
        this.listName.set('');
        this.listItemsText.set('');
        this.listDialogVisible.set(true);
    }

    editList(id: string): void {
        const list = this.randomizerService.getListById(id);
        if (!list) return;
        this.isEditing.set(true);
        this.editingListId.set(id);
        this.listName.set(list.name);
        this.listItemsText.set(list.items.join('\n'));
        this.listDialogVisible.set(true);
    }

    submitList(): void {
        const name = this.listName();
        const items = this.listItemsText()
            .split('\n')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        if (!name.trim() || items.length === 0) return;

        const data = { name, items };
        if (this.isEditing()) {
            this.randomizerService.updateList(this.editingListId()!, data).subscribe((result) => {
                if (result) this.listDialogVisible.set(false);
            });
        } else {
            this.randomizerService.addList(data).subscribe((result) => {
                if (result) this.listDialogVisible.set(false);
            });
        }
    }

    deleteList(id: string): void {
        this.randomizerService.deleteList(id).subscribe();
    }

    pickRandom(listId: string): void {
        this.randomizerService.pickRandom(listId).subscribe((result) => {
            if (result) this.resultDialogVisible.set(true);
        });
    }

    decideYesNo(): void {
        const question = this.yesNoQuestion();
        if (!question.trim()) return;
        this.randomizerService.decideYesNo({ question }).subscribe((result) => {
            if (result) {
                this.resultDialogVisible.set(true);
                this.yesNoQuestion.set('');
            }
        });
    }

    clearResult(): void {
        this.randomizerService.clearResult();
        this.resultDialogVisible.set(false);
    }

    getListName(listId: string): string {
        return this.randomizerService.getListById(listId)?.name ?? 'Неизвестный список';
    }
}
