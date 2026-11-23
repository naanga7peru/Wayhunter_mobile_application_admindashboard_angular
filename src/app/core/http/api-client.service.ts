import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { catchError, defer, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminAccessService } from '../permissions/admin-access.service';
import { normalizeApiError } from './api-error';
import { isApiGuid } from './is-api-guid';

export interface HealthResponse {
  service: string;
  status: string;
  timestampUtc: string;
}

export class AdminReadBlockedError extends Error {
  constructor() {
    super('Verified Admin access is required for this request.');
    this.name = 'AdminReadBlockedError';
  }
}

export class AdminActionBlockedError extends Error {
  constructor() {
    super('Verified authorization for this Hazard action is required.');
    this.name = 'AdminActionBlockedError';
  }
}

type HazardAction = 'verify' | 'resolve';
type HazardActionAccess = (action: HazardAction, hazardId: string) => boolean;

// No production grant provider exists until the backend Hazard action contract is verified.
export const ADMIN_HAZARD_ACTION_ACCESS = new InjectionToken<HazardActionAccess>(
  'Admin Hazard action access',
  { providedIn: 'root', factory: () => () => false },
);

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly adminAccess = inject(AdminAccessService);
  private readonly hazardActionAccess = inject(ADMIN_HAZARD_ACTION_ACCESS);

  getHealth(): Observable<HealthResponse> {
    return this.request<HealthResponse>('GET', '/health');
  }

  getAdminRead<T>(path: `/api/admin/${string}`): Observable<T> {
    return defer(() => {
      if (!this.adminAccess.decide().allowed) {
        throw new AdminReadBlockedError();
      }

      return this.request<T>('GET', path);
    });
  }

  postAdminHazardAction<T>(
    hazardId: string,
    action: HazardAction,
    body: object | null,
  ): Observable<T> {
    return defer(() => {
      if (!isApiGuid(hazardId)) {
        throw new TypeError('Hazard ID must be a non-empty GUID.');
      }

      if (!this.adminAccess.decide().allowed || this.hazardActionAccess(action, hazardId) !== true) {
        throw new AdminActionBlockedError();
      }

      return this.request<T>('POST', `/api/admin/hazards/${hazardId}/${action}`, body);
    });
  }

  private request<T>(method: 'GET' | 'POST', path: string, body?: object | null): Observable<T> {
    return this.http
      .request<T>(method, `${environment.apiBaseUrl}${path}`, { body })
      .pipe(catchError((error: unknown) => throwError(() => normalizeApiError(error))));
  }
}
