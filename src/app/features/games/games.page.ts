import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Injector, isDevMode, PendingTasks, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AdminReadBlockedError } from '../../core/http/api-client.service';
import { ApiError } from '../../core/http/api-error';
import { UiButton } from '../../shared/ui/button';
import { UiCard } from '../../shared/ui/card';
import { UiSearchInput } from '../../shared/ui/search-input';
import { UiEmptyState, UiErrorState, UiLoadingState } from '../../shared/ui/states';
import { UiStatusBadge } from '../../shared/ui/status-badge';
import { GAME_CREATION_QUEUE_SOURCE, GameAdminQueueItemDto } from './game-creation-queue';
import { AdminGamesQueueApiService } from './data-access/admin-games-queue-api.service';
import { GamesManagementFoundation } from './management/games-management-foundation';

type QueueState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string; retry: boolean }
  | { kind: 'ready'; items: readonly GameAdminQueueItemDto[] };

@Component({
  standalone: true,
  selector: 'wayhunter-games-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, GamesManagementFoundation, UiButton, UiCard, UiSearchInput, UiEmptyState, UiErrorState, UiLoadingState, UiStatusBadge],
  templateUrl: './games.page.html',
  styleUrl: './games.page.scss',
})
export class GamesPage {
  protected readonly creationSection = {
    id: 'adm10-creation-review',
    heading: 'Game Creation Review Queue',
  };
  private readonly source = inject(GAME_CREATION_QUEUE_SOURCE);
  private readonly injector = inject(Injector);
  private readonly pendingTasks = inject(PendingTasks);
  private readonly workspace = inject(ActivatedRoute).parent?.routeConfig?.path;
  protected readonly demoPreview = isDevMode() && this.workspace === 'preview';
  protected readonly live = this.workspace === 'admin';
  protected readonly state = signal<QueueState>({ kind: 'loading' });
  protected readonly search = signal('');
  protected readonly page = signal(0);
  protected readonly pageSize = 20;
  private readonly selectedId = signal<string | null>(null);
  private detailsTrigger?: HTMLButtonElement;
  private decisionTrigger?: HTMLButtonElement;
  protected readonly decision = signal<'approve' | 'reject' | null>(null);
  protected readonly reason = signal('');
  protected readonly reasonChecked = signal(false);
  protected readonly reasonLimit = 1000;
  // Match .NET string.Trim() whitespace and UTF-16 length.
  protected readonly reasonLength = computed(() =>
    this.reason().replace(/^\p{White_Space}+|\p{White_Space}+$/gu, '').length,
  );
  protected readonly reasonError = computed(() => {
    if (this.reasonLength() === 0) return 'Enter a rejection reason.';
    if (this.reasonLength() > this.reasonLimit) return 'Use 1,000 characters or fewer after trimming.';
    return '';
  });

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
  protected readonly visible = computed(() => this.live
    ? this.filtered().slice(this.page() * this.pageSize, (this.page() + 1) * this.pageSize)
    : this.filtered(),
  );

  ngOnInit(): void {
    if (this.demoPreview || this.live) this.load();
  }

  protected load(): void {
    if (!this.demoPreview && !this.live) return;
    this.state.set({ kind: 'loading' });
    this.pendingTasks.run(async () => {
      try {
        const items = this.demoPreview
          ? await this.source()
          : await firstValueFrom(this.injector.get(AdminGamesQueueApiService).list());
        this.state.set({ kind: 'ready', items });
      } catch (error) {
        const denied = error instanceof AdminReadBlockedError ||
          (error instanceof ApiError && [401, 403].includes(error.status));
        const unavailable = error instanceof ApiError && error.status === 503;
        this.state.set({
          kind: 'error',
          retry: !denied,
          message: this.demoPreview ? 'Sample submissions could not be loaded.'
            : denied ? 'Your session does not have access to game submissions.'
            : unavailable ? 'The pending game creation queue is temporarily unavailable.'
            : 'Pending game submissions could not be loaded.',
        });
      }
    });
  }

  protected updateSearch(value: string): void {
    this.search.set(value);
    if (this.live) this.changePage(0);
    if (!this.selected()) {
      this.selectedId.set(null);
      this.detailsTrigger = undefined;
      this.resetDecision();
    }
  }

  protected changePage(page: number): void {
    this.selectedId.set(null);
    this.detailsTrigger = undefined;
    this.page.set(page);
  }

  protected showDetails(item: GameAdminQueueItemDto, trigger: HTMLButtonElement, heading: HTMLElement): void {
    this.resetDecision();
    this.selectedId.set(item.gameId);
    this.detailsTrigger = trigger;
    heading.focus();
  }

  protected closeDetails(): void {
    this.resetDecision();
    this.selectedId.set(null);
    this.detailsTrigger?.focus();
    this.detailsTrigger = undefined;
  }

  protected openDecision(
    decision: 'approve' | 'reject', event: MouseEvent, heading: HTMLElement,
  ): void {
    this.resetDecision();
    this.decisionTrigger = event.currentTarget as HTMLButtonElement;
    this.decision.set(decision);
    heading.focus();
  }

  protected cancelDecision(): void {
    this.decisionTrigger?.focus();
    this.resetDecision();
  }

  protected handleEscape(event: Event): void {
    if (!this.selected()) return;
    event.preventDefault();
    event.stopPropagation();
    if (this.decision()) this.cancelDecision();
    else this.closeDetails();
  }

  protected checkReason(event: Event, field: HTMLTextAreaElement): void {
    event.preventDefault();
    this.reasonChecked.set(true);
    if (this.reasonError()) field.focus();
  }

  private resetDecision(): void {
    this.decision.set(null);
    this.decisionTrigger = undefined;
    this.reason.set('');
    this.reasonChecked.set(false);
  }
}
