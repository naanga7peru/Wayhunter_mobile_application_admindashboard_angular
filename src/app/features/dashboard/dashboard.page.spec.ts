import { TestBed } from '@angular/core/testing';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { filter, firstValueFrom, Subject } from 'rxjs';
import { routes } from '../../app.routes';
import { ApiClientService, HealthResponse } from '../../core/http/api-client.service';
import { getDashboardDemo } from './data-access/dashboard-demo';

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

  async function openDashboard() {
    const checks: Subject<HealthResponse>[] = [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
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

    button.click();
    harness.detectChanges();
    expect(button.disabled).toBe(true);
    expect(status.textContent).toContain('Checking');
    button.click();
    expect(checks).toHaveLength(1);

    checks[0].error(new Error('Backend offline'));
    harness.detectChanges();
    expect(status.textContent).toContain('Backend not reachable');
    expect(button.disabled).toBe(false);
    expect(page.querySelector('.metrics')?.textContent).toBe(metrics);

    button.click();
    checks[1].next({ service: 'WayHunter.Api', status: 'ok', timestampUtc: '2026-11-22T12:00:00Z' });
    checks[1].complete();
    harness.detectChanges();
    expect(status.textContent).toBe('API responded: ok');
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
