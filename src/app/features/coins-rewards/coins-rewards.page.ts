import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { UiButton } from '../../shared/ui/button';
import { UiCard } from '../../shared/ui/card';
import { TableColumn, UiDataTable } from '../../shared/ui/data-table';
import { FilterOption, UiFilterSelect } from '../../shared/ui/filter-select';
import { UiSearchInput } from '../../shared/ui/search-input';
import { UiErrorState, UiLoadingState } from '../../shared/ui/states';
import { StatusTone, UiStatusBadge } from '../../shared/ui/status-badge';
import { CoinsRewardsDemoSource } from './data-access/coins-rewards-demo';
import { CoinTransaction, CoinsRewardsView, TransactionStatus, transactionStatuses, transactionTypes } from './models/coins-rewards-view';

const number = new Intl.NumberFormat('en');
const dateTime = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC',
});
const statusTones: Record<TransactionStatus, StatusTone> = {
  Pending: 'warning', Approved: 'success', Completed: 'success', Reserved: 'info',
  Released: 'neutral', Rejected: 'danger', Failed: 'danger',
};

type ViewState =
  | { readonly kind: 'loading' | 'error' }
  | { readonly kind: 'ready'; readonly view: CoinsRewardsView };

@Component({
  standalone: true,
  selector: 'wayhunter-coins-rewards-page',
  imports: [DecimalPipe, UiButton, UiCard, UiDataTable, UiFilterSelect, UiSearchInput,
    UiErrorState, UiLoadingState, UiStatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './coins-rewards.page.html',
  styleUrl: './coins-rewards.page.scss',
})
export class CoinsRewardsPage implements OnInit {
  private readonly source = inject(CoinsRewardsDemoSource);
  protected readonly state = signal<ViewState>({ kind: 'loading' });
  protected readonly search = signal('');
  protected readonly type = signal('');
  protected readonly status = signal('');
  protected readonly range = signal('');
  protected readonly levelThreshold = 2_000;
  protected readonly minimumSpendable = 10_100;
  protected readonly voucherCost = 10_000;
  protected readonly rewardRules = [
    { title: 'Welcome Reward', condition: 'Eligible verified account', amount: 100 },
    { title: 'Hunter Approval Reward', condition: 'Approved Hunter submission', amount: 200 },
    { title: 'Game Creation Reward', condition: 'Approved game creation', amount: 100 },
    { title: 'Verified Game Win Reward', condition: 'Admin-verified winner', amount: 100 },
  ];

  protected readonly types: readonly FilterOption[] = [
    { label: 'All transaction types', value: '' }, ...transactionTypes.map(value => ({ label: value, value })),
  ];
  protected readonly statuses: readonly FilterOption[] = [
    { label: 'All statuses', value: '' }, ...transactionStatuses.map(value => ({ label: value, value })),
  ];
  protected readonly ranges: readonly FilterOption[] = [
    { label: 'All sample dates', value: '' },
    { label: 'Last 7 sample days', value: '7' },
    { label: 'Last 30 sample days', value: '30' },
  ];

  protected readonly view = computed(() => {
    const state = this.state();
    return state.kind === 'ready' ? state.view : null;
  });
  protected readonly sampleDate = computed(() => {
    const view = this.view();
    return view ? dateTime.format(new Date(view.asOf)) + ' UTC' : '';
  });
  protected readonly metrics = computed(() => {
    const view = this.view();
    if (!view) return [];
    return [
      { label: 'Total Coins Awarded', value: view.totals.lifetimeEarned, detail: 'Lifetime posted credits' },
      { label: 'Total Coins Spent', value: view.totals.spent, detail: 'Finalized debits' },
      { label: 'Spendable Coins', value: view.totals.spendable, detail: 'Posted balance less active holds' },
      { label: 'Reserved Coins', value: view.totals.reserved, detail: 'Coins held for open requests' },
      { label: 'Recent Reward Events', value: view.rewardEvents, detail: 'Posted rewards in sample history' },
    ];
  });
  protected readonly levelProgress = computed(() => (this.view()?.sampleWallet.lifetimeEarned ?? 0) % this.levelThreshold);
  protected readonly rows = computed(() => {
    const view = this.view();
    if (!view) return [];
    const search = this.search().trim().toLowerCase();
    const type = this.type();
    const status = this.status();
    const range = this.range();
    const earliest = range ? Date.parse(view.asOf) - Number(range) * 86_400_000 : -Infinity;
    return view.transactions.filter(row =>
      (row.reference.toLowerCase().includes(search) || row.userId.toLowerCase().includes(search)) &&
      (!type || row.type === type) && (!status || row.status === status) &&
      Date.parse(row.timestamp) >= earliest,
    );
  });
  protected readonly badges = computed(() => {
    const counts = new Map<TransactionStatus, number>();
    for (const { status } of this.rows()) counts.set(status, (counts.get(status) ?? 0) + 1);
    return transactionStatuses.filter(status => counts.has(status)).map(status => ({
      status, label: status + ' · ' + counts.get(status), tone: statusTones[status],
    }));
  });

  protected readonly rowKey = (row: CoinTransaction) => row.reference;
  protected readonly columns: readonly TableColumn<CoinTransaction>[] = [
    { id: 'reference', heading: 'Reference', cell: row => row.reference },
    { id: 'user', heading: 'Sample user', cell: row => row.userId },
    { id: 'type', heading: 'Transaction type', cell: row => row.type },
    { id: 'amount', heading: 'Coins', cell: row => {
      const amount = row.postedDelta || row.reservedDelta;
      const sign = amount > 0 ? '+' : amount < 0 ? '−' : '';
      const effect = row.postedDelta ? ' posted' : row.reservedDelta ? ' held' : '';
      return sign + number.format(Math.abs(amount)) + effect;
    } },
    { id: 'time', heading: 'Date and time (UTC)', cell: row => dateTime.format(new Date(row.timestamp)) },
    { id: 'status', heading: 'Status', cell: row => row.status },
    { id: 'module', heading: 'Module', cell: row => row.module },
  ];

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.state.set({ kind: 'loading' });
    try {
      this.state.set({ kind: 'ready', view: await this.source.load() });
    } catch {
      this.state.set({ kind: 'error' });
    }
  }

  protected resetFilters(): void {
    this.search.set('');
    this.type.set('');
    this.status.set('');
    this.range.set('');
  }
}
