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

  it('updates sample metrics, chart values and activities while keeping module links stable', async () => {
    const { harness, page, checks } = await openDashboard();
    const selector = page.querySelector('select')!;
    const readView = () => ({
      period: page.querySelector('.range-panel [role="status"]')?.textContent,
      tripTotal: page.querySelectorAll('.metric-value')[1].textContent,
      charts: Array.from(page.querySelectorAll('.charts caption'), caption => caption.textContent),
      chartValues: Array.from(page.querySelectorAll('.charts tbody'), rows => rows.textContent),
      eventCount: page.querySelectorAll('.operations tbody tr').length,
      modules: page.querySelector('.review-list')?.textContent,
      labels: Array.from(page.querySelectorAll('.metrics h3'), heading => heading.textContent?.trim()),
      disclosure: page.querySelector('.intro wh-status-badge')?.textContent?.trim(),
    });
    const initial = readView();
    expect(selector.value).toBe('7');
    expect(initial.eventCount).toBe(4);
    expect(initial.charts).toEqual(['Trips over time · sample data', 'User growth · sample data']);

    selector.value = '30';
    selector.dispatchEvent(new Event('change'));
    harness.detectChanges();
    const monthly = readView();
    expect(monthly.eventCount).toBe(6);
    expect(monthly.period).not.toBe(initial.period);
    expect(monthly.tripTotal).not.toBe(initial.tripTotal);
    expect(monthly.chartValues[0]).not.toBe(initial.chartValues[0]);
    expect(monthly.chartValues[1]).not.toBe(initial.chartValues[1]);
    expect(monthly.modules).toBe(initial.modules);
    expect(monthly.labels).toEqual(labels);
    expect(monthly.disclosure).toBe('Demo / Sample Data');

    selector.value = '90';
    selector.dispatchEvent(new Event('change'));
    harness.detectChanges();
    const quarterly = readView();
    expect(quarterly.eventCount).toBe(8);
    expect(quarterly.modules).toBe(initial.modules);
    expect(quarterly.labels).toEqual(labels);
    expect(quarterly.disclosure).toBe('Demo / Sample Data');
    expect(checks).toHaveLength(0);
  });

  it('renders all KPI labels, values and descriptions for the default sample range', async () => {
    const { page } = await openDashboard();
    const metrics = Array.from(page.querySelectorAll('.metrics wh-card'), card => ({
      label: card.querySelector('h3')?.textContent?.trim(),
      value: card.querySelector('.metric-value')?.textContent?.trim(),
      detail: card.querySelector('.metric-detail')?.textContent?.trim(),
    }));

    expect(metrics).toEqual(getDashboardDemo('7').metrics.map(({ value, detail }, index) => ({
      label: labels[index], value: new Intl.NumberFormat('en-US').format(value), detail,
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

  it('keeps chart totals and preserves the sample review request calculations', () => {
    for (const [range, value, change] of [['7', 4, 0], ['30', 18, 2], ['90', 51, 1]] as const) {
      const view = getDashboardDemo(range);
      expect(view.points.reduce((total, point) => total + point.trips, 0))
        .toBe(view.metrics.find(metric => metric.label === 'Sample trips')?.value);
      expect(view.points.reduce((total, point) => total + point.newUsers, 0))
        .toBe(view.metrics.find(metric => metric.label === 'Sample total users')?.change);
      expect(view.metrics.find(metric => metric.label === 'Sample review requests opened'))
        .toMatchObject({ value, change });
    }
  });
});
