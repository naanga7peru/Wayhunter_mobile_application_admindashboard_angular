import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { UiButton } from '../../shared/ui/button';
import { UiCard } from '../../shared/ui/card';
import { TableColumn, UiDataTable } from '../../shared/ui/data-table';
import { UiFilterSelect } from '../../shared/ui/filter-select';
import { UiEmptyState, UiErrorState, UiLoadingState } from '../../shared/ui/states';
import { UiStatusBadge } from '../../shared/ui/status-badge';
import { ReportTrend } from './components/report-trend';
import { demoCsv, reportColumns } from './data-access/reports-analytics-csv';
import { ReportsAnalyticsDemoSource } from './data-access/reports-analytics-demo';
import {
  buildReport, categories, Category, Range, ranges, ReportEvent, ReportRow, ReportsSnapshot, reportTime,
} from './models/reports-analytics-view';

type State = { kind: 'loading' | 'error' } | { kind: 'ready'; snapshot: ReportsSnapshot };
type Report = ReturnType<typeof buildReport>;
type Placement = Report['placements'][number];
type Campaign = Report['campaigns'][number];

const defaultRange: Range = 30;

@Component({
  selector: 'wayhunter-reports-analytics-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe, DecimalPipe, UiButton, UiCard, UiDataTable, UiFilterSelect, UiEmptyState, UiErrorState,
    UiLoadingState, UiStatusBadge, ReportTrend,
  ],
  templateUrl: './reports-analytics.page.html',
  styleUrl: './reports-analytics.page.scss',
})
export class ReportsAnalyticsPage implements OnInit {
  private readonly source = inject(ReportsAnalyticsDemoSource);
  private exportAttempt = 0;

  protected readonly state = signal<State>({ kind: 'loading' });
  protected readonly exportFeedback = signal<{ outcome: 'started' | 'failed'; attempt: number } | null>(null);
  protected readonly range = signal<Range>(defaultRange);
  protected readonly category = signal<Category>('Overview');
  protected readonly rangeOptions = ranges.map(days => ({ value: String(days), label: 'Last ' + days + ' sample days' }));
  protected readonly categoryOptions = categories.map(category => ({ value: category, label: category }));
  protected readonly snapshot = computed(() => {
    const state = this.state();
    return state.kind === 'ready' ? state.snapshot : null;
  });
  protected readonly view = computed(() => {
    const snapshot = this.snapshot();
    return snapshot ? buildReport(snapshot, this.range(), this.category()) : null;
  });
  protected readonly granularity = computed(() => this.range() === 7 ? 'Daily' : 'Weekly');
  protected readonly reportColumns = reportColumns;
  protected readonly reportKey = (row: ReportRow) => row.id;
  protected readonly placementKey = (row: Placement) => row.label;
  protected readonly campaignKey = (row: Campaign) => row.label;
  protected readonly historyKey = (row: ReportEvent) => row.id;
  protected readonly placementColumns: readonly TableColumn<Placement>[] = [
    { id: 'placement', heading: 'Placement', cell: row => row.label },
    { id: 'impressions', heading: 'Impressions', cell: row => row.impressions },
    { id: 'clicks', heading: 'Clicks', cell: row => row.clicks },
    { id: 'ctr', heading: 'CTR', cell: row => row.ctr.toFixed(2) + '%' },
  ];
  protected readonly campaignColumns: readonly TableColumn<Campaign>[] = [
    { id: 'campaign', heading: 'Campaign', cell: row => row.label },
    { id: 'status', heading: 'Sample status', cell: row => row.status },
    { id: 'ads', heading: 'Associated ads', cell: row => row.ads },
    { id: 'impressions', heading: 'Impressions', cell: row => row.impressions },
    { id: 'clicks', heading: 'Clicks', cell: row => row.clicks },
    { id: 'ctr', heading: 'CTR', cell: row => row.ctr.toFixed(2) + '%' },
  ];
  protected readonly historyColumns: readonly TableColumn<ReportEvent>[] = [
    { id: 'id', heading: 'Sample reference', cell: row => row.id },
    { id: 'category', heading: 'Category', cell: row => row.category },
    { id: 'description', heading: 'Event', cell: row => row.description },
    { id: 'at', heading: 'Timestamp (UTC)', cell: row => reportTime.format(new Date(row.at)) },
    { id: 'source', heading: 'Source', cell: row => row.source },
    { id: 'status', heading: 'Status', cell: row => row.status },
  ];

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.exportFeedback.set(null);
    this.state.set({ kind: 'loading' });
    try {
      this.state.set({ kind: 'ready', snapshot: await this.source.load() });
    } catch {
      this.state.set({ kind: 'error' });
    }
  }

  protected selectRange(value: string): void {
    const range = ranges.find(days => String(days) === value);
    if (range && range !== this.range()) {
      this.range.set(range);
      this.exportFeedback.set(null);
    }
  }

  protected selectCategory(value: string): void {
    const category = categories.find(option => option === value);
    if (category && category !== this.category()) {
      this.category.set(category);
      this.exportFeedback.set(null);
    }
  }

  protected reset(): void {
    this.exportFeedback.set(null);
    this.range.set(defaultRange);
    this.category.set('Overview');
  }

  protected exportCsv(): void {
    const report = this.view();
    if (!report?.hasData) return;
    const attempt = ++this.exportAttempt;
    let url: string | undefined;
    let link: HTMLAnchorElement | undefined;
    let started = false;
    try {
      url = URL.createObjectURL(new Blob([demoCsv(report.rows)], { type: 'text/csv;charset=utf-8' }));
      link = document.createElement('a');
      link.href = url;
      link.download = 'wayhunter-fictional-demo-report-' + this.range() + 'd.csv';
      document.body.append(link);
      link.click();
      started = true;
    } catch {
      this.exportFeedback.set({ outcome: 'failed', attempt });
    } finally {
      link?.remove();
      if (url !== undefined) {
        const objectUrl = url;
        if (started) {
          // Keep the URL available for the browser to process the download request.
          setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      }
    }
    if (started) this.exportFeedback.set({ outcome: 'started', attempt });
  }
}
