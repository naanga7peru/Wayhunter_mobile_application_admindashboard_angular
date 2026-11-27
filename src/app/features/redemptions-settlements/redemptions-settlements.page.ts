import { DatePipe, DecimalPipe } from '@angular/common';
import {
  afterNextRender, ChangeDetectionStrategy, Component, computed, ElementRef, inject, Injector,
  OnInit, signal, viewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UiButton } from '../../shared/ui/button';
import { UiCard } from '../../shared/ui/card';
import { TableColumn, UiDataTable } from '../../shared/ui/data-table';
import { FilterOption, UiFilterSelect } from '../../shared/ui/filter-select';
import { UiSearchInput } from '../../shared/ui/search-input';
import { UiEmptyState, UiErrorState, UiLoadingState } from '../../shared/ui/states';
import { StatusTone, UiStatusBadge } from '../../shared/ui/status-badge';
import { RedemptionsDemoSource, redemptionTerms } from './data-access/redemptions-demo';
import { RedemptionQueue } from './redemption-queue';
import {
  ApprovedIssuance, AuditEvent, Redemption, RedemptionsSnapshot, issuanceStatus,
  issuanceStatuses, requestStatuses, requestTimeline,
} from './models/redemptions-view';

type PageState =
  | { readonly kind: 'loading' | 'error' }
  | { readonly kind: 'ready'; readonly snapshot: RedemptionsSnapshot };

const utc = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });

@Component({
  selector: 'wayhunter-redemptions-settlements-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, UiButton, UiCard, UiDataTable, UiEmptyState, UiErrorState, UiFilterSelect,
    UiLoadingState, UiSearchInput, UiStatusBadge, RedemptionQueue],
  templateUrl: './redemptions-settlements.page.html',
  styleUrl: './redemptions-settlements.page.scss',
})
export class RedemptionsPage implements OnInit {
  private readonly source = inject(RedemptionsDemoSource);
  protected readonly live = inject(ActivatedRoute, { optional: true })?.parent?.routeConfig?.path === 'admin';
  private readonly injector = inject(Injector);
  private readonly detailsHeading = viewChild<ElementRef<HTMLHeadingElement>>('detailsHeading');
  private readonly resultsHeading = viewChild<ElementRef<HTMLElement>>('resultsHeading');
  private detailsTrigger?: HTMLButtonElement;

  protected readonly state = signal<PageState>({ kind: 'loading' });
  protected readonly search = signal('');
  protected readonly status = signal('');
  protected readonly issuance = signal('');
  protected readonly range = signal('');
  protected readonly selected = signal<Redemption | null>(null);
  protected readonly terms = redemptionTerms;
  protected readonly issuanceStatus = issuanceStatus;
  protected readonly requestTones: Record<Redemption['status'], StatusTone> = {
    Pending: 'warning', Approved: 'success', Rejected: 'danger', Cancelled: 'neutral',
  };
  protected readonly issuanceTones: Record<ReturnType<typeof issuanceStatus>, StatusTone> = {
    'Not started': 'neutral', 'Awaiting issuance': 'info', Issued: 'success', 'Issuance failed': 'danger',
  };
  protected readonly requestOptions: readonly FilterOption[] = [
    { label: 'All request statuses', value: '' }, ...requestStatuses.map(value => ({ label: value, value })),
  ];
  protected readonly issuanceOptions: readonly FilterOption[] = [
    { label: 'All issuance statuses', value: '' }, ...issuanceStatuses.map(value => ({ label: value, value })),
  ];
  protected readonly dateOptions: readonly FilterOption[] = [
    { label: 'All sample dates', value: '' },
    { label: 'Last 7 sample days', value: '7' },
    { label: 'Last 30 sample days', value: '30' },
  ];
  protected readonly snapshot = computed(() => {
    const state = this.state();
    return state.kind === 'ready' ? state.snapshot : null;
  });
  protected readonly pending = computed(() => this.snapshot()?.requests.filter(row => row.status === 'Pending') ?? []);
  protected readonly approved = computed(() => this.snapshot()?.requests.filter(row => row.status === 'Approved') ?? []);
  protected readonly metrics = computed(() => [
    { label: 'Total redemption requests', count: this.snapshot()?.requests.length ?? 0 },
    { label: 'Pending review', count: this.pending().length },
    { label: 'Approved requests', count: this.approved().length },
    { label: 'Issued vouchers', count: this.approved().filter(row => row.issuance.status === 'Issued').length },
    { label: 'Failed issuances', count: this.approved().filter(row => row.issuance.status === 'Issuance failed').length },
  ]);
  protected readonly issuanceGroups: readonly { status: ApprovedIssuance['status']; heading: string }[] = [
    { status: 'Awaiting issuance', heading: 'Awaiting issuance' },
    { status: 'Issued', heading: 'Previously issued samples' },
    { status: 'Issuance failed', heading: 'Failed issuance' },
  ];
  protected readonly tracker = computed(() => this.issuanceGroups.map(group => ({
    ...group, rows: this.approved().filter(row => row.issuance.status === group.status),
  })));
  protected readonly filtered = computed(() => {
    const snapshot = this.snapshot();
    if (!snapshot) return [];
    const search = this.search().trim().toLowerCase();
    const status = this.status();
    const issuance = this.issuance();
    const range = this.range();
    const earliest = range ? Date.parse(snapshot.asOf) - Number(range) * 86_400_000 : -Infinity;
    return snapshot.requests.filter(row =>
      (!status || row.status === status) && (!issuance || issuanceStatus(row) === issuance) &&
      Date.parse(row.requestedAt) >= earliest &&
      [row.reference, row.userId, row.voucher].some(value => value.toLowerCase().includes(search)),
    );
  });
  protected readonly timeline = computed(() => {
    const request = this.selected();
    return request ? requestTimeline(request) : [];
  });
  protected readonly audit = computed(() => (this.snapshot()?.requests ?? []).flatMap(requestTimeline)
    .sort((first, second) => second.at.localeCompare(first.at) || second.reference.localeCompare(first.reference)));
  protected readonly auditKey = (event: AuditEvent) => event.reference;
  protected readonly auditColumns: readonly TableColumn<AuditEvent>[] = [
    { id: 'event-id', heading: 'Event reference', cell: event => event.reference },
    { id: 'request', heading: 'Request', cell: event => event.request },
    { id: 'time', heading: 'Time (UTC)', cell: event => utc.format(new Date(event.at)) },
    { id: 'actor', heading: 'Sample actor', cell: event => event.actor },
    { id: 'event', heading: 'Event', cell: event => event.event },
  ];

  ngOnInit(): void {
    if (this.live) return;
    void this.load();
  }

  protected async load(): Promise<void> {
    this.state.set({ kind: 'loading' });
    try {
      this.state.set({ kind: 'ready', snapshot: await this.source.load() });
    } catch {
      this.state.set({ kind: 'error' });
    }
  }

  protected resetFilters(): void {
    this.search.set('');
    this.status.set('');
    this.issuance.set('');
    this.range.set('');
  }

  protected showDetails(request: Redemption, event: MouseEvent): void {
    this.detailsTrigger = event.currentTarget instanceof HTMLButtonElement ? event.currentTarget : undefined;
    this.selected.set(request);
    afterNextRender({ write: () => this.detailsHeading()?.nativeElement.focus() }, { injector: this.injector });
  }

  protected closeDetails(): void {
    this.selected.set(null);
    (this.detailsTrigger?.isConnected ? this.detailsTrigger : this.resultsHeading()?.nativeElement)?.focus();
    this.detailsTrigger = undefined;
  }
}
