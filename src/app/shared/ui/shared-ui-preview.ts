import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ButtonVariant, UiButton } from './button';
import { UiCard } from './card';
import { TableColumn, UiDataTable } from './data-table';
import { FilterOption, UiFilterSelect } from './filter-select';
import { UiSearchInput } from './search-input';
import { UiEmptyState, UiErrorState, UiLoadingState } from './states';
import { StatusTone, UiStatusBadge } from './status-badge';

interface SampleRow {
  readonly id: number;
  readonly name: string;
  readonly status: 'Ready' | 'Pending';
}

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButton, UiCard, UiDataTable, UiFilterSelect, UiSearchInput,
    UiEmptyState, UiErrorState, UiLoadingState, UiStatusBadge],
  template: `
    <div class="examples">
      <wh-card heading="Buttons and badges">
        <div class="items">
          @for (variant of variants; track variant) {
            <button whButton [variant]="variant">{{ variant }}</button>
          }
          <button whButton disabled>Disabled</button>
          <button whButton loading>Saving</button>
        </div>
        <div class="items badges">
          @for (badge of badges; track badge.tone) {
            <wh-status-badge [tone]="badge.tone" [label]="badge.label" />
          }
        </div>
      </wh-card>
      <wh-card heading="Search and filter">
        <div class="fields">
          <wh-search-input label="Search samples" [(value)]="query" />
          <wh-filter-select label="Status" [options]="filters" [(value)]="status" />
        </div>
        <wh-data-table caption="Sample records" [rows]="filteredRows()" [columns]="columns"
                       [rowKey]="rowKey" emptyMessage="No samples match your filters." />
      </wh-card>
      <wh-card heading="Feedback states">
        <div class="examples">
          <wh-loading-state />
          <wh-empty-state />
          @if (retried()) {
            <p role="status">Sample retry completed.</p>
          } @else {
            <wh-error-state message="The sample could not load." retryLabel="Retry sample"
                            (retry)="retried.set(true)" />
          }
        </div>
      </wh-card>
    </div>
  `,
  styles: `
    .examples, .fields { display: grid; gap: 1rem; }
    .items { display: flex; flex-wrap: wrap; gap: .65rem; }
    .items button { text-transform: capitalize; }
    .badges, wh-data-table { margin-top: 1rem; }
    .fields { grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr)); }
  `,
})
export class SharedUiPreview {
  protected readonly variants: readonly ButtonVariant[] = ['primary', 'secondary', 'outline', 'ghost', 'danger'];
  protected readonly badges: readonly { tone: StatusTone; label: string }[] = [
    { tone: 'success', label: 'Ready' },
    { tone: 'warning', label: 'Pending' },
    { tone: 'danger', label: 'Failed' },
    { tone: 'info', label: 'In review' },
    { tone: 'neutral', label: 'Draft' },
  ];
  protected readonly filters: readonly FilterOption[] = [
    { value: '', label: 'All statuses' },
    { value: 'Ready', label: 'Ready' },
    { value: 'Pending', label: 'Pending' },
  ];
  private readonly rows: readonly SampleRow[] = [
    { id: 1, name: 'Sample A', status: 'Ready' },
    { id: 2, name: 'Sample B', status: 'Pending' },
  ];
  protected readonly columns: readonly TableColumn<SampleRow>[] = [
    { id: 'name', heading: 'Sample', cell: row => row.name },
    { id: 'status', heading: 'Status', cell: row => row.status },
  ];
  protected readonly rowKey = (row: SampleRow) => row.id;
  protected readonly query = signal('');
  protected readonly status = signal('');
  protected readonly retried = signal(false);
  protected readonly filteredRows = computed(() => {
    const query = this.query().trim().toLowerCase();
    const status = this.status();
    return this.rows.filter(row => row.name.toLowerCase().includes(query) && (!status || row.status === status));
  });
}
