import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

@Component({
  selector: 'button[whButton]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.type]': 'type()',
    '[disabled]': 'disabled() || loading()',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.data-variant]': 'variant()',
  },
  template: `
    @if (loading()) { <span class="spinner" aria-hidden="true"></span> }
    <ng-content />
  `,
  styles: `
    :host {
      display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
      min-height: 44px; border-radius: var(--radius-control);
    }
    :host([data-variant="secondary"]) { background: var(--wash); color: var(--accent); }
    :host([data-variant="outline"]) {
      border-color: var(--control-border); background: var(--surface); color: var(--accent);
    }
    :host([data-variant="ghost"]) { background: transparent; color: var(--accent); }
    :host([data-variant="outline"]:hover:not(:disabled)),
    :host([data-variant="ghost"]:hover:not(:disabled)) { background: var(--wash); }
    :host([data-variant="secondary"]:hover:not(:disabled)) { border-color: var(--accent); }
    :host([data-variant="danger"]) { background: var(--danger-ink); }
    :host([data-variant="danger"]:hover:not(:disabled)) { background: var(--danger-hover); }
    :host(:disabled) { opacity: .65; cursor: not-allowed; }
    .spinner { width: 1em; height: 1em; border: 2px solid; border-right-color: transparent; border-radius: 50%; }
    @media (prefers-reduced-motion: no-preference) {
      .spinner { animation: spin .75s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
    }
  `,
})
export class UiButton {
  readonly variant = input<ButtonVariant>('primary');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
}
