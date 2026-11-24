import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';
import { routes } from '../../app.routes';
import { csvCell, demoCsv } from './data-access/reports-analytics-csv';
import { ReportsAnalyticsDemoSource } from './data-access/reports-analytics-demo';
import { buildReport, changeLabel, ReportsSnapshot, shiftDate } from './models/reports-analytics-view';
import { ReportsAnalyticsPage } from './reports-analytics.page';

const demo = new ReportsAnalyticsDemoSource();
const fixture = () => demo.load();
const empty: ReportsSnapshot = { asOf: '2026-11-23T23:59:59Z', days: [], campaigns: [], vouchers: [], history: [] };

describe('ADM-15 Reports & Analytics', () => {
  async function openPage(load?: ReportsAnalyticsDemoSource['load']) {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), ...(load ? [{ provide: ReportsAnalyticsDemoSource, useValue: { load } }] : [])],
    });
    const harness = await RouterTestingHarness.create('/preview/reports-analytics');
    const refresh = async () => {
      await harness.fixture.whenStable();
      harness.detectChanges();
    };
    await refresh();
    const page = harness.routeNativeElement!.querySelector('wayhunter-reports-analytics-page')!;
    const [date, category] = page.querySelectorAll('select');
    function set(select: HTMLSelectElement, value: string) {
      select.value = value;
      select.dispatchEvent(new Event('change'));
      harness.detectChanges();
    }
    const metrics = () => Array.from(page.querySelectorAll('.kpi-value'), node => node.textContent?.trim());
    const summary = () => Array.from(page.querySelectorAll('wh-data-table caption'))
      .find(node => node.textContent?.includes('metric comparisons'))?.closest('table');
    return { harness, page, date, category, set, metrics, refresh, summary };
  }

  it('loads the existing route and shows the six initial sample metrics', async () => {
    const { page, date, metrics } = await openPage();
    expect(page.querySelector('.intro')?.textContent).toContain('Fictional statistics');
    expect(page.querySelector('.intro')?.textContent).toContain('23 Nov 2026');
    expect(date.value).toBe('30');
    expect(metrics()).toEqual(['271', '107', '45', '30', '37,100 Coins', '7,815']);
  });

  it.each([
    ['7', '17 Nov 2026', '63', 7],
    ['30', '25 Oct 2026', '271', 5],
    ['90', '26 Aug 2026', '763', 13],
  ])('filters the cards, charts and table to %s days', async (days, start, users, buckets) => {
    const { page, date, category, set, metrics, summary } = await openPage();
    set(date, '7');
    set(date, days);
    expect(metrics()[0]).toBe(users);
    expect(page.querySelector('.period')?.textContent).toContain(start + ' – 23 Nov 2026');
    expect(summary()?.textContent).toContain(start + ' – 23 Nov 2026');
    set(category, 'Users');
    expect(page.querySelectorAll('wayhunter-report-trend tbody tr')).toHaveLength(buckets);
    expect(page.querySelector('wayhunter-report-trend [role="img"]')?.getAttribute('aria-label')).toContain('New registrations');
  });

  it('changes module without resetting the date and scopes the summary and history', async () => {
    const { page, date, category, set, summary } = await openPage();
    set(date, '7');
    set(category, 'Trips');
    expect(date.value).toBe('7');
    expect(page.querySelector('.panels')?.textContent).toContain('Trip Analytics');
    expect(page.querySelector('.panels')?.textContent).not.toContain('User Growth');
    expect(summary()?.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(summary()?.textContent).toContain('17 Nov 2026');
    expect(page.textContent).toContain('DEMO-R02');
    expect(page.textContent).not.toContain('DEMO-R01');
  });

  it('resets both report filters', async () => {
    const { harness, page, date, category, set, metrics } = await openPage();
    set(date, '90');
    set(category, 'Hunters & Games');
    Array.from(page.querySelectorAll('button')).find(button => button.textContent?.includes('Reset filters'))!.click();
    harness.detectChanges();
    expect(date.value).toBe('30');
    expect(category.value).toBe('Overview');
    expect(metrics()).toHaveLength(6);
  });

  it('compares registration totals and sums the trend without counting active users', async () => {
    const sample = await fixture();
    const report = buildReport(sample, 7, 'Users');
    expect(report.rows).toHaveLength(1);
    expect(report.rows[0].current).toBe('63');
    const previous = sample.days.slice(-14, -7).reduce((sum, day) => sum + day.registrations, 0);
    expect(report.rows[0].previous).toBe(String(previous));
    expect(report.trends.users.reduce((sum, point) => sum + point.value, 0)).toBe(63);
    expect(report.comparisonLabel).toBe('10 Nov 2026 – 16 Nov 2026');
    expect(shiftDate('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('requires a start and valid finish for completion and includes daily trip breakdowns', async () => {
    const report = buildReport(await fixture(), 7, 'Trips');
    expect(report.rows.map(row => row.current)).toEqual(['40', '26', '7']);
    expect(report.trends.trips.reduce((sum, point) => sum + point.started, 0)).toBe(40);
    expect(report.trends.trips.reduce((sum, point) => sum + point.cancelled, 0)).toBe(7);
  });

  it('counts Hunter submissions by review state', async () => {
    const report = buildReport(await fixture(), 7, 'Hunters & Games');
    expect(report.rows.filter(row => row.section === 'Hunter Analytics').map(row => row.current)).toEqual(['17', '10', '3', '4']);
  });

  it('separates game creation approvals from verified wins and retains archived records', async () => {
    const sample = await fixture();
    const seven = buildReport(sample, 7, 'Hunters & Games');
    expect(seven.rows.filter(row => row.section === 'Game Analytics').map(row => row.current)).toEqual(['14', '7', '7', '2', '0']);
    const ninety = buildReport(sample, 90, 'Hunters & Games');
    expect(ninety.rows.find(row => row.id === 'archived')?.current).toBe('60');
    expect(ninety.rows.find(row => row.id === 'game-approved')?.current).toBe('90');
  });

  it('reports awards and finalized debits separately from open reservations', async () => {
    const report = buildReport(await fixture(), 7, 'Coins & Rewards');
    expect(report.rows.map(row => row.current)).toEqual([
      '8,500 Coins', '10,000 Coins', '20,000 Coins', '5,600 Coins', '2,000 Coins', '700 Coins', '200 Coins',
    ]);
    expect(report.rows.find(row => row.id === 'reserved')?.previous).toBe('10,000 Coins');
  });

  it('calculates weighted advertisement CTR and counts shared ad delivery once', async () => {
    const report = buildReport(await fixture(), 30, 'Advertisements & Campaigns');
    expect(report.rows.filter(row => row.section === 'Ads Performance').map(row => row.current)).toEqual([
      '7,815', '260', '3.33%',
    ]);
    expect(report.placements.reduce((sum, row) => sum + row.impressions, 0)).toBe(7815);
    expect(report.campaigns.reduce((sum, row) => sum + row.impressions, 0)).toBe(7815);
  });

  it('handles zero impressions and renders a no-data advertisement chart', async () => {
    const sample = await fixture();
    const noDelivery = { ...sample, days: sample.days.map(day => ({ ...day, ads: [] })) };
    const report = buildReport(noDelivery, 30, 'Advertisements & Campaigns');
    expect(report.rows.find(row => row.id === 'ctr')?.current).toBe('0.0%');
    const { page, category, set } = await openPage(async () => noDelivery);
    set(category, 'Advertisements & Campaigns');
    expect(page.querySelector('wayhunter-report-trend wh-empty-state')?.textContent).toContain('No sample chart data');
  });

  it('counts campaign statuses and distinct linked ads for the filtered period', async () => {
    const report = buildReport(await fixture(), 7, 'Advertisements & Campaigns');
    expect(report.rows.filter(row => row.section === 'Campaigns Report').map(row => row.current))
      .toEqual(['4', '2', '1', '1', '4']);
    expect(report.campaigns.reduce((sum, row) => sum + row.ads, 0)).toBe(5);
  });

  it('formats percentage change and labels an unavailable zero baseline', () => {
    expect(changeLabel(12, 8)).toBe('+50.0%');
    expect(changeLabel(0, 8)).toBe('-100.0%');
    expect(changeLabel(0, 0)).toBe('0.0%');
    expect(changeLabel(1, 0)).toBe('Unavailable (zero baseline)');
    expect(changeLabel(5, 3, true)).toBe('+2.0 pp');
  });

  it('downloads exactly the displayed summary rows for the selected report scope', async () => {
    const { harness, page, date, category, set } = await openPage();
    set(date, '7');
    set(category, 'Users');
    const report = buildReport(await fixture(), 7, 'Users');
    const create = vi.fn((_blob: Blob) => 'blob:sample');
    const revoke = vi.fn();
    vi.stubGlobal('URL', class extends URL {
      static override createObjectURL = create;
      static override revokeObjectURL = revoke;
    });
    let filename = '';
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      filename = this.download;
    });
    vi.useFakeTimers();
    try {
      Array.from(page.querySelectorAll('button')).find(button => button.textContent?.includes('Export Demo CSV'))!.click();
      harness.detectChanges();
      expect(page.querySelector('.summary-actions + [role="status"]')?.textContent).toContain('CSV download started.');
      expect(filename).toBe('wayhunter-fictional-demo-report-7d.csv');
      expect(document.querySelector('a[download]')).toBeNull();
      const blob = create.mock.calls[0][0];
      expect(blob.type).toBe('text/csv;charset=utf-8');
      const csv = await blob.text();
      expect(csv).toBe(demoCsv(report.rows).replace(/^\uFEFF/u, ''));
      expect(csv).toContain('"Users","Registered users","17 Nov 2026 – 23 Nov 2026"');
      expect(csv).toContain('"Fictional demo data"');
      expect(csv).not.toContain('Completed trips');
      vi.runOnlyPendingTimers();
      expect(revoke).toHaveBeenCalledWith('blob:sample');
    } finally {
      vi.useRealTimers();
      click.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it.each(['object URL creation', 'link activation'])('recovers from %s failure', async failure => {
    const { harness, page, date, category, set } = await openPage();
    const create = vi.fn(() => 'blob:sample');
    const revoke = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const fail = () => { throw new Error('Download setup failed'); };
    if (failure === 'object URL creation') create.mockImplementationOnce(fail);
    else click.mockImplementationOnce(fail);

    vi.stubGlobal('URL', class extends URL {
      static override createObjectURL = create;
      static override revokeObjectURL = revoke;
    });
    vi.useFakeTimers();
    const button = (label: string) => Array.from(page.querySelectorAll('button'))
      .find(candidate => candidate.textContent?.includes(label))!;
    const exportCsv = () => {
      button('Export Demo CSV').click();
      harness.detectChanges();
    };
    try {
      exportCsv();
      expect(page.querySelector('[role="alert"]')?.textContent)
        .toContain('CSV export could not be started. Please try again.');
      expect(button('Export Demo CSV').disabled).toBe(false);
      expect(click).toHaveBeenCalledTimes(failure === 'link activation' ? 1 : 0);
      expect(revoke).toHaveBeenCalledTimes(failure === 'link activation' ? 1 : 0);
      if (failure === 'link activation') expect(revoke).toHaveBeenCalledWith('blob:sample');
      expect(document.querySelector('a[download]')).toBeNull();

      exportCsv();
      expect(page.querySelector('[role="alert"]')?.textContent?.trim()).toBe('');
      const status = () => page.querySelector('.summary-actions + [role="status"]')?.textContent?.trim();
      expect(status()).toContain('CSV download started.');
      expect(document.querySelector('a[download]')).toBeNull();
      vi.runOnlyPendingTimers();
      expect(revoke).toHaveBeenCalledTimes(failure === 'link activation' ? 2 : 1);
      expect(revoke).toHaveBeenLastCalledWith('blob:sample');

      set(date, '7');
      expect(status()).toBe('');
      exportCsv();
      set(category, 'Trips');
      expect(status()).toBe('');
      exportCsv();
      button('Reset filters').click();
      harness.detectChanges();
      expect(status()).toBe('');
      expect(date.value).toBe('30');
      expect(category.value).toBe('Overview');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
      click.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it.each([
    ['success', 'success'],
    ['failure', 'failure'],
    ['failure', 'success'],
    ['success', 'failure'],
  ])('updates its live regions for %s followed by %s', async (first, second) => {
    const { harness, page } = await openPage();
    const status = page.querySelector('.summary-actions + [role="status"]')!;
    const alert = page.querySelector('[role="alert"]')!;
    const button = Array.from(page.querySelectorAll('button'))
      .find(candidate => candidate.textContent?.includes('Export Demo CSV'))!;
    const create = vi.fn(() => 'blob:sample');
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    vi.stubGlobal('URL', class extends URL {
      static override createObjectURL = create;
      static override revokeObjectURL = vi.fn();
    });
    vi.useFakeTimers();
    try {
      const announcements = [first, second].map((outcome, index) => {
        if (outcome === 'failure') {
          create.mockImplementationOnce(() => { throw new Error('Download setup failed'); });
        }
        button.click();
        harness.detectChanges();
        const region = outcome === 'success' ? status : alert;
        const inactive = outcome === 'success' ? alert : status;
        const message = outcome === 'success'
          ? 'CSV download started.'
          : 'CSV export could not be started. Please try again.';
        const announcement = region.textContent?.trim();
        expect(region.getAttribute('aria-atomic')).toBe('true');
        expect(announcement).toContain(message);
        expect(announcement).toContain('Attempt ' + (index + 1) + '.');
        expect(inactive.textContent?.trim()).toBe('');
        return announcement;
      });
      expect(announcements[1]).not.toBe(announcements[0]);
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
      click.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it('escapes quotes, commas and line breaks and neutralizes formula prefixes', () => {
    expect(csvCell('A, "B"\nC')).toBe('"A, ""B""\nC"');
    for (const value of ['=1+1', '+SUM(A1)', '-2+5', '@name', ' \t=1', '\rplain']) {
      expect(csvCell(value)).toBe('"\'' + value + '"');
    }
    expect(demoCsv([]).charCodeAt(0)).toBe(0xfeff);
  });

  it('distinguishes missing filtered records from zero and shows no export for empty reports', async () => {
    const sample = await fixture();
    const outsideWeek = { ...sample, days: sample.days.slice(0, -8) };
    const { harness, page, date, set, refresh } = await openPage(async () => outsideWeek);
    const component: ReportsAnalyticsPage = harness.fixture.debugElement
      .query(By.directive(ReportsAnalyticsPage)).componentInstance;
    set(date, '7');
    expect(page.textContent).toContain('No sample reports are available');
    expect(page.textContent).toContain('No sample chart data');
    expect(page.textContent).not.toContain('Export Demo CSV');
    expect(buildReport(outsideWeek, 7, 'Users').rows[0].current).toBe('Unavailable');

    const create = vi.fn(() => { throw new Error('Download setup failed'); });
    vi.stubGlobal('URL', class extends URL {
      static override createObjectURL = create;
    });
    try {
      component['exportCsv']();
      harness.detectChanges();
      expect(create).not.toHaveBeenCalled();
      expect(page.textContent).not.toContain('Attempt ');

      set(date, '30');
      page.querySelector<HTMLButtonElement>('.summary-actions button')!.click();
      harness.detectChanges();
      expect(create).toHaveBeenCalledTimes(1);
      expect(page.querySelector('[role="alert"]')?.textContent).toContain('Attempt 1.');

      await component['load']();
      await refresh();
      expect(page.querySelector('[role="alert"]')?.textContent?.trim()).toBe('');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('shows an unavailable comparison when the preceding period has no fixture coverage', async () => {
    const sample = await fixture();
    const lastWeek = { ...sample, days: sample.days.slice(-7) };
    const report = buildReport(lastWeek, 7, 'Users');
    expect(report.rows[0].current).toBe('63');
    expect(report.rows[0].previous).toBe('Unavailable');
    expect(report.rows[0].change).toBe('Unavailable');
  });

  it('announces loading and a retryable error, then loads the sample', async () => {
    let rejectLoad!: (reason: Error) => void;
    const pending = new Promise<ReportsSnapshot>((_, reject) => { rejectLoad = reject; });
    let attempts = 0;
    const { page, refresh } = await openPage(() => ++attempts === 1 ? pending : Promise.resolve(empty));
    expect(page.querySelector('wh-loading-state [role="status"]')?.textContent).toContain('Loading sample reports');
    rejectLoad(new Error('Fixture unavailable'));
    await refresh();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('could not be loaded');
    page.querySelector<HTMLButtonElement>('wh-error-state button')!.click();
    await refresh();
    expect(attempts).toBe(2);
    expect(page.querySelector('[role="alert"]')).toBeNull();
    expect(page.querySelector('wh-empty-state')?.textContent).toContain('No sample reports');
  });
});
