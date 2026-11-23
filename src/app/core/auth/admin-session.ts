import { InjectionToken } from '@angular/core';

export type AdminSessionState = 'blocked' | 'unknown' | 'signed-out';

// BLOCKED until M1 supplies a verified Admin browser session contract.
export const ADMIN_SESSION_STATE = new InjectionToken<AdminSessionState>('Admin session state', {
  providedIn: 'root',
  factory: () => 'blocked',
});
