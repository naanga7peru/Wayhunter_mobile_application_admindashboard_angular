import { TestBed } from '@angular/core/testing';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { filter, firstValueFrom, Subject } from 'rxjs';
import { routes } from '../../app.routes';
import { ApiClientService, HealthResponse } from '../../core/http/api-client.service';
import { DASHBOARD_DEMO_SOURCE, getDashboardDemo } from './data-access/dashboard-demo';
import { DashboardRange, DashboardSourceResult } from './models/dashboard-view';

describe('ADM-02 Dashboard', () => {
  const labels = ['Sample total users', 'Sample trips', 'Sample review requests opened',
    'Sample campaign starts', 'Sample vouchers issued'];

  const sampleUsers = 12_846;
  const format = new Intl.NumberFormat('en-US');
  // Fixed expectations independently calculated from the UTC seed windows.
  const seededRanges = [
    { range: '7', period: '16 Nov – 22 Nov 2026', newAccounts: 232, trips: 380,
      reviews: 4, reviewChange: 0, campaigns: 1, vouchers: 5, events: 4 },
    { range: '30', period: '24 Oct – 22 Nov 2026', newAccounts: 927, trips: 1_531,
      reviews: 18, reviewChange: 2, campaigns: 5, vouchers: 20, events: 6 },
    { range: '90', period: '25 Aug – 22 Nov 2026', newAccounts: 2_478, trips: 4_213,
      reviews: 51, reviewChange: 1, campaigns: 15, vouchers: 60, events: 8 },
  ] as const;

  function expectedKpis(seed: typeof seededRanges[number]) {
    return [sampleUsers, seed.trips, seed.reviews, seed.campaigns, seed.vouchers];
  }

  async function openDashboard(source?: (range: DashboardRange) => Subject<DashboardSourceResult>) {
    const checks: Subject<HealthResponse>[] = [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        ...(source ? [{ provide: DASHBOARD_DEMO_SOURCE, useValue: source }] : []),
        {
          provide: ApiClientService,
          useValue: {
            getHealth: () => {
              const response = new Subject<HealthResponse>();
              checks.push(response);
              return response;
            },
          },
        },
      ],
    });

    const harness = await RouterTestingHarness.create('/preview/dashboard');
    const page = harness.routeNativeElement!.querySelector('wayhunter-dashboard-page')!;
    return { harness, page, checks };
  }

  async function openControlledDashboard() {
    const loads: { range: DashboardRange; response: Subject<DashboardSourceResult> }[] = [];
    const dashboard = await openDashboard(range => {
      const response = new Subject<DashboardSourceResult>();
      loads.push({ range, response });
      return response;
    });
    const render = (result: DashboardSourceResult) => {
      loads.at(-1)!.response.next(result);
      dashboard.harness.detectChanges();
    };
    const fail = () => {
      loads.at(-1)!.response.error(new Error('Sample source failed'));
      dashboard.harness.detectChanges();
    };
    const chooseRange = (value: DashboardRange) => {
      const select = dashboard.page.querySelector('select')!;
      select.value = value;
      select.dispatchEvent(new Event('change'));
      dashboard.harness.detectChanges();
    };
    const loadedAt = () => dashboard.page.querySelector('.sample-loaded-at')?.getAttribute('datetime');
    return { ...dashboard, loads, render, fail, chooseRange, loadedAt };
  }

  it('announces initial loading, then displays a successful snapshot and client load time', async () => {
    const { page, render, loadedAt } = await openControlledDashboard();
    expect(page.querySelector('wh-loading-state [role="status"]')?.textContent).toContain('Loading Dashboard sample data');
    expect(page.querySelector('.metrics, .charts, .district-table, .sample-loaded-at')).toBeNull();
    expect(page.querySelectorAll('.review-list a')).toHaveLength(3);
    expect(page.querySelector('.dashboard-source')?.textContent).toContain('Live Dashboard data unavailable');
    expect(page.querySelector('.dashboard-source time')?.getAttribute('datetime')).toBe('2026-11-22');
    const clock = vi.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 10, 24, 15));
    try {
      render({ kind: 'ready', view: getDashboardDemo('7') });
      expect(page.querySelectorAll('.metric-value')).toHaveLength(5);
      expect(page.querySelectorAll('wayhunter-dashboard-chart')).toHaveLength(2);
      expect(Date.parse(loadedAt()!)).toBe(Date.UTC(2026, 10, 24, 15));
      expect(page.textContent).toContain('Sample loaded at (local time)');
    } finally {
      clock.mockRestore();
    }
  });

  it.each(['empty', 'unavailable'] as const)('presents %s without rendering numeric metrics', async kind => {
    const { page, render, loadedAt } = await openControlledDashboard();
    render({ kind });
    const message = kind === 'empty' ? 'No Dashboard sample data for this period.' : 'Dashboard sample data is unavailable.';
    expect(page.querySelector('.dashboard-source [role="status"]')?.textContent).toContain(message);
    expect(page.querySelector('.metrics, .charts, .district-table, wh-error-state')).toBeNull();
    expect(Boolean(loadedAt())).toBe(kind === 'empty');
  });

  it('renders zero when a successful source explicitly reports it', async () => {
    const { page, render } = await openControlledDashboard();
    const view = getDashboardDemo('7');
    render({ kind: 'ready', view: {
      ...view,
      metrics: view.metrics.map(metric => ({ ...metric, value: 0, change: 0 })),
      points: view.points.map(point => ({ ...point, trips: 0, newUsers: 0 })),
      districtActivity: view.districtActivity.map(row => ({ ...row, trips: 0 })),
    } });
    expect(Array.from(page.querySelectorAll('.metric-value'), metric => metric.textContent?.trim()))
      .toEqual(['0', '0', '0', '0', '0']);
    expect(Array.from(page.querySelectorAll('.district-table tbody td'), cell => cell.textContent?.trim()))
      .toEqual(['0', '0', '0']);
    expect(page.querySelector('wh-error-state, wh-empty-state')).toBeNull();
  });

  it('shows an initial failure without zero figures and retries the same range', async () => {
    const { page, harness, loads, fail, render, loadedAt } = await openControlledDashboard();
    fail();
    expect(page.querySelector('wh-error-state [role="alert"]')?.textContent).toContain('could not be loaded');
    expect(page.querySelector('.metrics, .charts, .district-table, wh-empty-state')).toBeNull();
    expect(loadedAt()).toBeUndefined();
    page.querySelector<HTMLButtonElement>('wh-error-state button')!.click();
    harness.detectChanges();
    expect(loads.map(load => load.range)).toEqual(['7', '7']);
    expect(page.querySelector('wh-loading-state')).not.toBeNull();
    render({ kind: 'ready', view: getDashboardDemo('7') });
    expect(loadedAt()).toBeTruthy();
    expect(page.querySelector('wh-error-state')).toBeNull();
  });

  it('keeps same-range data and timestamp on failure and advances time only after successful retry', async () => {
    const { page, harness, render, fail, loadedAt, chooseRange } = await openControlledDashboard();
    const clock = vi.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 10, 24, 15));
    try {
      render({ kind: 'ready', view: getDashboardDemo('7') });
      const district = page.querySelector<HTMLSelectElement>('.district-filter select')!;
      district.value = 'Kandy';
      district.dispatchEvent(new Event('change'));
      harness.detectChanges();
      const districtRows = () => Array.from(page.querySelectorAll('.district-table tbody th'),
        cell => cell.textContent?.trim());
      expect(districtRows()).toEqual(['Kandy']);
      const metrics = page.querySelector('.metrics')?.textContent;
      const timestamp = loadedAt();
      clock.mockReturnValue(Date.UTC(2026, 10, 24, 16));
      page.querySelector<HTMLButtonElement>('.reload-sample')!.click();
      fail();
      expect(page.textContent).toContain('Showing previous sample data');
      expect(page.querySelector('.metrics')?.textContent).toBe(metrics);
      expect(districtRows()).toEqual(['Kandy']);
      expect(loadedAt()).toBe(timestamp);
      page.querySelector<HTMLButtonElement>('wh-error-state button')!.click();
      harness.detectChanges();
      render({ kind: 'ready', view: getDashboardDemo('7') });
      expect(Date.parse(loadedAt()!)).toBe(Date.UTC(2026, 10, 24, 16));
      chooseRange('30');
      fail();
      expect(page.querySelector('.metrics, .charts, .district-table, .sample-loaded-at')).toBeNull();
      expect(page.textContent).not.toContain('Showing previous sample data');
      expect(page.querySelectorAll('.review-list a')).toHaveLength(3);
      expect(page.querySelector('.health-status')?.textContent).toBe('Not checked');
      page.querySelector<HTMLButtonElement>('wh-error-state button')!.click();
      render({ kind: 'ready', view: getDashboardDemo('30') });
      expect(districtRows()).toEqual(['Kandy']);
      chooseRange('90');
      const view = getDashboardDemo('90');
      render({ kind: 'ready', view: {
        ...view, districtActivity: view.districtActivity.filter(row => row.district !== 'Kandy'),
      } });
      expect(page.querySelector<HTMLSelectElement>('.district-filter select')?.value).toBe('');
      expect(districtRows()).toEqual(['Galle', 'Matale']);
    } finally {
      clock.mockRestore();
    }
  });

  it('ignores out-of-order responses after the range changes', async () => {
    const { page, harness, loads, render, chooseRange, loadedAt } = await openControlledDashboard();
    chooseRange('30');
    chooseRange('90');
    expect(loads.map(load => load.range)).toEqual(['7', '30', '90']);
    render({ kind: 'ready', view: getDashboardDemo('90') });
    const timestamp = loadedAt();
    loads[1].response.next({ kind: 'ready', view: getDashboardDemo('30') });
    loads[0].response.error(new Error('Obsolete range'));
    harness.detectChanges();
    expect(page.querySelector('.range-panel [role="status"]')?.textContent).toContain(getDashboardDemo('90').period);
    expect(page.querySelector('wh-error-state')).toBeNull();
    expect(loadedAt()).toBe(timestamp);
  });

  it('identifies sample data and lists review modules without pending counts', async () => {
    const { page, checks } = await openDashboard();

    expect(page.querySelector('.intro wh-status-badge')?.textContent).toContain('Demo / Sample Data');
    expect(page.querySelectorAll('.metrics wh-card')).toHaveLength(5);
    expect(page.querySelectorAll('.activity-summary wh-status-badge')).toHaveLength(3);
    expect(page.querySelector('.review-list')?.closest('wh-card')?.textContent).toContain('Review modules');
    expect(Array.from(page.querySelectorAll('.review-list a'), link => link.textContent?.trim())).toEqual([
      'Hunter verification', 'Reported hazards', 'Voucher redemptions',
    ]);
    expect(page.querySelector('.review-list wh-status-badge')).toBeNull();
    expect(Array.from(page.querySelectorAll('.review-list a'), link => link.getAttribute('href'))).toEqual([
      '/preview/hunter-verification',
      '/preview/hazards',
      '/preview/redemptions-settlements',
    ]);
    expect(page.querySelector('.health-status')?.textContent).toBe('Not checked');
    expect(checks).toHaveLength(0);
  });

  it('updates the rendered KPIs, charts and separate event feed to the known totals as the range changes', async () => {
    const { harness, page, checks } = await openDashboard();
    const selector = page.querySelector('select')!;
    const modules = page.querySelector('.review-list')?.textContent;
    expect(selector.value).toBe('7');

    for (const seed of seededRanges) {
      if (selector.value !== seed.range) {
        selector.value = seed.range;
        selector.dispatchEvent(new Event('change'));
        harness.detectChanges();
      }

      expect(page.querySelector('.range-panel [role="status"]')?.textContent).toBe(seed.period);
      expect(Array.from(page.querySelectorAll('.metrics h3'), heading => heading.textContent?.trim())).toEqual(labels);
      expect(Array.from(page.querySelectorAll('.metric-value'), metric => metric.textContent?.trim()))
        .toEqual(expectedKpis(seed).map(value => format.format(value)));
      expect(Array.from(page.querySelectorAll('.charts caption'), caption => caption.textContent))
        .toEqual(['Trips over time · sample data', 'User growth · sample data']);

      const chartTotals = [seed.trips, seed.newAccounts];
      const charts = Array.from(page.querySelectorAll('wayhunter-dashboard-chart'));
      expect(charts).toHaveLength(chartTotals.length);
      charts.forEach((chart, index) => {
        expect(chart.querySelector('.total strong')?.textContent?.trim()).toBe(format.format(chartTotals[index]));
        const counts = Array.from(chart.querySelectorAll('tbody tr td:last-child'),
          cell => Number(cell.textContent?.replaceAll(',', '').trim()));
        expect(counts.reduce((total, count) => total + count, 0)).toBe(chartTotals[index]);
      });

      // The activity feed is a separate fixture, even when its row count coincides with the review KPI.
      expect(page.querySelectorAll('.operations tbody tr')).toHaveLength(seed.events);
      expect(page.querySelector('.review-list')?.textContent).toBe(modules);
      expect(page.querySelector('.intro wh-status-badge')?.textContent?.trim()).toBe('Demo / Sample Data');
    }
    expect(checks).toHaveLength(0);
  });

  it.each([
    ['7', [128, 126, 126]],
    ['30', [511, 510, 510]],
    ['90', [1406, 1405, 1402]],
  ] as const)('reconciles every district to the %s-day sample trip KPI', async (range, expectedCounts) => {
    const { harness, page } = await openDashboard();
    const time = page.querySelector<HTMLSelectElement>('.range-panel select')!;
    time.value = range;
    time.dispatchEvent(new Event('change'));
    harness.detectChanges();

    const card = page.querySelector('[aria-labelledby="district-activity-heading"]')!;
    const rows = Array.from(card.querySelectorAll<HTMLTableRowElement>('tbody tr'));
    const aggregates = getDashboardDemo(range).districtActivity;
    expect(card.querySelector('wh-status-badge')?.textContent?.trim()).toBe('Demo / Sample Data');
    expect(card.querySelector('select')?.value).toBe('');
    expect(card.querySelector('caption')?.textContent).toContain(getDashboardDemo(range).period);
    expect(rows.map(row => row.querySelector('th[scope="row"]')?.textContent?.trim())).toEqual(['Galle', 'Kandy', 'Matale']);
    const counts = rows.map(row => {
      expect(row.cells).toHaveLength(2);
      expect(row.querySelector('.district-track')?.getAttribute('aria-hidden')).toBe('true');
      return Number(row.cells[1].textContent?.replaceAll(',', '').trim());
    });
    expect(counts).toEqual(aggregates.map(row => row.trips));
    expect(counts).toEqual(expectedCounts);
    expect(aggregates.map(Object.keys)).toEqual(rows.map(() => ['district', 'trips']));
    expect(counts.reduce((sum, count) => sum + count, 0))
      .toBe(Number(page.querySelectorAll('.metric-value')[1].textContent?.replaceAll(',', '').trim()));
  });

  it('combines district and time filters and resets district without changing overall analytics', async () => {
    const { harness, page } = await openDashboard();
    const card = page.querySelector('[aria-labelledby="district-activity-heading"]')!;
    const district = card.querySelector('select')!;
    const time = page.querySelector<HTMLSelectElement>('.range-panel select')!;
    const select = (control: HTMLSelectElement, value: string) => {
      control.value = value;
      control.dispatchEvent(new Event('change'));
      harness.detectChanges();
    };
    const overall = () => [page.querySelector('.metrics')?.textContent, page.querySelector('.charts')?.innerHTML];
    const initial = overall();
    select(district, 'Kandy');
    expect(overall()).toEqual(initial);
    expect(card.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(card.querySelector('tbody th')?.textContent?.trim()).toBe('Kandy');
    expect(card.textContent).toContain('subset of the all-district Sample trips total');
    select(time, '30');
    expect(card.querySelector('select')?.value).toBe('Kandy');
    const expected = getDashboardDemo('30').districtActivity.find(row => row.district === 'Kandy')!;
    expect(card.querySelector('tbody td')?.textContent?.trim()).toBe(expected.trips.toLocaleString('en-US'));
    const monthly = overall();
    select(district, '');
    expect(card.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(overall()).toEqual(monthly);
  });

  it('renders all KPI labels, values and descriptions for the default sample range', async () => {
    const { page } = await openDashboard();
    const metrics = Array.from(page.querySelectorAll('.metrics wh-card'), card => ({
      label: card.querySelector('h3')?.textContent?.trim(),
      value: card.querySelector('.metric-value')?.textContent?.trim(),
      detail: card.querySelector('.metric-detail')?.textContent?.trim(),
    }));

    const details = ['Accounts at period end', 'Trips in this period', 'Requests opened in this period',
      'Campaigns started in this period', 'Demo vouchers issued in this period'];
    expect(metrics).toEqual(expectedKpis(seededRanges[0]).map((value, index) => ({
      label: labels[index], value: format.format(value), detail: details[index],
    })));
  });

  it('renders both plots with labelled disclosures for their sample data', async () => {
    const { page } = await openDashboard();
    const charts = page.querySelectorAll('wayhunter-dashboard-chart');
    expect(charts).toHaveLength(2);
    expect(charts[0].querySelectorAll('.bars span')).toHaveLength(7);
    expect(charts[1].querySelector('svg polyline')?.getAttribute('points')?.split(' ')).toHaveLength(7);

    const disclosures = Array.from(page.querySelectorAll<HTMLDetailsElement>('.charts details'));
    expect(disclosures.map(details => details.querySelector('summary')?.textContent?.trim())).toEqual([
      'View trips chart data',
      'View new accounts chart data',
    ]);
    for (const details of disclosures) {
      expect(details.open).toBe(false);
      details.querySelector('summary')!.click();
      expect(details.open).toBe(true);
      expect(details.querySelectorAll('tbody tr')).toHaveLength(7);
      details.querySelector('summary')!.click();
      expect(details.open).toBe(false);
    }
  });

  it.each([
    ['Hunter verification', '/preview/hunter-verification'],
    ['Reported hazards', '/preview/hazards'],
    ['Voucher redemptions', '/preview/redemptions-settlements'],
  ])('opens the %s module when its link is clicked', async (label, url) => {
    const { page } = await openDashboard();
    const router = TestBed.inject(Router);
    const link = Array.from(page.querySelectorAll<HTMLAnchorElement>('.review-list a'))
      .find(anchor => anchor.querySelector('span')?.textContent === label)!;
    const navigated = firstValueFrom(router.events.pipe(filter(event => event instanceof NavigationEnd)));

    link.click();
    expect((await navigated).urlAfterRedirects).toBe(url);
  });

  it('retries a failed health check and keeps production queue access denied after success', async () => {
    const { harness, page, checks } = await openDashboard();
    const button = page.querySelector<HTMLButtonElement>('.diagnostics button')!;
    const status = page.querySelector('.health-status')!;
    const metrics = page.querySelector('.metrics')?.textContent;
    const source = page.querySelector('.dashboard-source')?.textContent;

    button.click();
    harness.detectChanges();
    expect(button.disabled).toBe(true);
    expect(status.textContent).toContain('Checking');
    button.click();
    expect(checks).toHaveLength(1);

    checks[0].error(new Error('Backend offline'));
    harness.detectChanges();
    expect(status.textContent).toContain('Backend not reachable');
    expect(page.querySelector('.dashboard-source')?.textContent).toBe(source);
    expect(button.disabled).toBe(false);
    expect(page.querySelector('.metrics')?.textContent).toBe(metrics);

    button.click();
    checks[1].next({ service: 'WayHunter.Api', status: 'ok', timestampUtc: '2026-11-22T12:00:00Z' });
    checks[1].complete();
    harness.detectChanges();
    expect(status.textContent).toBe('API responded: ok');
    expect(page.querySelector('.dashboard-source')?.textContent).toBe(source);
    expect(button.disabled).toBe(false);
    expect(page.querySelector('.metrics')?.textContent).toBe(metrics);
    expect(page.querySelector('.intro wh-status-badge')?.textContent).toContain('Demo / Sample Data');

    const router = TestBed.inject(Router);
    for (const module of ['hunter-verification', 'hazards', 'redemptions-settlements']) {
      await harness.navigateByUrl('/admin/' + module);
      expect(router.url).toBe('/login');
    }
  });

  it.each(seededRanges)('reconciles the fixed $range-day seed totals and chart buckets', seed => {
    const view = getDashboardDemo(seed.range);
    expect(view.period).toBe(seed.period);
    expect(view.metrics.map(metric => metric.label)).toEqual(labels);
    expect(view.metrics.map(metric => metric.value)).toEqual(expectedKpis(seed));
    expect(view.metrics[0].change).toBe(seed.newAccounts);
    expect(view.metrics[2].change).toBe(seed.reviewChange);
    expect(view.points.reduce((total, point) => total + point.trips, 0)).toBe(seed.trips);
    expect(view.points.reduce((total, point) => total + point.newUsers, 0)).toBe(seed.newAccounts);
    expect(view.activities).toHaveLength(seed.events);
  });
});
