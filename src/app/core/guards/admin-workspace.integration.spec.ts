import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
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

describe('Admin workspace integration', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

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
    const dashboard = harness.routeNativeElement!;
    const button = dashboard.querySelector<HTMLButtonElement>('main button')!;
    const status = dashboard.querySelector('main [role="status"]')!;

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
    http.expectOne({ method: 'GET', url: healthUrl }).flush(
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
