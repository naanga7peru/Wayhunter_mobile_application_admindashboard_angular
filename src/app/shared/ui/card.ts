import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'wh-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (heading(); as title) { <h2>{{ title }}</h2> }
    <ng-content />
  `,
  styles: `
    :host {
      display: block; min-width: 0; padding: clamp(1rem, 3vw, 1.75rem);
      border: 1px solid var(--line); border-radius: var(--radius-panel);
      background: var(--glass); box-shadow: var(--panel-shadow); backdrop-filter: blur(12px);
    }
    h2 { margin: 0 0 1rem; font-size: 1.15rem; }
  `,
})
export class UiCard {
  readonly heading = input('');
}
