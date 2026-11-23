import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { ApiClientService } from '../../../core/http/api-client.service';
import { isApiGuid } from '../../../core/http/is-api-guid';
import { NotificationDeliverySummary } from '../models/notification-delivery-summary';

@Injectable({ providedIn: 'root' })
export class AdminNotificationsApiService {
  private readonly api = inject(ApiClientService);

  getDeliverySummary(jobId: string): Observable<NotificationDeliverySummary> {
    if (!isApiGuid(jobId)) {
      return throwError(() => new TypeError('Notification job ID must be a non-empty GUID.'));
    }

    return this.api.getAdminRead<NotificationDeliverySummary>(
      `/api/admin/notifications/schedules/${jobId}/summary`,
    );
  }
}
