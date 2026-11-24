import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HazardsPage } from './hazards.page';

describe('Hazard Management', () => {
  let page: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(HazardsPage);
    fixture.detectChanges();
    page = fixture.nativeElement;
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('announces unavailable reports and presents review stages without counts', () => {
    expect(page.querySelector('h2')?.textContent).toBe('Hazard Management');
    expect(page.querySelector('header p')?.textContent).toContain('Review hazard reports');
    expect(page.querySelector('header')?.textContent).toContain('Live integration unavailable');
    const status = page.querySelector('#hazards-availability[role="status"]')?.textContent;
    expect(status).toContain('Hazard reports unavailable');
    expect(status).not.toContain('contains no reports');
    expect(Array.from(page.querySelectorAll('li'), (item) => item.textContent?.trim())).toEqual([
      'Pending Verification', 'Verified', 'Resolved',
    ]);
  });

  it('labels and disables search and status controls and prevents submission', () => {
    const form = page.querySelector('form')!;
    expect(form.getAttribute('aria-describedby')).toBe('hazards-availability');
    expect(form.querySelector('label[for="hazards-query"]')?.textContent).toBe('Hazard reference');
    expect(form.querySelector('label[for="hazards-status"]')?.textContent).toBe('Verification status');
    expect(form.querySelector('#hazards-query:disabled')).not.toBeNull();
    expect(form.querySelector('#hazards-status:disabled')).not.toBeNull();
    expect(form.querySelector('button[type="submit"]:disabled')).not.toBeNull();
    expect(form.dispatchEvent(new Event('submit', { cancelable: true }))).toBe(false);
  });

  it('provides semantic report headers in a focusable scroll region without records', () => {
    const table = page.querySelector('[role="region"][aria-label="Hazard reports table"][tabindex="0"] table')!;
    expect(table.getAttribute('aria-describedby')).toBe('hazards-availability');
    expect(Array.from(table.querySelectorAll('th[scope="col"]'), (header) => header.textContent)).toEqual([
      'Hazard reference', 'Report status', 'Location', 'Reported at', 'Details',
    ]);
    expect(table.querySelectorAll('tbody tr')).toHaveLength(0);
  });

  it('shows evidence and location access requirements and explains the documented warning rules', () => {
    const details = page.querySelector('section[aria-labelledby="hazards-details-title"]')!;
    expect(Array.from(details.querySelectorAll('h4'), (heading) => heading.textContent)).toEqual([
      'Hazard overview', 'Report status and verification', 'Location details', 'Photo and evidence',
      'Report and capture times', 'Traveler warnings', 'Verification and resolution history',
      'Moderation decisions',
    ]);
    expect(details.textContent).toContain('authorized access to hazard details');
    expect(details.textContent).toContain('authorized evidence access');
    expect(details.textContent).toContain('within 1 km');
    expect(details.textContent).toContain('photo capture time');
    expect(details.textContent).toContain('24 hours after the stored report time');
    expect(page.querySelector('img, video, canvas, iframe, time')).toBeNull();
  });

  it('keeps Verify and Resolve disabled without requests on render or interaction', () => {
    const group = page.querySelector('[role="group"][aria-describedby="hazard-review-status"]')!;
    const actions = Array.from(group.querySelectorAll('button'));
    expect(actions.map((button) => button.textContent?.trim())).toEqual(['Verify Hazard', 'Resolve Hazard']);
    for (const action of actions) {
      expect(action.disabled).toBe(true);
      action.click();
    }
    expect(page.querySelectorAll('input:enabled, select:enabled, button:enabled')).toHaveLength(0);
    TestBed.inject(HttpTestingController).expectNone(() => true);
  });
});
