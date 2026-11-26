import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { UiButton } from './button';
import { UiCard } from './card';
import { TableColumn, UiDataTable } from './data-table';
import { UiFilterSelect } from './filter-select';
import { UiSearchInput } from './search-input';
import { UiErrorState } from './states';
import { UiStatusBadge } from './status-badge';

interface Row {
  id: number;
  name: string;
}

@Component({
  imports: [UiButton, UiCard, UiStatusBadge, UiSearchInput, UiFilterSelect, UiDataTable, UiErrorState],
  template: `
    <wh-card [heading]="heading()">
      <button whButton variant="danger" [loading]="busy()" [disabled]="disabled()" (click)="clicks = clicks + 1">Remove</button>
      <wh-status-badge tone="warning" label="Pending" />
    </wh-card>
    <wh-search-input label="Search records" [(value)]="query" />
    <wh-filter-select label="Status" [options]="options" [(value)]="status" />
    <wh-data-table caption="Records" [rows]="rows()" [columns]="columns" [rowKey]="key" [loading]="busy()" />
    <wh-error-state message="Failed to load" retryLabel="Retry" (retry)="retries = retries + 1" />
  `,
})
class TestHost {
  readonly heading = signal('Actions');
  readonly busy = signal(false);
  readonly disabled = signal(false);
  readonly query = signal('');
  readonly status = signal('ready');
  readonly rows = signal<readonly Row[]>([{ id: 1, name: 'Alpha' }]);
  readonly options = [{ value: '', label: 'Any' }, { value: 'ready', label: 'Ready' }];
  readonly columns: readonly TableColumn<Row>[] = [{ id: 'name', heading: 'Name', cell: row => row.name }];
  readonly key = (row: Row) => row.id;
  clicks = 0;
  retries = 0;
}

describe('shared UI', () => {
  async function render() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, host: fixture.componentInstance, page: fixture.nativeElement as HTMLElement };
  }

  it('uses a native button and blocks clicks while loading or disabled', async () => {
    const { fixture, host, page } = await render();
    const button = page.querySelector<HTMLButtonElement>('button[whButton]')!;

    expect(button.type).toBe('button');
    expect(button.dataset['variant']).toBe('danger');
    button.click();
    host.busy.set(true);
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    button.click();

    host.busy.set(false);
    host.disabled.set(true);
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
    expect(button.hasAttribute('aria-busy')).toBe(false);
    button.click();
    expect(host.clicks).toBe(1);
  });

  it('renders optional card headings, projected content, and readable badges', async () => {
    const { fixture, host, page } = await render();
    expect(page.querySelector('wh-card h2')?.textContent).toBe('Actions');
    host.heading.set('');
    fixture.detectChanges();
    expect(page.querySelector('wh-card h2')).toBeNull();
    expect(page.querySelector('wh-card button')?.textContent?.trim()).toBe('Remove');
    expect(page.querySelector('wh-status-badge[data-tone="warning"]')?.textContent).toBe('Pending');
  });

  it('labels native controls and synchronizes their values in both directions', async () => {
    const { fixture, host, page } = await render();
    const search = page.querySelector<HTMLInputElement>('input[type="search"]')!;
    const select = page.querySelector<HTMLSelectElement>('select')!;

    expect(search.labels?.[0].textContent?.trim()).toBe('Search records');
    expect(select.labels?.[0].textContent).toContain('Status');
    expect(select.value).toBe('ready');
    search.value = 'Alpha';
    search.dispatchEvent(new Event('input'));
    select.value = '';
    select.dispatchEvent(new Event('change'));
    expect(host.query()).toBe('Alpha');
    expect(host.status()).toBe('');
    fixture.detectChanges();

    host.query.set('Beta');
    host.status.set('ready');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(search.value).toBe('Beta');
    expect(select.value).toBe('ready');
  });

  it('shows the loading state before rows and the empty state after rows are cleared', async () => {
    const { fixture, host, page } = await render();
    const table = page.querySelector('wh-data-table')!;
    expect(table.querySelector('caption')?.textContent).toBe('Records');
    expect(table.querySelector('th[scope="col"]')?.textContent).toBe('Name');
    expect(table.querySelector('td')?.textContent).toBe('Alpha');

    host.busy.set(true);
    host.rows.set([]);
    fixture.detectChanges();
    expect(table.querySelector('[role="status"]')?.textContent).toContain('Loading');
    expect(table.querySelector('table')).toBeNull();

    host.busy.set(false);
    fixture.detectChanges();
    expect(table.querySelector('[role="status"]')?.textContent).toContain('No records');
  });

  it('announces errors and emits the optional retry action', async () => {
    const { host, page } = await render();
    expect(page.querySelector('[role="alert"]')?.textContent).toBe('Failed to load');
    page.querySelector<HTMLButtonElement>('wh-error-state button')!.click();
    expect(host.retries).toBe(1);
  });

  it('shows the showcase title under preview and keeps the Admin guard in effect', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const harness = await RouterTestingHarness.create('/preview/shared-ui');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Shared UI');
    expect(harness.routeNativeElement?.querySelectorAll('nav[aria-label="Admin navigation groups"] button').length).toBe(5);
    expect(harness.routeNativeElement?.querySelector('nav[aria-label="Admin modules"]')?.hasAttribute('inert')).toBe(true);
    expect(harness.routeNativeElement?.querySelector('wh-data-table tbody tr')).toBeTruthy();

    await harness.navigateByUrl('/admin/shared-ui');
    expect(harness.routeNativeElement?.querySelector('wh-data-table')).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/login');
  });
});
