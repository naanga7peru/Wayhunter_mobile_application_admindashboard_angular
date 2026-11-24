import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GroupTripsPage } from './group-trips.page';

describe('Group Trip Management', () => {
  let page: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(GroupTripsPage);
    fixture.detectChanges();
    page = fixture.nativeElement;
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('announces unavailable access and shows overview labels without counts', () => {
    expect(page.querySelector('h2')?.textContent).toBe('Group Trip Management');
    expect(page.querySelector('header p')?.textContent).toContain('Monitor group trips');
    expect(page.querySelector('header')?.textContent).toContain('Live integration unavailable');
    const notice = page.querySelector('#group-trips-availability[role="status"]')?.textContent;
    expect(notice).toContain('Group trip listing unavailable');
    expect(notice).not.toContain('contains no trips');
    expect(Array.from(page.querySelectorAll('.stages li'), (item) => item.textContent?.trim())).toEqual([
      'Group Trips', 'Membership', 'Safety Sessions',
    ]);
  });

  it('labels disabled filters and prevents submission', () => {
    const form = page.querySelector('form')!;
    expect(form.getAttribute('aria-describedby')).toBe('group-trips-availability');
    expect(form.querySelector('label[for="group-trips-query"]')?.textContent).toBe('Group trip reference');
    expect(form.querySelector('label[for="group-trips-status"]')?.textContent).toBe('Group trip status');
    expect(form.querySelector('#group-trips-query:disabled')).not.toBeNull();
    expect(form.querySelector('#group-trips-status:disabled')).not.toBeNull();
    expect(form.querySelector('button[type="submit"]:disabled')).not.toBeNull();
    expect(form.dispatchEvent(new Event('submit', { cancelable: true }))).toBe(false);
  });

  it('provides semantic directory headers in a focusable scroll region without group records', () => {
    const panels = page.querySelectorAll('.review-grid > section');
    expect(Array.from(panels, (panel) => panel.getAttribute('aria-labelledby'))).toEqual([
      'group-trips-list', 'group-trip-details',
    ]);
    const table = panels[0].querySelector('[role="region"][aria-label="Group trips table"][tabindex="0"] table')!;
    expect(table.getAttribute('aria-describedby')).toBe('group-trips-availability');
    expect(Array.from(table.querySelectorAll('th[scope="col"]'), (cell) => cell.textContent)).toEqual([
      'Group trip reference', 'Trip status', 'Organizer', 'Membership', 'Safety session availability', 'Details',
    ]);
    expect(table.querySelectorAll('tbody tr')).toHaveLength(0);
  });

  it('shows group details and explains consent without rendering personal or trip data', () => {
    expect(page.querySelector('#group-trip-details')?.textContent).toBe('Group trip details');
    const details = page.querySelector('section[aria-labelledby="group-trip-details"]')!;
    expect(Array.from(details.querySelectorAll('h4'), (heading) => heading.textContent)).toEqual([
      'Group trip overview', 'Organizer information', 'Membership overview', 'Member participation details',
      'Invitation history', 'Trip status and timing', 'Group activity history', 'Safety session information',
    ]);
    expect(details.textContent).toContain('Organizer information is unavailable');
    expect(details.textContent).toContain('GPS sharing requires separate member consent');
    expect(details.querySelector('img, video, canvas, iframe, time, table')).toBeNull();
  });

  it('lists unavailable safety summary fields and keeps the action disabled without requests', () => {
    const summary = page.querySelector('section[aria-labelledby="group-safety-title"]')!;
    expect(summary.querySelector('#group-safety-status')?.textContent).toContain(
      'scoped Admin grant for the specific trip and session',
    );
    expect(Array.from(summary.querySelectorAll('li'), (item) => item.textContent)).toEqual([
      'Trip status', 'Safety session status', 'Aggregate participant information',
      'Hazard summary', 'Separation summary', 'Check-in summary',
    ]);
    const button = summary.querySelector<HTMLButtonElement>('button[aria-describedby="group-safety-status"]')!;
    expect(button.textContent).toBe('View safety summary');
    expect(button.disabled).toBe(true);
    button.click();
    expect(page.querySelectorAll('input:enabled, select:enabled, button:enabled')).toHaveLength(0);
    TestBed.inject(HttpTestingController).expectNone(() => true);
  });
});
