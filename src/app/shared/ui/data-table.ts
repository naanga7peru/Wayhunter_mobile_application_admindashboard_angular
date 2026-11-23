import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiEmptyState, UiLoadingState } from './states';

export interface TableColumn<Row> {
  readonly id: string;
  readonly heading: string;
  readonly cell: (row: Row) => string | number | null | undefined;
}

@Component({
  selector: 'wh-data-table',
  standalone: true,
  imports: [UiLoadingState, UiEmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <wh-loading-state [message]="loadingMessage()" />
    } @else if (rows().length === 0) {
      <wh-empty-state [message]="emptyMessage()" />
    } @else {
      <div class="scroll" role="region" [attr.aria-label]="caption() + ' table scroll area'" tabindex="0">
        <table>
          <caption>{{ caption() }}</caption>
          <thead>
            <tr>
              @for (column of columns(); track column.id) {
                <th scope="col">{{ column.heading }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track rowKey()(row)) {
              <tr>
                @for (column of columns(); track column.id) {
                  <td>{{ column.cell(row) ?? '—' }}</td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: `
    :host { display: block; min-width: 0; }
    .scroll { overflow-x: auto; border: 1px solid var(--line); border-radius: var(--radius-control); }
    table { width: 100%; border-collapse: collapse; text-align: start; font-size: .875rem; }
    caption, th, td { padding: .75rem 1rem; overflow-wrap: anywhere; }
    caption { text-align: start; font-weight: 700; }
    th, td { border-block-start: 1px solid var(--line); text-align: start; }
    th { background: var(--neutral-bg); color: var(--ink); }
  `,
})
export class UiDataTable<Row> {
  readonly caption = input.required<string>();
  readonly rows = input.required<readonly Row[]>();
  readonly columns = input.required<readonly TableColumn<Row>[]>();
  readonly rowKey = input.required<(row: Row) => string | number>();
  readonly loading = input(false, { transform: booleanAttribute });
  readonly loadingMessage = input('Loading records…');
  readonly emptyMessage = input('No records to display.');
}
