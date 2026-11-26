import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { UiCard } from '../../../shared/ui/card';
import { UiDataTable, TableColumn } from '../../../shared/ui/data-table';
import { DashboardPoint } from '../models/dashboard-view';

interface ChartRow { label: string; value: number; }

@Component({
  selector: 'wayhunter-dashboard-chart',
  standalone: true,
  imports: [DecimalPipe, UiCard, UiDataTable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <wh-card [heading]="heading()">
      <p class="total"><strong>{{ total() | number }}</strong> {{ unit() }} in this sample period</p>
      <figure>
        <div class="plot" aria-hidden="true">
          <div class="scale"><span>{{ ceiling() | number }}</span><span>0</span></div>
          @if (kind() === 'bars') {
            <div class="bars">
              @for (row of rows(); track row.label) {
                <span [class.peak]="row.value === ceiling()" [style.height.%]="100 * row.value / ceiling()"></span>
              }
            </div>
          } @else {
            <svg viewBox="0 0 300 120" preserveAspectRatio="none">
              <polygon [attr.points]="'0,120 ' + coordinates() + ' 300,120'" />
              <polyline [attr.points]="coordinates()" vector-effect="non-scaling-stroke" />
            </svg>
          }
        </div>
        <figcaption>
          <span>{{ rows()[0]?.label }}</span>
          <span>{{ rows().at(-1)?.label }}</span>
        </figcaption>
      </figure>
      <details>
        <summary>View {{ unit() }} chart data</summary>
        <wh-data-table [caption]="heading() + ' · sample data'" [rows]="rows()" [columns]="columns" [rowKey]="rowKey" />
      </details>
    </wh-card>
  `,
  styles: `
    :host { display: block; min-width: 0; }
    wh-card { height: 100%; }
    .total { margin: 0; color: var(--muted); font-size: .875rem; }
    strong { font-size: 1.65rem; color: var(--ink); margin-inline-end: .25rem; }
    figure { margin: 1rem 0; }
    .plot { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: .65rem; height: clamp(8rem, 12vw, 11rem); }
    .scale, figcaption { display: flex; justify-content: space-between; color: var(--muted); font-size: .75rem; }
    .scale { flex-direction: column; text-align: end; }
    figcaption { gap: 1rem; margin-block-start: .4rem; }
    .bars, svg {
      width: 100%; height: 100%; min-height: 0; border-block-end: 1px solid var(--control-border);
      background: repeating-linear-gradient(to top, transparent 0 calc(25% - 1px), var(--line) calc(25% - 1px) 25%), var(--workspace-bg);
      border-radius: .6rem .6rem 0 0;
    }
    .bars { display: flex; align-items: end; justify-content: space-around; gap: 3%; padding-inline: 3%; }
    .bars span { width: 100%; max-width: 1.2rem; border-radius: 99px; background: #b8b5ae; }
    .bars span.peak { background: linear-gradient(var(--coral), var(--pink)); }
    svg { display: block; }
    @media (prefers-reduced-motion: no-preference) {
      .plot { animation: chart-in 300ms ease-out; }
      @keyframes chart-in { from { opacity: .35; transform: translateY(4px); } }
    }
    polygon { fill: var(--chart-fill); opacity: .8; }
    polyline { fill: none; stroke: var(--chart-ink); stroke-width: 2.5px; stroke-linejoin: round; }
    summary { width: fit-content; padding-block: .35rem; cursor: pointer; color: var(--accent); font-size: .875rem; font-weight: 650; }
    details[open] wh-data-table { margin-block-start: .65rem; }
  `,
})
export class DashboardChart {
  readonly heading = input.required<string>();
  readonly unit = input.required<string>();
  readonly kind = input.required<'bars' | 'line'>();
  readonly points = input.required<readonly DashboardPoint[]>();

  protected readonly rows = computed<readonly ChartRow[]>(() => {
    const key = this.kind() === 'bars' ? 'trips' : 'newUsers';
    return this.points().map(point => ({ label: point.label, value: point[key] }));
  });
  protected readonly total = computed(() => this.rows().reduce((sum, row) => sum + row.value, 0));
  protected readonly ceiling = computed(() => Math.max(1, ...this.rows().map(row => row.value)));
  protected readonly coordinates = computed(() => this.rows().map((row, index, rows) =>
    (300 * index / Math.max(1, rows.length - 1)) + ',' + (120 * (1 - row.value / this.ceiling())),
  ).join(' '));

  protected readonly rowKey = (row: ChartRow) => row.label;
  protected readonly columns: readonly TableColumn<ChartRow>[] = [
    { id: 'period', heading: 'Period (UTC)', cell: row => row.label },
    { id: 'count', heading: 'Count', cell: row => row.value },
  ];
}
