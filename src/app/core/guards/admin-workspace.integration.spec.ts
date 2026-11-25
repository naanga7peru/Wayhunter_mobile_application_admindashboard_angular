import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { filter, firstValueFrom } from 'rxjs';
import { vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { appConfig } from '../../app.config';
import { AdminAccessService } from '../permissions/admin-access.service';

const ownedModules = [
  ['authentication', 'Admin Authentication'],
  ['users', 'User Management'],
  ['hunter-verification', 'Hunter Verification'],
  ['places', 'Places Management'],
  ['trips-historical-routes', 'Trips & Historical Routes'],
  ['hazards', 'Hazard Management'],
  ['group-trips', 'Group Trip Management'],
  ['notifications', 'Notification Management'],
  ['settings-security-audit', 'Settings, Security & Audit'],
] as const;

const m7Modules = [
  { path: 'dashboard', label: 'Dashboard', heading: 'Welcome to WayHunter', content: 'Recent activities' },
  { path: 'advertisements', label: 'Advertisements', heading: 'Advertisements Management', content: 'Advertisement inventory' },
  { path: 'campaigns', label: 'Campaigns', heading: 'Campaigns Management', content: 'Campaign inventory' },
  { path: 'games', label: 'Games', heading: 'Games & Anti-Cheat', content: 'Pending Game Creation Queue' },
  { path: 'reports-analytics', label: 'Reports & Analytics', heading: 'Reports & Analytics', content: 'Reporting overview' },
] as const;

describe('Admin workspace integration', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  describe('M7 module routes', () => {
    it.each(m7Modules)('opens $label from the development preview sidebar', async ({ path, label, heading, content }) => {
      const harness = await RouterTestingHarness.create('/preview/authentication');
      const router = TestBed.inject(Router);
      const previewUrl = `/preview/${path}`;
      const link = harness.routeNativeElement?.querySelector<HTMLAnchorElement>(
        `nav[aria-label="Admin modules"] a[href="${previewUrl}"]`,
      );

      expect(link?.textContent?.trim()).toBe(label);
      expect(link?.hasAttribute('aria-current')).toBe(false);

      const navigated = firstValueFrom(
        router.events.pipe(filter(event => event instanceof NavigationEnd)),
      );
      link!.click();
      await navigated;
      await harness.fixture.whenStable();
      harness.detectChanges();

      expect(router.url).toBe(previewUrl);
      expect(link?.getAttribute('aria-current')).toBe('page');
      expect(harness.routeNativeElement?.textContent).toContain('Development preview');
      expect(harness.routeNativeElement?.querySelector('main h1')?.textContent).toBe(label);
      const page = harness.routeNativeElement?.querySelector(`main wayhunter-${path}-page`);
      expect(page?.querySelector('h2')?.textContent).toBe(heading);
      expect(page?.querySelector(`wh-card[heading="${content}"]`)).toBeTruthy();
      expect(page?.querySelector('wh-error-state')).toBeNull();
    });

    it.each(m7Modules)('denies unauthenticated direct Admin access to $label', async ({ path }) => {
      const harness = await RouterTestingHarness.create(`/admin/${path}`);

      expect(TestBed.inject(AdminAccessService).decide().allowed).toBe(false);
      expect(TestBed.inject(Router).url).toBe('/login');
      expect(harness.routeNativeElement?.textContent).toContain('Sign-in unavailable');
      expect(harness.fixture.nativeElement.querySelector(`wayhunter-${path}-page`)).toBeNull();
      expect(harness.fixture.nativeElement.querySelector('wayhunter-admin-shell')).toBeNull();
      expect(harness.fixture.nativeElement.querySelector('nav[aria-label="Admin modules"]')).toBeNull();
    });

    it.each(m7Modules)('denies a $label preview deep link in production mode', async ({ path }) => {
      const harness = await RouterTestingHarness.create();
      vi.stubGlobal('ngDevMode', false);
      try {
        await harness.navigateByUrl(`/preview/${path}`);

        expect(TestBed.inject(Router).url).toBe('/login');
        expect(harness.routeNativeElement?.textContent).toContain('Sign-in unavailable');
        expect(harness.routeNativeElement?.querySelector('a[href="/preview"]')).toBeNull();
        expect(harness.fixture.nativeElement.querySelector(`wayhunter-${path}-page`)).toBeNull();
        expect(harness.fixture.nativeElement.querySelector('wayhunter-admin-shell')).toBeNull();
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('keeps Games search, details and both decision previews entirely local', async () => {
      const harness = await RouterTestingHarness.create('/preview/games');
      await harness.fixture.whenStable();
      harness.detectChanges();
      const page = harness.routeNativeElement!.querySelector('wayhunter-games-page')!;
      const input = page.querySelector<HTMLInputElement>('input[type="search"]')!;
      input.value = 'demo-creator-102';
      input.dispatchEvent(new Event('input'));
      harness.detectChanges();
      page.querySelector<HTMLButtonElement>('tbody button')!.click();
      harness.detectChanges();

      expect(page.querySelector('#game-creation-details')?.textContent).toContain('Ravi Sample');
      const click = (label: string) => {
        Array.from(page.querySelectorAll('button')).find(button => button.textContent?.trim() === label)!.click();
        harness.detectChanges();
      };
      click('Preview approval');
      expect(page.querySelector('#creation-decision-preview')?.textContent).toContain('Approval confirmation');
      click('Approve creation');
      click('Preview rejection');
      const reason = page.querySelector('textarea')!;
      reason.value = 'Sample reason';
      reason.dispatchEvent(new Event('input'));
      harness.detectChanges();
      click('Check reason');
      expect(page.querySelector('#creation-reason-feedback')?.textContent).toContain('Reason meets the preview requirements.');
      click('Reject creation');
      expect(page.querySelector('tbody tr wh-status-badge')?.textContent).toContain('Pending review');
      TestBed.inject(HttpTestingController).expectNone(() => true);
    });
  });

  it.each(ownedModules)('loads %s in development preview and denies its Admin route', async (path, heading) => {
    const harness = await RouterTestingHarness.create(`/preview/${path}`);
    const router = TestBed.inject(Router);

    expect(router.url).toBe(`/preview/${path}`);
    expect(harness.routeNativeElement?.querySelector('main h2')?.textContent).toBe(heading);
    expect(harness.routeNativeElement?.textContent).toContain('Development preview');
    expect(harness.routeNativeElement?.querySelector('main input:enabled, main select:enabled, main button:enabled')).toBeNull();
    expect(TestBed.inject(AdminAccessService).decide().allowed).toBe(false);

    await harness.navigateByUrl(`/admin/${path}`);

    expect(router.url).toBe('/login');
    expect(harness.routeNativeElement?.textContent).toContain('Sign-in unavailable');
    expect(harness.routeNativeElement?.querySelector('nav[aria-label="Admin modules"]')).toBeNull();
  });

  it('redirects a preview deep link in production mode and keeps the preview link hidden', async () => {
    const harness = await RouterTestingHarness.create();
    const router = TestBed.inject(Router);
    vi.stubGlobal('ngDevMode', false);
    try {
      await harness.navigateByUrl('/preview/notifications');
      expect(router.url).toBe('/login');
      expect(harness.routeNativeElement?.querySelector('a[href="/preview"]')).toBeNull();
      expect(harness.routeNativeElement?.textContent).toContain('Sign-in unavailable');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('only checks Dashboard health on demand and keeps Admin access denied after success and failure', async () => {
    const harness = await RouterTestingHarness.create('/');
    const router = TestBed.inject(Router);
    const http = TestBed.inject(HttpTestingController);
    const healthUrl = `${environment.apiBaseUrl}/health`;

    expect(router.url).toBe('/preview/dashboard');
    http.expectNone(() => true);
    const healthCard = harness.routeNativeElement!.querySelector('wh-card[heading="Platform health"]')!;
    const button = healthCard.querySelector<HTMLButtonElement>('button')!;
    const status = healthCard.querySelector('.health-status[role="status"]')!;

    button.click();
    harness.detectChanges();
    expect(status.textContent).toContain('Checking');
    const request = http.expectOne({ method: 'GET', url: healthUrl });
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ service: 'Wayhunter.Api', status: 'ok', timestampUtc: '2026-11-23T00:00:00Z' });
    harness.detectChanges();
    expect(status.textContent).toBe('API responded: ok');
    expect(TestBed.inject(AdminAccessService).decide().allowed).toBe(false);

    button.click();
    const failedRequest = http.expectOne({ method: 'GET', url: healthUrl });
    expect(failedRequest.request.headers.has('Authorization')).toBe(false);
    failedRequest.flush(
      { message: 'Internal diagnostics' },
      { status: 401, statusText: 'Unauthorized' },
    );
    harness.detectChanges();
    expect(status.textContent).toContain('Backend not reachable');
    expect(status.textContent).not.toContain('Internal diagnostics');

    await harness.navigateByUrl('/admin/dashboard');
    expect(router.url).toBe('/login');
  });

  it('redirects an unknown route to the public login without mounting the Admin shell', async () => {
    const harness = await RouterTestingHarness.create('/unknown-page');
    expect(TestBed.inject(Router).url).toBe('/login');
    expect(harness.routeNativeElement?.querySelector('nav[aria-label="Admin modules"]')).toBeNull();
  });
});
