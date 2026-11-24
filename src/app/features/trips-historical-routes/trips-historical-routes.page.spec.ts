import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TripsRoutesPage } from './trips-historical-routes.page';

describe('Trips & Historical Routes', () => {
  let page: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(TripsRoutesPage);
    fixture.detectChanges();
    page = fixture.nativeElement;
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('introduces the workspace and announces unavailable access without showing counts', () => {
    expect(page.querySelector('h2')?.textContent).toBe('Trips & Historical Routes');
    expect(page.querySelector('header p')?.textContent).toContain('Review trip activity');
    expect(page.querySelector('header')?.textContent).toContain('Live integration unavailable');
    const notice = page.querySelector('#trips-activity-status[role="status"]')?.textContent;
    expect(notice).toContain('Trip listing unavailable');
    expect(notice).not.toContain('contains no trips');
    expect(Array.from(page.querySelectorAll('li'), (item) => item.textContent?.trim())).toEqual([
      'Active Trips', 'Completed Trips',
    ]);
  });

  it('labels trip filters and prevents search submission', () => {
    const form = page.querySelector('form')!;
    expect(form.getAttribute('aria-describedby')).toBe('trips-activity-status');
    expect(form.querySelector('label[for="trips-reference"]')?.textContent).toBe('Trip reference');
    expect(form.querySelector('label[for="trips-status-filter"]')?.textContent).toBe('Trip status');
    expect(form.querySelector('#trips-reference:disabled')).not.toBeNull();
    expect(form.querySelector('#trips-status-filter:disabled')).not.toBeNull();
    expect(form.querySelector('button[type="submit"]:disabled')).not.toBeNull();
    expect(form.dispatchEvent(new Event('submit', { cancelable: true }))).toBe(false);
  });

  it('renders semantic trip activity headers in a focusable scroll region without records', () => {
    const panels = page.querySelectorAll('.review-grid > section');
    expect(Array.from(panels, (panel) => panel.getAttribute('aria-labelledby'))).toEqual([
      'trips-activity-title', 'trips-details-title',
    ]);
    const table = panels[0].querySelector('[role="region"][aria-label="Trip activity table"][tabindex="0"] table')!;
    expect(table.getAttribute('aria-describedby')).toBe('trips-activity-status');
    expect(Array.from(table.querySelectorAll('th[scope="col"]'), (cell) => cell.textContent)).toEqual([
      'Trip reference', 'Trip status', 'Start date and time', 'End date and time', 'Route information', 'Details',
    ]);
    expect(table.querySelectorAll('tbody tr')).toHaveLength(0);
  });

  it('shows route and safety access requirements without rendering trip data or sending requests', () => {
    const details = page.querySelector('section[aria-labelledby="trips-details-title"]')!;
    expect(Array.from(details.querySelectorAll('h4'), (heading) => heading.textContent)).toEqual([
      'Trip overview', 'Trip timing and status', 'Route information',
      'Historical routes', 'Safety sessions', 'Trip activity history',
    ]);
    expect(details.textContent).toContain('Completed routes and route reuse history are unavailable');
    expect(details.textContent).toContain('scoped Admin grant for a specific trip and session');
    expect(page.querySelector('img, video, canvas, svg, iframe, time')).toBeNull();
    expect(page.querySelectorAll('input:enabled, select:enabled, button:enabled')).toHaveLength(0);
    TestBed.inject(HttpTestingController).expectNone(() => true);
  });
});
