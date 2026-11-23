import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';
import { routes } from '../../app.routes';
import { ADMIN_SESSION_STATE, AdminSessionState } from '../auth/admin-session';
import { AdminAccessService } from '../permissions/admin-access.service';
import { devPreviewGuard } from './dev-preview.guard';

describe('Admin and preview route boundaries', () => {
  it('redirects Admin root and child navigation with the default blocked session', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const harness = await RouterTestingHarness.create('/admin');
    const router = TestBed.inject(Router);
    expect(router.url).toBe('/login');

    await harness.navigateByUrl('/admin/users');
    expect(router.url).toBe('/login');
    expect(TestBed.inject(AdminAccessService).decide()).toEqual({
      allowed: false,
      reason: 'blocked',
    });
  });

  it.each<AdminSessionState>(['unknown', 'signed-out'])(
    'denies direct Admin navigation when session state is %s',
    async (state) => {
      TestBed.configureTestingModule({
        providers: [provideRouter(routes), { provide: ADMIN_SESSION_STATE, useValue: state }],
      });

      await RouterTestingHarness.create('/admin/dashboard');

      expect(TestBed.inject(Router).url).toBe('/login');
      expect(TestBed.inject(AdminAccessService).decide()).toEqual({
        allowed: false,
        reason: state,
      });
    },
  );

  it('allows preview in development mode and redirects it in production mode', () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const router = TestBed.inject(Router);
    const preview = routes.find((route) => route.path === 'preview')!;
    const checkPreview = () =>
      TestBed.runInInjectionContext(() =>
        devPreviewGuard(preview, [], router.routerState.snapshot.root),
      );

    expect(checkPreview()).toBe(true);
    vi.stubGlobal('ngDevMode', false);
    try {
      const result = checkPreview();
      expect(result).toBeInstanceOf(UrlTree);
      expect(router.serializeUrl(result as UrlTree)).toBe('/login');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
