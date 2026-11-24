import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsAuditPage } from './settings-security-audit.page';

describe('Settings, Security & Audit page', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  function render(): { fixture: ComponentFixture<SettingsAuditPage>; page: HTMLElement } {
    const fixture = TestBed.createComponent(SettingsAuditPage);
    fixture.detectChanges();
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  it('renders the established page heading, description and backend-unavailable announcement', () => {
    const { page } = render();

    expect(page.querySelector('h2')?.textContent?.trim()).toBe('Settings, Security & Audit');
    expect(page.textContent).toContain('Review administrative configuration, access security and accountable activity');
    expect(page.querySelector('#settings-availability')?.textContent).toContain('No protected Admin contracts are currently available');
    expect(page.querySelector('[role="status"]')?.textContent).toContain('Backend integration unavailable');
  });

  it('shows System Settings, Access & Security, and Audit History overview without metrics', () => {
    const { page } = render();

    expect(Array.from(page.querySelectorAll('.overview-card h4')).map((heading) => heading.textContent?.trim())).toEqual([
      'System Settings', 'Access & Security', 'Audit History',
    ]);
    expect(page.querySelector('.overview')?.textContent).toContain('Unavailable');
    expect(page.querySelector('.overview')?.textContent).not.toMatch(/\b\d+\s*(events?|sessions?|users?|settings?)\b/i);
  });

  it('shows Versioned Rules, Restricted Zones and Integration Status as unavailable', () => {
    const { page } = render();
    const settings = page.querySelector('#system-settings-title')?.closest('section');

    for (const label of ['Versioned Rules', 'Restricted Zones', 'Integration Status']) {
      expect(settings?.textContent).toContain(label);
    }
    expect(settings?.querySelector('#system-settings-status')?.textContent).toContain('protected Admin contract');
    expect(Array.from(settings?.querySelectorAll('dd') ?? []).map((item) => item.textContent?.trim())).toEqual([
      'Unavailable', 'Unavailable', 'Unavailable',
    ]);
  });

  it('presents non-sensitive administrator account security information without an identity', () => {
    const { page } = render();
    const account = page.querySelector('#account-security-title')?.closest('section');

    for (const label of ['Administrator account', 'Account security status', 'Authentication availability', 'Session security']) {
      expect(account?.textContent).toContain(label);
    }
    expect(account?.textContent).toContain('No account identity or credential is shown');
    expect(Array.from(account?.querySelectorAll('dd') ?? []).every((value) => value.textContent?.trim() === 'Unavailable')).toBe(true);
  });

  it('shows the Admin Sessions semantic table and unavailable state without session rows', () => {
    const { page } = render();
    const sessions = page.querySelector('#sessions-title')?.closest('section');
    const table = sessions?.querySelector('table');

    expect(sessions?.querySelector('#sessions-status')?.textContent).toContain('protected Admin session listing is not available');
    expect(Array.from(table?.querySelectorAll('th') ?? []).map((cell) => cell.textContent?.trim())).toEqual([
      'Session reference', 'Session state', 'Last activity', 'Session details',
    ]);
    expect(table?.querySelectorAll('tbody tr')).toHaveLength(0);
  });

  it('makes the Admin Sessions table scroll region keyboard-focusable', () => {
    const { page } = render();
    const region = page.querySelector('[aria-label="Admin sessions table"]');

    expect(region?.getAttribute('role')).toBe('region');
    expect(region?.getAttribute('tabindex')).toBe('0');
  });

  it('presents Roles & Permissions as unavailable without assigning roles or grants', () => {
    const { page } = render();
    const access = page.querySelector('#roles-permissions-title')?.closest('section');

    for (const label of ['Role information', 'Permission overview', 'Access-control availability', 'Authorization requirements']) {
      expect(access?.textContent).toContain(label);
    }
    expect(access?.querySelector('#roles-permissions-status')?.textContent).toContain('trusted server-side authorization');
    expect(access?.querySelectorAll('button')).toHaveLength(0);
  });

  it('announces Audit History as unavailable without implying that the audit store is empty', () => {
    const { page } = render();
    const audit = page.querySelector('#audit-title')?.closest('section');

    expect(audit?.querySelector('#audit-status')?.textContent).toContain('The actual audit record count is unknown');
    expect(audit?.querySelector('#audit-status')?.textContent).toContain('no events are shown');
  });

  it('labels audit search and event-type filters and keeps the entire search group disabled', () => {
    const { page } = render();
    const audit = page.querySelector('#audit-title')?.closest('section');

    expect(audit?.querySelector('label[for="audit-query"]')?.textContent).toContain('Search audit history');
    expect(audit?.querySelector('label[for="audit-event-type"]')?.textContent).toContain('Event type');
    expect(audit?.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Search audit history');
    expect(Array.from(audit?.querySelectorAll('input, select, button') ?? []).every((control) => control.matches(':disabled'))).toBe(true);
  });

  it('provides a semantic audit table and a keyboard-focusable horizontal-scroll region', () => {
    const { page } = render();
    const region = page.querySelector('[aria-label="Audit log table"]');
    const table = region?.querySelector('table');

    expect(region?.getAttribute('role')).toBe('region');
    expect(region?.getAttribute('tabindex')).toBe('0');
    expect(Array.from(table?.querySelectorAll('th') ?? []).map((cell) => cell.textContent?.trim())).toEqual([
      'Event reference', 'Event type', 'Timestamp', 'Actor', 'Outcome', 'Details',
    ]);
    expect(table?.querySelectorAll('tbody tr')).toHaveLength(0);
  });

  it('shows unavailable Audit Event Details without an event reference or fabricated fields', () => {
    const { page } = render();
    const details = page.querySelector('#audit-event-details-title')?.closest('section');

    expect(details?.querySelector('#audit-event-details-status')?.textContent).toContain('authorized audit reference');
    expect(Array.from(details?.querySelectorAll('dd') ?? []).map((value) => value.textContent?.trim())).toEqual([
      'Unavailable', 'Unavailable', 'Unavailable', 'Unavailable', 'Unavailable',
    ]);
  });

  it('shows Security Activity History unavailable without events or actors', () => {
    const { page } = render();
    const activity = page.querySelector('#security-activity-title')?.closest('section');

    expect(activity?.querySelector('#security-activity-status')?.textContent).toContain('protected Admin audit service');
    expect(activity?.querySelector('#security-activity-status')?.textContent).toContain('No security events or actors are displayed');
  });

  it('defines distinct unavailable, loading, empty, error and no-results presentation states', () => {
    render();
    const component = TestBed.createComponent(SettingsAuditPage).componentInstance as unknown as {
      settingsState: string;
      sessionsState: string;
      auditState: string;
      resourceMessages: Record<string, string>;
    };

    expect(component.settingsState).toBe('unavailable');
    expect(component.sessionsState).toBe('unavailable');
    expect(component.auditState).toBe('unavailable');
    expect(Object.keys(component.resourceMessages).sort()).toEqual(['empty', 'error', 'loading', 'no-results', 'unavailable']);
    expect(component.resourceMessages['empty']).toContain('authorized request returned no records');
    expect(component.resourceMessages['error']).toContain('No settings or security operation was completed');
    expect(component.resourceMessages['no-results']).toContain('No records match');
  });

  it('contains no fabricated account, session, audit, timestamp, actor, IP or outcome data', () => {
    const { page } = render();

    expect(page.querySelectorAll('tbody tr')).toHaveLength(0);
    expect(page.textContent).not.toMatch(/\b\d+\s*(events?|sessions?|admins?|records?)\b/i);
    expect(page.textContent).not.toMatch(/\b(?:19|20)\d{2}-\d{2}-\d{2}\b/);
    expect(page.textContent).not.toMatch(/\b\d{1,3}(?:\.\d{1,3}){3}\b/);
    expect(page.textContent).not.toMatch(/\b(?:admin@example|test@example)\b/i);
  });

  it('offers no active security mutations or account-management controls', () => {
    const { page } = render();

    expect(page.querySelectorAll('button:not(:disabled)')).toHaveLength(0);
    expect(page.querySelector('input[type="password"], input[type="checkbox"]')).toBeNull();
    expect(page.textContent).not.toMatch(/\b(?:reset password|enable MFA|revoke session|change role|grant permission)\b/i);
  });

  it('makes no protected HTTP requests when the page initializes', () => {
    render();
    TestBed.inject(HttpTestingController).expectNone(() => true);
  });

  it('uses labeled semantic sections and keeps unavailable statuses announced', () => {
    const { page } = render();

    expect(page.querySelectorAll('h2')).toHaveLength(1);
    expect(page.querySelectorAll('section[aria-labelledby]').length).toBeGreaterThanOrEqual(8);
    expect(page.querySelectorAll('[role="status"]').length).toBeGreaterThanOrEqual(8);
    expect(page.querySelector('table[aria-describedby="audit-status"]')).toBeTruthy();
  });
});
