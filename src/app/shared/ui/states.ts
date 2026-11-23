import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiButton } from './button';

const stateStyles = `
  :host { display: block; }
  .state {
    margin: 0; padding: 1rem; border: 1px solid var(--line);
    border-radius: var(--radius-control); background: var(--neutral-bg); color: var(--muted);
    overflow-wrap: anywhere;
  }
`;

@Component({
  selector: 'wh-loading-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p class="state" role="status">{{ message() }}</p>',
  styles: [stateStyles],
})
export class UiLoadingState {
  readonly message = input('Loading…');
}

@Component({
  selector: 'wh-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p class="state" role="status">{{ message() }}</p>',
  styles: [stateStyles],
})
export class UiEmptyState {
  readonly message = input('No results to display.');
}

@Component({
  selector: 'wh-error-state',
  standalone: true,
  imports: [UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="state" role="alert">{{ message() }}</p>
    @if (retryLabel(); as label) {
      <button whButton variant="outline" (click)="retry.emit()">{{ label }}</button>
    }
  `,
  styles: [stateStyles, `
    .state { background: var(--danger-bg); color: var(--danger-ink); }
    button { margin-block-start: .75rem; }
  `],
})
export class UiErrorState {
  readonly message = input('Something went wrong.');
  readonly retryLabel = input('');
  readonly retry = output<void>();
}
