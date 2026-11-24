import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiClientService } from '../../core/http/api-client.service';
import { UiButton } from '../../shared/ui/button';
import { UiCard } from '../../shared/ui/card';
import { TableColumn, UiDataTable } from '../../shared/ui/data-table';
import { FilterOption, UiFilterSelect } from '../../shared/ui/filter-select';
import { StatusTone, UiStatusBadge } from '../../shared/ui/status-badge';
import { DashboardChart } from './components/dashboard-chart';
import { getDashboardDemo } from './data-access/dashboard-demo';
import { ActivityStatus, DashboardActivity, DashboardRange } from './models/dashboard-view';

const activityTones: Record<ActivityStatus, StatusTone> = {
  'Completed': 'success',
  'Pending review': 'warning',
  'Scheduled': 'info',
};

@Component({
  standalone: true,
  selector: 'wayhunter-dashboard-page',
  imports: [DecimalPipe, RouterLink, UiButton, UiCard, UiDataTable, UiFilterSelect, UiStatusBadge, DashboardChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
  private readonly api = inject(ApiClientService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly range = signal<DashboardRange>('7');
  protected readonly view = computed(() => getDashboardDemo(this.range()));
  protected readonly district = signal('');
  protected readonly districts = computed<readonly FilterOption[]>(() => [
    { value: '', label: 'All districts' },
    ...this.view().districtActivity.map(({ district }) => ({ value: district, label: district })),
  ]);
  protected readonly visibleDistrictActivity = computed(() =>
    this.view().districtActivity.filter(row => !this.district() || row.district === this.district()),
  );
  protected readonly districtScale = computed(() =>
    Math.max(1, ...this.view().districtActivity.map(row => row.trips)),
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
    for (const { status } of this.view().activities) {
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    return Array.from(counts, ([status, count]) => ({
      status, label: status + ' · ' + count, tone: activityTones[status],
    }));
  });

  protected selectRange(value: string): void {
    if (value === '7' || value === '30' || value === '90') this.range.set(value);
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
