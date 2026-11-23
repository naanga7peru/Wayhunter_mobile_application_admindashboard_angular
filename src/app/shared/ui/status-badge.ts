import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'wh-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-tone]': 'tone()' },
  template: '{{ label() }}',
  styles: `
    :host {
      display: inline-block; padding: .25rem .65rem; border-radius: 999px;
      background: var(--neutral-bg); color: var(--muted); font-size: .8125rem; font-weight: 700;
      overflow-wrap: anywhere;
    }
    :host([data-tone="success"]) { background: var(--success-bg); color: var(--success-ink); }
    :host([data-tone="warning"]) { background: var(--warning-bg); color: var(--warning-ink); }
    :host([data-tone="danger"]) { background: var(--danger-bg); color: var(--danger-ink); }
    :host([data-tone="info"]) { background: var(--wash); color: var(--accent); }
  `,
})
export class UiStatusBadge {
  readonly tone = input<StatusTone>('neutral');
  readonly label = input.required<string>();
}
