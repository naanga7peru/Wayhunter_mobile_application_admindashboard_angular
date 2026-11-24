import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UsersPage } from './users.page';

describe('User Management', () => {
  let page: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(UsersPage);
    fixture.detectChanges();
    page = fixture.nativeElement;
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('announces unavailable access without claiming the directory is empty or showing counts', () => {
    expect(page.querySelector('h2')?.textContent).toBe('User Management');
    expect(page.querySelector('header p')?.textContent).toContain('Review user accounts');
    expect(page.querySelector('header')?.textContent).toContain('Live integration unavailable');
    const notice = page.querySelector('#user-search-status[role="status"]')?.textContent;
    expect(notice).toContain('Admin user directory unavailable');
    expect(notice).not.toContain('contains no accounts');
    expect(Array.from(page.querySelectorAll('li'), (item) => item.textContent?.trim())).toEqual([
      'Active', 'Suspended',
    ]);
  });

  it('labels the User ID and status controls and prevents search submission', () => {
    const form = page.querySelector('form')!;
    expect(form.getAttribute('aria-describedby')).toBe('user-search-status');
    expect(form.querySelector('label[for="user-search-id"]')?.textContent).toBe('User ID');
    expect(form.querySelector('label[for="user-search-status-filter"]')?.textContent).toBe('Account status');
    expect(form.querySelector('#user-search-id:required:disabled')).not.toBeNull();
    expect(form.querySelector('#user-search-status-filter:disabled')).not.toBeNull();
    expect(form.querySelector('button[type="submit"]:disabled')).not.toBeNull();
    expect(form.dispatchEvent(new Event('submit', { cancelable: true }))).toBe(false);
  });

  it('renders a keyboard-scrollable directory with semantic headers and no user records', () => {
    const table = page.querySelector('[role="region"][aria-label="User directory table"][tabindex="0"] table')!;
    expect(table.getAttribute('aria-describedby')).toBe('user-search-status');
    expect(Array.from(table.querySelectorAll('th[scope="col"]'), (cell) => cell.textContent)).toEqual([
      'User reference', 'Display name', 'Account status', 'Registration date', 'Details',
    ]);
    expect(table.querySelectorAll('tbody tr')).toHaveLength(0);
  });

  it('shows account details sections without displaying profile or audit records', () => {
    const details = page.querySelector('section[aria-labelledby="user-details-title"]')!;
    expect(Array.from(details.querySelectorAll('h4'), (heading) => heading.textContent)).toEqual([
      'Account overview', 'Basic profile information', 'Account status',
      'Activity overview', 'Moderation history', 'Account actions',
    ]);
    expect(details.textContent).toContain('Profile information is unavailable');
    expect(details.textContent).toContain('requires access to protected audit records');
    expect(details.querySelector('img, table, a')).toBeNull();
  });

  it('keeps all moderation actions disabled and never sends a request', () => {
    const group = page.querySelector('[role="group"][aria-describedby="user-actions-status"]')!;
    const actions = Array.from(group.querySelectorAll('button'));
    expect(actions.map((button) => button.textContent?.trim())).toEqual([
      'Issue warning', 'Suspend account', 'Reactivate account',
    ]);
    for (const action of actions) {
      expect(action.disabled).toBe(true);
      action.click();
    }
    expect(page.querySelectorAll('input:enabled, select:enabled, button:enabled')).toHaveLength(0);
    TestBed.inject(HttpTestingController).expectNone(() => true);
  });
});
