import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-randomizer-page',
    templateUrl: './randomizer-page.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RandomizerPageComponent {}
