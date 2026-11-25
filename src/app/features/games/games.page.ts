import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, isDevMode, PendingTasks, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UiButton } from '../../shared/ui/button';
import { UiCard } from '../../shared/ui/card';
import { UiSearchInput } from '../../shared/ui/search-input';
import { UiEmptyState, UiErrorState, UiLoadingState } from '../../shared/ui/states';
import { UiStatusBadge } from '../../shared/ui/status-badge';
import { GAME_CREATION_QUEUE_SOURCE, GameAdminQueueItemDto } from './game-creation-queue';

type QueueState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; items: readonly GameAdminQueueItemDto[] };

@Component({
  standalone: true,
  selector: 'wayhunter-games-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, UiButton, UiCard, UiSearchInput, UiEmptyState, UiErrorState, UiLoadingState, UiStatusBadge],
  templateUrl: './games.page.html',
  styleUrl: './games.page.scss',
})
export class GamesPage {
  private readonly source = inject(GAME_CREATION_QUEUE_SOURCE);
  private readonly pendingTasks = inject(PendingTasks);
  protected readonly demoPreview = isDevMode() && inject(ActivatedRoute).parent?.routeConfig?.path === 'preview';
  protected readonly state = signal<QueueState>({ kind: 'loading' });
  protected readonly search = signal('');
  private readonly selectedId = signal<string | null>(null);
  private detailsTrigger?: HTMLButtonElement;

  protected readonly pendingStatus = 'Pending review';
  protected readonly filtered = computed(() => {
    const state = this.state();
    if (state.kind !== 'ready') return [];
    const query = this.search().trim().toLowerCase();
    return state.items.filter(item =>
      [item.gameTitle, item.creatorNameSnapshot, item.creatorUserId].some(value =>
        value.toLowerCase().includes(query),
      ),
    );
  });
  protected readonly selected = computed(() =>
    this.filtered().find(item => item.gameId === this.selectedId()),
  );

  ngOnInit(): void {
    if (this.demoPreview) this.load();
  }

  protected load(): void {
    this.state.set({ kind: 'loading' });
    this.pendingTasks.run(async () => {
      try {
        this.state.set({ kind: 'ready', items: await this.source() });
      } catch {
        this.state.set({ kind: 'error' });
      }
    });
  }

  protected updateSearch(value: string): void {
    this.search.set(value);
    if (!this.selected()) {
      this.selectedId.set(null);
      this.detailsTrigger = undefined;
    }
  }

  protected showDetails(item: GameAdminQueueItemDto, trigger: HTMLButtonElement, heading: HTMLElement): void {
    this.selectedId.set(item.gameId);
    this.detailsTrigger = trigger;
    heading.focus();
  }

  protected closeDetails(): void {
    this.selectedId.set(null);
    this.detailsTrigger?.focus();
    this.detailsTrigger = undefined;
  }
}
