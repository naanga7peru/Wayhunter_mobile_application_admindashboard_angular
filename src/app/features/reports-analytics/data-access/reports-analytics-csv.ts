import { TableColumn } from '../../../shared/ui/data-table';
import { ReportRow } from '../models/reports-analytics-view';

export const reportColumns: readonly TableColumn<ReportRow>[] = [
  { id: 'category', heading: 'Report category', cell: row => row.category },
  { id: 'metric', heading: 'Metric', cell: row => row.label },
  { id: 'period', heading: 'Current sample period (UTC)', cell: row => row.period },
  { id: 'previous-period', heading: 'Previous sample period (UTC)', cell: row => row.comparisonPeriod },
  { id: 'current', heading: 'Current sample value', cell: row => row.current },
  { id: 'previous', heading: 'Previous sample value', cell: row => row.previous },
  { id: 'change', heading: 'Change', cell: row => row.change },
  { id: 'status', heading: 'Data status', cell: row => row.status },
];

export function csvCell(value: string): string {
  const safe = /^[\s\uFEFF]*[=+\-@]|^[\t\r\n]/u.test(value) ? "'" + value : value;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export function demoCsv(rows: readonly ReportRow[]): string {
  const headers = reportColumns.map(column => column.heading);
  const cells = rows.map(row => reportColumns.map(column => String(column.cell(row) ?? '')));
  return '\uFEFF' + [headers, ...cells].map(record => record.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
