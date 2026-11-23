import { inject, Injectable } from '@angular/core';
import { ADMIN_SESSION_STATE, AdminSessionState } from '../auth/admin-session';

export interface AdminAccessDecision {
  readonly allowed: false;
  readonly reason: AdminSessionState;
}

@Injectable({ providedIn: 'root' })
export class AdminAccessService {
  private readonly sessionState = inject(ADMIN_SESSION_STATE);

  decide(): AdminAccessDecision {
    return { allowed: false, reason: this.sessionState };
  }
}
