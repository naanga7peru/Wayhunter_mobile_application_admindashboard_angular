import { isDevMode, inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AdminAccessService } from '../permissions/admin-access.service';

// Preview has *no sensitive data*. Production builds redirect to login.
export const devPreviewGuard: CanMatchFn = () =>
  isDevMode() ? true : inject(Router).parseUrl('/login');

export const authRequiredGuard: CanMatchFn = () =>
  inject(AdminAccessService).decide().allowed || inject(Router).parseUrl('/login');
