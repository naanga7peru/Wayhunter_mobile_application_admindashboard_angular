import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { UiDataTable, TableColumn } from '../../../shared/ui/data-table';
import { UiEmptyState } from '../../../shared/ui/states';
import { TrendPoint } from '../models/reports-analytics-view';

@Component({
  selector: 'wayhunter-report-trend',
  standalone: true,
  imports: [DecimalPipe, UiDataTable, UiEmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (points().length) {
      <figure>
        <figcaption><strong>{{ label() }}</strong> · {{ granularity() }} sample totals (UTC)</figcaption>
        <div class="chart" role="img" [attr.aria-label]="label() + ' by ' + granularity() + ' interval, from '
             + points()[0].label + ' through ' + points().at(-1)?.label + '. Exact values in the chart data table.'">
          <div class="scale" aria-hidden="true"><span>{{ ceiling() | number }}</span><span>0</span></div>
          <div class="bars" aria-hidden="true">
            @for (point of points(); track point.label) {
              <span [style.height.%]="point.value / ceiling() * 100"></span>
            }
          </div>
        </div>
        <div class="axis"><span>{{ points()[0].label }}</span><span>{{ points().at(-1)?.label }}</span></div>
      </figure>
      <details>
        <summary>View {{ label() }} chart data</summary>
        <wh-data-table [caption]="label() + ' · fictional demo data'" [rows]="points()" [columns]="columns()" [rowKey]="key" />
      </details>
    } @else {
      <wh-empty-state [message]="'No sample chart data for ' + label() + ' in this range.'" />
    }
  `,
  styles: `
    :host { display: block; min-width: 0; }
    figure { margin: 1rem 0 .5rem; }
    figcaption { margin-bottom: .75rem; color: var(--muted); }
    figcaption strong { color: var(--ink); }
    .chart { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: .6rem; height: 8.5rem; }
    .scale, .axis { display: flex; justify-content: space-between; gap: .5rem; color: var(--muted); font-size: .8125rem; }
    .scale { flex-direction: column; text-align: end; }
    .axis { margin-top: .4rem; flex-wrap: wrap; }
    .bars {
      display: flex; align-items: end; gap: clamp(.16rem, 1vw, .65rem); justify-content: center; padding-inline: .45rem;
      border-block-end: 1px solid var(--control-border);
      background: repeating-linear-gradient(to top, transparent 0 calc(25% - 1px), var(--line) calc(25% - 1px) 25%);
    }
    .bars span { flex: 1; max-width: 3rem; border-radius: .35rem .35rem 0 0; background: linear-gradient(#6889e6, var(--accent)); }
    summary { cursor: pointer; color: var(--accent); padding-block: .55rem; font-weight: 650; }
  `,
})
export class ReportTrend {
  readonly label = input.required<string>();
  readonly granularity = input.required<string>();
  readonly points = input.required<readonly TrendPoint[]>();
  readonly tripCounts = input(false);
  protected readonly ceiling = computed(() => Math.max(1, ...this.points().map(point => point.value)));
  protected readonly key = (point: TrendPoint) => point.label;
  protected readonly columns = computed<readonly TableColumn<TrendPoint>[]>(() => [
    { id: 'interval', heading: 'Interval (UTC)', cell: point => point.label },
    { id: 'total', heading: this.label(), cell: point => point.value },
    ...(this.tripCounts() ? [
      { id: 'started', heading: 'Started trips', cell: (point: TrendPoint) => point.started },
      { id: 'cancelled', heading: 'Cancelled trips', cell: (point: TrendPoint) => point.cancelled },
    ] : []),
  ]);
}
