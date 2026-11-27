import { formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, LOCALE_ID, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminReadBlockedError } from '../../core/http/api-client.service';
import { ApiError } from '../../core/http/api-error';
import { UiButton } from '../../shared/ui/button';
import { UiCard } from '../../shared/ui/card';
import { TableColumn, UiDataTable } from '../../shared/ui/data-table';
import { UiSearchInput } from '../../shared/ui/search-input';
import { UiEmptyState, UiErrorState, UiLoadingState } from '../../shared/ui/states';
import { AdminRedemptionApiService, RedemptionQueueItem, RedemptionQueuePage } from './data-access/admin-redemption-api.service';

type QueueState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string; retry: boolean }
  | { kind: 'ready'; result: RedemptionQueuePage };

@Component({
  selector: 'wh-redemption-queue',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButton, UiCard, UiDataTable, UiSearchInput, UiEmptyState, UiErrorState, UiLoadingState],
  template: `
    <wh-card heading="Pending redemption requests">
      @let current = state();
      @switch (current.kind) {
        @case ('loading') {
          <wh-loading-state message="Loading redemption requests…" />
        }
        @case ('error') {
          <wh-error-state [message]="current.message" [retryLabel]="current.retry ? 'Retry' : ''"
                          (retry)="load(requestedPage())" />
        }
        @case ('ready') {
          @let result = current.result;
          @if (result.items.length) {
            <wh-search-input label="Search this page by request, user or offer ID" [(value)]="query" />
            @if (filtered().length) {
              <wh-data-table caption="Pending redemption requests" [rows]="filtered()"
                             [columns]="columns" [rowKey]="rowKey" />
            } @else {
              <wh-empty-state message="No requests on this page match your search." />
            }
          } @else {
            <wh-empty-state [message]="result.totalCount ? 'This page is empty.' : 'No pending redemption requests.'" />
          }
          @if (result.page > 1 || result.page * result.pageSize < result.totalCount) {
            <nav aria-label="Redemption request pages">
              <button whButton variant="outline" [disabled]="result.page <= 1"
                      (click)="load(result.page - 1)">Previous</button>
              <span aria-live="polite">Page {{ result.page }} · {{ result.totalCount }} pending</span>
              <button whButton variant="outline" [disabled]="result.page * result.pageSize >= result.totalCount"
                      (click)="load(result.page + 1)">Next</button>
            </nav>
          }
        }
      }
    </wh-card>
  `,
  styles: ['nav { display: flex; align-items: center; flex-wrap: wrap; gap: .75rem; margin-block-start: 1rem; }'],
})
export class RedemptionQueue implements OnInit {
  private readonly api = inject(AdminRedemptionApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly locale = inject(LOCALE_ID);
  protected readonly state = signal<QueueState>({ kind: 'loading' });
  protected readonly requestedPage = signal(1);
  protected readonly query = signal('');
  protected readonly filtered = computed(() => {
    const state = this.state();
    if (state.kind !== 'ready') return [];
    const query = this.query().trim().toLowerCase();
    return state.result.items.filter(row =>
      [row.requestId, row.ownerUserId, row.offerId].some(value => value.toLowerCase().includes(query)),
    );
  });
  protected readonly rowKey = (row: RedemptionQueueItem) => row.requestId;
  protected readonly columns: readonly TableColumn<RedemptionQueueItem>[] = [
    { id: 'request', heading: 'Request ID', cell: row => row.requestId },
    { id: 'user', heading: 'User ID', cell: row => row.ownerUserId },
    { id: 'offer', heading: 'Offer ID', cell: row => row.offerId },
    { id: 'coins', heading: 'Coins requested', cell: row => String(row.costCoins) },
    { id: 'stock', heading: 'Available stock', cell: row => String(row.availableStock) },
    { id: 'date', heading: 'Requested (UTC)', cell: row => formatDate(row.requestedAtUtc, 'medium', this.locale, 'UTC') },
  ];

  ngOnInit(): void {
    this.load(1);
  }

  protected load(page: number): void {
    this.requestedPage.set(page);
    this.state.set({ kind: 'loading' });
    this.api.listPending(page).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => this.state.set({ kind: 'ready', result }),
      error: (error: unknown) => {
        const denied = error instanceof AdminReadBlockedError ||
          (error instanceof ApiError && [401, 403].includes(error.status));
        const unavailable = error instanceof ApiError && error.status === 503;
        this.state.set({
          kind: 'error',
          retry: !denied,
          message: denied ? 'Your session does not have access to redemption requests.'
            : unavailable ? 'The redemption queue is temporarily unavailable.'
            : 'Redemption requests could not be loaded.',
        });
      },
    });
  }
}
