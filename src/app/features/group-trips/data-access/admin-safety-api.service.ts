import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { ApiClientService } from '../../../core/http/api-client.service';
import { isApiGuid } from '../../../core/http/is-api-guid';
import { AdminSafetySummary, AdminSafetyTarget } from '../models/admin-safety-summary';

@Injectable({ providedIn: 'root' })
export class AdminSafetyApiService {
  private readonly api = inject(ApiClientService);

  getSessionSummary({ tripPlanId, sessionId }: AdminSafetyTarget): Observable<AdminSafetySummary> {
    if (!isApiGuid(tripPlanId) || !isApiGuid(sessionId)) {
      return throwError(() => new TypeError('Trip plan and session IDs must be non-empty GUIDs.'));
    }

    return this.api.getAdminRead<AdminSafetySummary>(
      `/api/admin/safety/trips/${tripPlanId}/sessions/${sessionId}`,
    );
  }
}
