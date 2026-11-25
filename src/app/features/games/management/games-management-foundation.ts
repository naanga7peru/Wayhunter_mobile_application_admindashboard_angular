import { ChangeDetectionStrategy, Component, DOCUMENT, inject, input } from '@angular/core';
import { UiCard } from '../../../shared/ui/card';
import { UiEmptyState } from '../../../shared/ui/states';
import { UiStatusBadge } from '../../../shared/ui/status-badge';

@Component({
  selector: 'wh-games-contract-section',
  standalone: true,
  imports: [UiCard, UiEmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <wh-card>
      <h3 [id]="headingId()" tabindex="-1">{{ heading() }}</h3>
      <wh-empty-state [message]="message()" />
    </wh-card>
  `,
  styles: `
    :host { display: block; min-width: 0; }
    h3 {
      margin: 0 0 1rem;
      font-size: 1.125rem;
      scroll-margin-block-start: calc(var(--topbar-height, 0px) + 1rem);
    }
    h3:focus-visible { outline: 2px solid var(--accent); outline-offset: .25rem; }
  `,
})
export class GamesContractSection {
  readonly headingId = input.required<string>();
  readonly heading = input.required<string>();
  readonly message = input.required<string>();
}

@Component({
  selector: 'wh-games-management-foundation',
  standalone: true,
  imports: [GamesContractSection, UiStatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './games-management-foundation.html',
  styleUrl: './games-management-foundation.scss',
})
export class GamesManagementFoundation {
  private readonly document = inject(DOCUMENT);

  readonly creationSection = input<{ readonly id: string; readonly heading: string }>();

  protected readonly sections = [
    {
      id: 'adm10-game-inventory',
      heading: 'Game Inventory & Details',
      message: 'Unavailable until the Admin game inventory and detail APIs are available.',
    },
    {
      id: 'adm10-stage-proof',
      heading: 'Stage Proof Review',
      message: 'Unavailable until Admin APIs can list submitted proofs, grant protected evidence access, and record stage decisions.',
    },
    {
      id: 'adm10-winner-review',
      heading: 'Final Completion & Winner Review',
      message: 'Unavailable until Admin APIs can list eligible completions, grant protected evidence access, and record winner decisions.',
    },
    {
      id: 'adm10-anti-cheat',
      heading: 'Anti-Cheat Review',
      message: 'Unavailable until the Backend provides an authorized anti-cheat review contract.',
    },
    {
      id: 'adm10-leaderboards',
      heading: 'Leaderboards',
      message: 'Unavailable until an approved Admin Game leaderboard API provides verified rankings.',
    },
  ] as const;

  protected sectionLink(headingId: string): string {
    const { pathname, search } = this.document.location;
    return `${pathname}${search}#${headingId}`;
  }

  protected jumpToSection(event: MouseEvent, headingId: string): void {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

    const heading = this.document.getElementById(headingId);
    if (!heading) return;

    event.preventDefault();
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: 'start' });
  }
}
