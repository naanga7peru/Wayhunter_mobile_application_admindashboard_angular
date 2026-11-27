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
  { path: 'dashboard', group: 'Workspace', label: 'Dashboard', heading: 'Analytics', content: 'Recent activities' },
  { path: 'advertisements', group: 'Growth & Outreach', label: 'Advertisements', heading: 'Advertisements Management', content: 'Advertisement inventory' },
  { path: 'campaigns', group: 'Growth & Outreach', label: 'Campaigns', heading: 'Campaigns Management', content: 'Campaign inventory' },
  { path: 'games', group: 'Community & Safety', label: 'Games', heading: 'Games & Anti-Cheat', content: 'Pending Game Creation Queue' },
  { path: 'reports-analytics', group: 'Workspace', label: 'Reports & Analytics', heading: 'Reports & Analytics', content: 'Reporting overview' },
] as const;

describe('Admin workspace integration', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  describe('M7 module routes', () => {
    it.each(m7Modules)('opens $label from the development preview sidebar', async ({ path, group, label, heading, content }) => {
      const harness = await RouterTestingHarness.create('/preview/authentication');
      const router = TestBed.inject(Router);
      const previewUrl = `/preview/${path}`;
      const groupButtons = Array.from(harness.routeNativeElement!.querySelectorAll<HTMLButtonElement>('.sidebar .group-button'));
      groupButtons.find(button => button.querySelector('span')?.textContent === group)!.click();
      harness.detectChanges();
      const link = harness.routeNativeElement?.querySelector<HTMLAnchorElement>(
        `.sidebar .module-list:not([hidden]) a[href="${previewUrl}"]`,
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
      expect(Array.from(page?.querySelectorAll('wh-card h2') ?? [], title => title.textContent?.trim()))
        .toContain(content);
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

    it('keeps Games workspace navigation, search, details and both decision previews entirely local', async () => {
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

      const navigation = page.querySelector('nav[aria-label="Games workspace sections"]')!;
      const links = Array.from(navigation.querySelectorAll<HTMLAnchorElement>('a'));
      expect(links.map(link => link.textContent?.trim())).toEqual([
        'Game Creation Review Queue',
        'Game Inventory & Details',
        'Stage Proof Review',
        'Final Completion & Winner Review',
        'Anti-Cheat Review',
        'Leaderboards',
      ]);
      expect(getComputedStyle(navigation.querySelector('ul')!).flexWrap).toBe('wrap');
      for (const link of [...links.slice(1), links[0]]) {
        const heading = page.querySelector<HTMLElement>(link.hash)!;
        expect(heading.closest('section')?.getAttribute('aria-labelledby')).toBe(heading.id);
        expect(link.pathname).toBe(document.location.pathname);
        expect(link.tabIndex).toBe(0);
        heading.scrollIntoView = vi.fn();
        link.click();
        expect(document.activeElement).toBe(heading);
        expect(heading.scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
      }
      expect(page.querySelectorAll('.review-grid wh-empty-state')).toHaveLength(5);
      expect(TestBed.inject(Router).url).toBe('/preview/games');
      expect(input.value).toBe('demo-creator-102');
      expect(page.querySelector('#game-creation-details')?.textContent).toContain('Ravi Sample');
      expect(page.querySelector('textarea')?.value).toBe('Sample reason');
      TestBed.inject(HttpTestingController).expectNone(() => true);
    });
  });

  it('exposes all 17 module routes through mutually exclusive navigation groups', async () => {
    const harness = await RouterTestingHarness.create('/preview/dashboard');
    const router = TestBed.inject(Router);
    const shell = harness.routeNativeElement!;
    const groups = Array.from(shell.querySelectorAll<HTMLButtonElement>('.sidebar .group-button'));
    const registeredPaths = router.config.find(route => route.path === 'admin')!.children!
      .filter(route => route.path)
      .map(route => '/preview/' + route.path);
    const visited: string[] = [];

    expect(groups).toHaveLength(5);
    expect(groups[0].getAttribute('aria-expanded')).toBe('true');
    expect(groups[0].classList.contains('current')).toBe(true);

    for (const group of groups) {
      if (group.getAttribute('aria-expanded') !== 'true') group.click();
      harness.detectChanges();
      expect(groups.filter(button => button.getAttribute('aria-expanded') === 'true')).toEqual([group]);
      const panel = shell.querySelector<HTMLElement>('#' + group.getAttribute('aria-controls'))!;
      expect(panel.hidden).toBe(false);
      const urls = Array.from(panel.querySelectorAll<HTMLAnchorElement>('a'), link => link.pathname);
      expect(urls.length).toBeGreaterThan(0);

      for (const url of urls) {
        const link = panel.querySelector<HTMLAnchorElement>(`a[href="${url}"]`)!;
        const done = router.url === url ? harness.fixture.whenStable() : firstValueFrom(
          router.events.pipe(filter(event => event instanceof NavigationEnd)),
        );
        link.click();
        await done;
        await harness.fixture.whenStable();
        harness.detectChanges();
        expect(router.url).toBe(url);
        expect(link.getAttribute('aria-current')).toBe('page');
        expect(group.classList.contains('current')).toBe(true);
        visited.push(url);
      }
    }
    expect(visited).toHaveLength(17);
    expect(visited.sort()).toEqual(registeredPaths.sort());
  });

  it.each(['', '?from=review', '#analytics', '?from=review#analytics'])(
    'keeps Dashboard current with URL suffix "%s" and clears it on another route',
    async suffix => {
      const harness = await RouterTestingHarness.create('/preview/dashboard' + suffix);
      const sidebar = () => harness.routeNativeElement!.querySelector('.sidebar')!;
      const currentLink = () => sidebar().querySelector('a[aria-current="page"]');
      const expanded = () => Array.from(sidebar().querySelectorAll('button[aria-expanded="true"]'));

      expect(currentLink()?.getAttribute('href')).toBe('/preview/dashboard');
      expect(currentLink()?.classList.contains('active')).toBe(true);
      expect(expanded()).toHaveLength(1);
      expect(expanded()[0].textContent?.trim()).toBe('Workspace');

      await harness.navigateByUrl('/preview/reports-analytics?from=review#analytics');
      expect(currentLink()?.getAttribute('href')).toBe('/preview/reports-analytics');
      expect(sidebar().querySelector('a[href="/preview/dashboard"]')?.classList.contains('active')).toBe(false);

      await harness.navigateByUrl('/preview/users');
      expect(currentLink()?.getAttribute('href')).toBe('/preview/users');
      expect(expanded()).toHaveLength(1);
      expect(expanded()[0].textContent?.trim()).toBe('Community & Safety');
    },
  );

  it('dismisses the expanded group on Escape and restores focus to its trigger', async () => {
    const harness = await RouterTestingHarness.create('/preview/dashboard');
    const shell = harness.routeNativeElement!;
    const trigger = shell.querySelector<HTMLButtonElement>('.sidebar .group-button.current')!;

    const link = shell.querySelector<HTMLAnchorElement>('.nav-link')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    link.focus();
    link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    harness.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(link.closest('ul')?.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
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
