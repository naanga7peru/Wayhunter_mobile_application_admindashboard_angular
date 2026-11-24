import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationsPage } from './notifications.page';

describe('Notifications Management page', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  function render(): { fixture: ComponentFixture<NotificationsPage>; page: HTMLElement } {
    const fixture = TestBed.createComponent(NotificationsPage);
    fixture.detectChanges();
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  it('renders the established page heading, description, and announced unavailable status', () => {
    const { page } = render();

    expect(page.querySelector('h2')?.textContent?.trim()).toBe('Notification Management');
    expect(page.textContent).toContain('Preview authorized audiences, schedule notifications in UTC, and monitor delivery status.');
    expect(page.querySelector('#notifications-availability')?.textContent).toContain(
      'Trusted Admin authorization and operational notification services are required.',
    );
    expect(page.querySelector('[role="status"]')?.textContent).toContain('Backend integration unavailable');
  });

  it('shows overview cards without recipient, schedule, or delivery counts', () => {
    const { page } = render();

    expect(Array.from(page.querySelectorAll('.overview-card h4')).map((heading) => heading.textContent?.trim())).toEqual([
      'Audience Preview',
      'Scheduled Notifications',
      'Delivery Monitoring',
    ]);
    expect(page.querySelector('.overview')?.textContent).toContain('Unavailable');
    expect(page.querySelector('.overview')?.textContent).not.toMatch(/\b\d+\s*(recipients?|notifications?|jobs?)\b/i);
  });

  it('provides accessible audience preview controls and keeps them disabled', () => {
    const { page } = render();

    expect(page.querySelector('label[for="notification-template"]')?.textContent).toContain('Notification template');
    expect(page.querySelector('label[for="notification-audience-role"]')?.textContent).toContain('Audience role');
    expect(page.querySelector('label[for="notification-audience-district"]')?.textContent).toContain('District targeting');
    expect(page.querySelector('#preview-result-status')?.textContent).toContain('receipt ID');
    expect(page.querySelector('#preview-result-status')?.textContent).toContain('recipient count');
    expect(page.querySelector('#content-preview-title')?.textContent).toContain('Notification content preview');
    expect(page.querySelector('button')?.textContent?.trim()).toBe('Preview Audience');
    expect(page.querySelector('button')?.disabled).toBe(true);
  });

  it('presents UTC scheduling, receipt and explicit confirmation requirements with disabled inputs', () => {
    const { page } = render();

    expect(page.querySelector('#notification-scheduling-title')?.textContent).toContain('UTC Scheduling');
    expect(page.querySelector('label[for="schedule-at-utc"]')?.textContent).toContain('(UTC)');
    expect(page.querySelector('label[for="schedule-audience"]')?.textContent).toContain('Audience targeting');
    expect(page.querySelector('label[for="schedule-preview-receipt"]')?.textContent).toContain('Preview receipt');
    expect(page.querySelector('label[for="schedule-confirm-bulk"]')?.textContent).toContain('Explicitly confirm bulk scheduling');
    expect(page.querySelector('#scheduling-explanation')?.textContent).toContain('unexpired preview receipt');
    expect(page.querySelector('#scheduling-explanation')?.textContent).toContain('explicit confirmation');
    expect(page.querySelector('#schedule-confirm-bulk')).toBeTruthy();
    expect((page.querySelector('#schedule-confirm-bulk') as HTMLInputElement).checked).toBe(false);
    expect(page.querySelector('button[aria-describedby="scheduling-explanation"]')?.textContent?.trim()).toBe('Schedule Notification');
    expect((page.querySelector('button[aria-describedby="scheduling-explanation"]') as HTMLButtonElement).disabled).toBe(true);
  });

  it('renders schedule details and explains that general schedule history is unavailable', () => {
    const { page } = render();

    const details = page.querySelector('#schedule-details-title')?.closest('section');
    for (const label of ['Job ID', 'Revision', 'Scheduled time (UTC)', 'Job state']) {
      expect(details?.textContent).toContain(label);
    }
    expect(page.querySelector('#schedule-history-title')?.textContent).toContain('Schedule History');
    expect(page.querySelector('#schedule-history-status')?.textContent).toContain('general protected Admin schedule-history listing is not available');
    expect(page.querySelector('#schedule-history-status')?.textContent).toContain('does not indicate that no schedules exist');
  });

  it('keeps cancellation inputs and action disabled, with job scope and caller identifiers explained', () => {
    const { page } = render();
    const cancellation = page.querySelector('#schedule-cancellation-title')?.closest('section');

    expect(cancellation?.querySelector('label[for="cancel-job-id"]')?.textContent).toContain('Target Job ID');
    expect(cancellation?.querySelector('label[for="cancel-revision"]')?.textContent).toContain('Revision');
    expect(cancellation?.querySelector('label[for="cancel-operation-id"]')?.textContent).toContain('Operation ID');
    expect(cancellation?.textContent).toContain('specific job');
    const button = cancellation?.querySelector('button');
    expect(button?.textContent?.trim()).toBe('Cancel Scheduled Notification');
    expect(button?.disabled).toBe(true);
  });

  it('shows only supported delivery categories as unavailable and keeps summary action disabled', () => {
    const { page } = render();
    const delivery = page.querySelector('#delivery-summary-title')?.closest('section');

    expect(Array.from(delivery?.querySelectorAll('dt') ?? []).map((term) => term.textContent?.trim())).toEqual([
      'Queued', 'Delivered', 'Suppressed', 'Failed', 'Read',
    ]);
    expect(Array.from(delivery?.querySelectorAll('dd') ?? []).every((value) => value.textContent?.trim() === 'Unavailable')).toBe(true);
    expect(delivery?.querySelector('button')?.textContent?.trim()).toBe('View Delivery Summary');
    expect((delivery?.querySelector('button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('represents unavailable, loading, empty, error and no-results states without claiming the database is empty', () => {
    const { page } = render();
    const component = TestBed.createComponent(NotificationsPage).componentInstance as unknown as {
      viewState: string;
      stateMessages: Record<string, string>;
      scheduleHistoryState: string;
    };

    expect(component.viewState).toBe('unavailable');
    expect(component.scheduleHistoryState).toBe('unavailable');
    expect(Object.keys(component.stateMessages).sort()).toEqual(['empty', 'error', 'loading', 'no-results', 'unavailable']);
    expect(component.stateMessages['empty']).toContain('authorized schedule listing returned no records');
    expect(page.querySelector('table, [role="row"]')).toBeNull();
  });

  it('contains no fabricated job, recipient, receipt, timestamp, or delivery data', () => {
    const { page } = render();
    const unavailableValues = Array.from(page.querySelectorAll('dd'));

    expect(unavailableValues.length).toBeGreaterThan(0);
    expect(unavailableValues.every((value) => value.textContent?.trim() === 'Unavailable')).toBe(true);
    expect(page.querySelectorAll('tbody tr')).toHaveLength(0);
    expect(page.textContent).not.toMatch(/\b\d+\s*(recipients?|delivered|queued|failed|notifications?|jobs?)\b/i);
    expect(page.textContent).not.toMatch(/\b(?:19|20)\d{2}-\d{2}-\d{2}\b/);
  });

  it('keeps every operational input and button disabled and makes no HTTP request on initial render', () => {
    const { page } = render();
    const controls = Array.from(page.querySelectorAll('input, select, button'));

    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expect(control.matches(':disabled')).toBe(true);
    }
    const http = TestBed.inject(HttpTestingController);
    http.expectNone(() => true);
  });

  it('uses a responsive section layout and semantic headings, descriptions, and status announcements', () => {
    const { page } = render();

    expect(page.querySelectorAll('main')).toHaveLength(0);
    expect(page.querySelectorAll('section[aria-labelledby]').length).toBeGreaterThanOrEqual(6);
    expect(page.querySelectorAll('h2')).toHaveLength(1);
    expect(page.querySelectorAll('h3').length).toBeGreaterThanOrEqual(5);
    expect(page.querySelectorAll('[role="status"]').length).toBeGreaterThanOrEqual(4);
  });
});
