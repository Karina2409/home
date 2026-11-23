import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-couples-page',
    templateUrl: './couples-page.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CouplesPageComponent {}
