import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, defaultIfEmpty, defer, finalize, map, of, Subject, switchMap, take } from 'rxjs';
import { ApiClientService } from '../../core/http/api-client.service';
import { UiButton } from '../../shared/ui/button';
import { UiCard } from '../../shared/ui/card';
import { TableColumn, UiDataTable } from '../../shared/ui/data-table';
import { FilterOption, UiFilterSelect } from '../../shared/ui/filter-select';
import { StatusTone, UiStatusBadge } from '../../shared/ui/status-badge';
import { DashboardChart } from './components/dashboard-chart';
import { UiEmptyState, UiErrorState, UiLoadingState } from '../../shared/ui/states';
import { DASHBOARD_DEMO_SOURCE, dashboardFixtureCoverage } from './data-access/dashboard-demo';
import { ActivityStatus, DashboardActivity, DashboardRange, DashboardSnapshot, DashboardState } from './models/dashboard-view';

const activityTones: Record<ActivityStatus, StatusTone> = {
  'Completed': 'success',
  'Pending review': 'warning',
  'Scheduled': 'info',
};

@Component({
  standalone: true,
  selector: 'wayhunter-dashboard-page',
  imports: [DatePipe, DecimalPipe, RouterLink, UiButton, UiCard, UiDataTable, UiEmptyState, UiErrorState,
    UiFilterSelect, UiLoadingState, UiStatusBadge, DashboardChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
  private readonly api = inject(ApiClientService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly range = signal<DashboardRange>('7');
  private readonly source = inject(DASHBOARD_DEMO_SOURCE);
  private readonly loads = new Subject<DashboardRange>();
  protected readonly fixtureCoverage = dashboardFixtureCoverage;
  protected readonly state = signal<DashboardState>({ kind: 'loading' });
  protected readonly snapshot = computed(() => {
    const state = this.state();
    return (state.kind === 'ready' || state.kind === 'error') && state.snapshot?.range === this.range()
      ? state.snapshot : undefined;
  });
  protected readonly lastLoadedAt = computed(() => {
    const state = this.state();
    return state.kind === 'empty' ? state.loadedAt : this.snapshot()?.loadedAt;
  });
  protected readonly district = signal('');
  private readonly districtActivity = computed(() => this.snapshot()?.view.districtActivity ?? []);
  protected readonly districts = computed<readonly FilterOption[]>(() => [
    { value: '', label: 'All districts' },
    ...this.districtActivity().map(({ district }) => ({ value: district, label: district })),
  ]);
  protected readonly visibleDistrictActivity = computed(() =>
    this.districtActivity().filter(row => !this.district() || row.district === this.district()),
  );
  protected readonly districtScale = computed(() =>
    Math.max(1, ...this.districtActivity().map(row => row.trips)),
  );
  protected readonly checkingBackend = signal(false);
  protected readonly backendStatus = signal('Not checked');

  protected readonly ranges: readonly FilterOption[] = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
  ];
  protected readonly activityKey = (activity: DashboardActivity) => activity.id;
  protected readonly activityColumns: readonly TableColumn<DashboardActivity>[] = [
    { id: 'time', heading: 'Date and time (UTC)', cell: event => event.dateTime },
    { id: 'module', heading: 'Module', cell: event => event.module },
    { id: 'activity', heading: 'Activity', cell: event => event.activity },
    { id: 'status', heading: 'Status', cell: event => event.status },
  ];
  protected readonly activitySummary = computed(() => {
    const counts = new Map<ActivityStatus, number>();
    for (const { status } of this.snapshot()?.view.activities ?? []) {
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    return Array.from(counts, ([status, count]) => ({
      status, label: status + ' · ' + count, tone: activityTones[status],
    }));
  });

  constructor() {
    this.loads.pipe(
      switchMap(range => {
        const previous = this.state();
        const snapshot = 'snapshot' in previous && previous.snapshot?.range === range
          ? previous.snapshot : undefined;
        this.state.set({ kind: 'loading', snapshot });
        return defer(() => this.source(range)).pipe(
          take(1),
          defaultIfEmpty({ kind: 'unavailable' } as const),
          map((result): DashboardState => result.kind === 'ready'
            ? { kind: 'ready', snapshot: { range, view: result.view, loadedAt: Date.now() } }
            : result.kind === 'empty' ? { kind: 'empty', loadedAt: Date.now() } : { kind: 'unavailable' }),
          catchError(() => of<DashboardState>({ kind: 'error', snapshot })),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(state => {
      const selected = this.district();
      if (state.kind === 'ready' && selected &&
          !state.snapshot.view.districtActivity.some(row => row.district === selected)) {
        this.district.set('');
      }
      this.state.set(state);
    });
    this.loadSamples();
  }

  protected selectRange(value: string): void {
    if (value === this.range()) return;
    if (value === '7' || value === '30' || value === '90') {
      this.range.set(value);
      this.loadSamples();
    }
  }

  protected loadSamples(): void {
    this.loads.next(this.range());
  }

  protected checkBackend(): void {
    if (this.checkingBackend()) return;
    this.checkingBackend.set(true);
    this.backendStatus.set('Checking backend…');
    this.api.getHealth().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.checkingBackend.set(false)),
    ).subscribe({
      next: health => this.backendStatus.set('API responded: ' + health.status),
      error: () => this.backendStatus.set('Backend not reachable. Run Wayhunter.Api on port 5055.'),
    });
  }
}
