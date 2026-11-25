import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';
import { appConfig } from './app.config';
import { routes } from './app.routes';

const modulePages = [
  ['authentication', 'Admin Authentication', 'Admin Authentication'],
  ['dashboard', 'Dashboard', 'Dashboard'],
  ['users', 'User Management', 'Users'],
  ['hunter-verification', 'Hunter Verification', 'Hunter Verification'],
  ['advertisements', 'Advertisements', 'Advertisements'],
  ['places', 'Places Management', 'Places'],
  ['trips-historical-routes', 'Trips & Historical Routes', 'Trips & Routes'],
  ['hazards', 'Hazard Management', 'Hazards'],
  ['group-trips', 'Group Trip Management', 'Group Trips'],
  ['games', 'Games & Anti-Cheat', 'Games'],
  ['coins-rewards', 'Coins & Rewards', 'Coins & Rewards'],
  ['merchants-voucher-inventory', 'Merchants & Voucher Inventory', 'Merchants & Inventory'],
  ['redemptions-settlements', 'Redemptions & Settlements', 'Redemptions'],
  ['campaigns', 'Campaign Management', 'Campaigns'],
  ['reports-analytics', 'Reports & Analytics', 'Reports & Analytics'],
  ['notifications', 'Notification Management', 'Notifications'],
  ['settings-security-audit', 'Settings, Security & Audit', 'Settings & Audit'],
] as const;

describe('Browser route titles', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('sets the Login title and retains the sign-in heading', async () => {
    const harness = await RouterTestingHarness.create('/login');

    expect(TestBed.inject(Title).getTitle()).toBe('Login - Wayhunter Admin');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Wayhunter Admin sign-in');
  });

  it.each(modulePages)('sets the title and retains the shell heading for %s', async (path, title, heading) => {
    const url = `/preview/${path}`;
    const harness = await RouterTestingHarness.create(url);

    expect(TestBed.inject(Router).url).toBe(url);
    expect(TestBed.inject(Title).getTitle()).toBe(`${title} - Wayhunter Admin`);
    expect(harness.routeNativeElement?.querySelector('main h1')?.textContent).toBe(heading);
  });

  it('retains the same module paths and route definitions under Admin and preview', () => {
    const preview = routes.find(route => route.path === 'preview')!;
    const admin = routes.find(route => route.path === 'admin')!;

    expect(admin.children?.map(route => route.path)).toEqual(['', ...modulePages.map(([path]) => path)]);
    expect(preview.children?.map(route => route.path)).toEqual([
      '', ...modulePages.map(([path]) => path), 'shared-ui',
    ]);
    admin.children?.forEach((route, index) => expect(preview.children?.[index]).toBe(route));
  });

  it('updates the title on successive preview navigations and replaces it after a denied Admin navigation', async () => {
    const harness = await RouterTestingHarness.create('/preview/dashboard');
    const title = TestBed.inject(Title);
    expect(title.getTitle()).toBe('Dashboard - Wayhunter Admin');

    await harness.navigateByUrl('/preview/users');
    expect(title.getTitle()).toBe('User Management - Wayhunter Admin');

    await harness.navigateByUrl('/preview/shared-ui');
    expect(title.getTitle()).toBe('Shared UI');
    expect(harness.routeNativeElement?.querySelector('main h1')?.textContent).toBe('Shared UI');

    await harness.navigateByUrl('/admin/users');
    expect(TestBed.inject(Router).url).toBe('/login');
    expect(title.getTitle()).toBe('Login - Wayhunter Admin');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Wayhunter Admin sign-in');
  });

  it('sets the Login title when production blocks a preview deep link', async () => {
    const harness = await RouterTestingHarness.create();
    vi.stubGlobal('ngDevMode', false);
    try {
      await harness.navigateByUrl('/preview/dashboard');

      expect(TestBed.inject(Router).url).toBe('/login');
      expect(TestBed.inject(Title).getTitle()).toBe('Login - Wayhunter Admin');
      expect(harness.routeNativeElement?.querySelector('a[href="/preview"]')).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
