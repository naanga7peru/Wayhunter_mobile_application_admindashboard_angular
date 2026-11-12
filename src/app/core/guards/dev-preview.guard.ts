import { isDevMode, inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

// Preview has *no sensitive data*. Production builds redirect to login.
export const devPreviewGuard: CanMatchFn = () =>
  isDevMode() ? true : inject(Router).parseUrl('/login');

// M1 must replace this with authenticated/authorized server-backed RBAC.
export const authRequiredGuard: CanMatchFn = () =>
  inject(Router).parseUrl('/login');
