import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, defer, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminAccessService } from '../permissions/admin-access.service';
import { normalizeApiError } from './api-error';

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

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly adminAccess = inject(AdminAccessService);

  getHealth(): Observable<HealthResponse> {
    return this.get<HealthResponse>('/health');
  }

  getAdminRead<T>(path: `/api/admin/${string}`): Observable<T> {
    return defer(() => {
      if (!this.adminAccess.decide().allowed) {
        throw new AdminReadBlockedError();
      }

      return this.get<T>(path);
    });
  }

  private get<T>(path: string): Observable<T> {
    return this.http
      .get<T>(`${environment.apiBaseUrl}${path}`)
      .pipe(catchError((error: unknown) => throwError(() => normalizeApiError(error))));
  }
}
