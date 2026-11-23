import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Subject } from 'rxjs';
import { routes } from '../../app.routes';
import { ApiClientService, HealthResponse } from '../../core/http/api-client.service';
import { getDashboardDemo } from './data-access/dashboard-demo';

describe('ADM-02 Dashboard', () => {
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

  it('identifies sample data and links to the existing review queues', async () => {
    const { page, checks } = await openDashboard();

    expect(page.querySelector('.intro wh-status-badge')?.textContent).toContain('Demo / Sample Data');
    expect(page.querySelectorAll('.metrics wh-card')).toHaveLength(5);
    expect(page.querySelectorAll('.activity-summary wh-status-badge')).toHaveLength(3);
    expect(Array.from(page.querySelectorAll('.review-list a'), link => link.getAttribute('href'))).toEqual([
      '/preview/hunter-verification',
      '/preview/hazards',
      '/preview/redemptions-settlements',
    ]);
    expect(page.querySelector('.health-status')?.textContent).toBe('Not checked');
    expect(checks).toHaveLength(0);
  });

  it('updates metrics, chart values, activities and pending counts via the range control', async () => {
    const { harness, page, checks } = await openDashboard();
    const selector = page.querySelector('select')!;
    const readView = () => ({
      period: page.querySelector('.range-panel [role="status"]')?.textContent,
      tripTotal: page.querySelectorAll('.metric-value')[1].textContent,
      charts: Array.from(page.querySelectorAll('.charts caption'), caption => caption.textContent),
      chartValues: Array.from(page.querySelectorAll('.charts tbody'), rows => rows.textContent),
      eventCount: page.querySelectorAll('.operations tbody tr').length,
      queues: page.querySelector('.review-list')?.textContent,
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
    expect(monthly.queues).not.toBe(initial.queues);

    selector.value = '90';
    selector.dispatchEvent(new Event('change'));
    harness.detectChanges();
    expect(readView().eventCount).toBe(8);
    expect(checks).toHaveLength(0);
  });

  it('handles a failed health check and retries without altering the sample view', async () => {
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
  });

  it('keeps chart buckets and pending queues consistent with the demo totals', () => {
    for (const range of ['7', '30', '90'] as const) {
      const view = getDashboardDemo(range);
      expect(view.points.reduce((total, point) => total + point.trips, 0))
        .toBe(view.metrics.find(metric => metric.label === 'Total trips')?.value);
      expect(view.points.reduce((total, point) => total + point.newUsers, 0))
        .toBe(view.metrics.find(metric => metric.label === 'Total users')?.change);
      expect(Object.values(view.pending).reduce((total, count) => total + count, 0))
        .toBe(view.metrics.find(metric => metric.label === 'Pending approvals')?.value);
    }
  });
});
