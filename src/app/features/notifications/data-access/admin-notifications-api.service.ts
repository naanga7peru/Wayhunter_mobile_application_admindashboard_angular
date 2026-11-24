import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { catchError, defer, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiClientService } from '../../../core/http/api-client.service';
import { normalizeApiError } from '../../../core/http/api-error';
import { isApiGuid } from '../../../core/http/is-api-guid';
import { AdminAccessService } from '../../../core/permissions/admin-access.service';
import {
  NotificationAdminCommand,
  NotificationAdminSendRequest,
  NotificationAudiencePreview,
  NotificationJobReceipt,
  NotificationOperationRequest,
} from '../models/notification-actions';
import { NotificationDeliverySummary } from '../models/notification-delivery-summary';

export type NotificationAction =
  | { readonly action: 'preview' | 'schedule'; readonly command: NotificationAdminCommand }
  | { readonly action: 'cancel'; readonly jobId: string };

// A trusted notification grant provider is still required for live operations.
export const ADMIN_NOTIFICATION_ACTION_ACCESS = new InjectionToken<
  (action: NotificationAction) => boolean
>('Admin notification action access', { providedIn: 'root', factory: () => () => false });

export class NotificationActionBlockedError extends Error {
  constructor() {
    super('Verified authorization for this notification action is required.');
    this.name = 'NotificationActionBlockedError';
  }
}

@Injectable({ providedIn: 'root' })
export class AdminNotificationsApiService {
  private readonly api = inject(ApiClientService);
  private readonly http = inject(HttpClient);
  private readonly adminAccess = inject(AdminAccessService);
  private readonly notificationAccess = inject(ADMIN_NOTIFICATION_ACTION_ACCESS);

  previewAudience(command: NotificationAdminCommand): Observable<NotificationAudiencePreview> {
    if (!isValidCommand(command)) {
      return throwError(() => new TypeError('A valid notification command and bounded audience are required.'));
    }

    const body = snapshotCommand(command);
    return this.post('/preview', body, { action: 'preview', command: body });
  }

  scheduleNotification(request: NotificationAdminSendRequest): Observable<NotificationJobReceipt> {
    if (!isValidCommand(request?.command) || typeof request.confirmBulk !== 'boolean' ||
        (request.previewReceiptId != null && !isApiGuid(request.previewReceiptId))) {
      return throwError(() => new TypeError('A valid command, confirmation decision and any preview receipt ID are required.'));
    }

    const command = snapshotCommand(request.command);
    const body: NotificationAdminSendRequest = {
      command,
      confirmBulk: request.confirmBulk,
      previewReceiptId: request.previewReceiptId,
    };
    return this.post('/schedules', body, { action: 'schedule', command });
  }

  cancelScheduledNotification(jobId: string, request: NotificationOperationRequest): Observable<void> {
    if (!isApiGuid(jobId) || !isApiGuid(request?.operationId) ||
        !Number.isInteger(request.revision) || request.revision < 1 || request.revision > 2_147_483_647) {
      return throwError(() => new TypeError('A valid job ID, operation ID and positive revision are required.'));
    }

    const body: NotificationOperationRequest = {
      operationId: request.operationId,
      revision: request.revision,
    };
    return this.post<null>(`/schedules/${jobId}/cancel`, body, { action: 'cancel', jobId })
      .pipe(map(() => undefined));
  }

  getDeliverySummary(jobId: string): Observable<NotificationDeliverySummary> {
    if (!isApiGuid(jobId)) {
      return throwError(() => new TypeError('Notification job ID must be a non-empty GUID.'));
    }

    return this.api.getAdminRead<NotificationDeliverySummary>(
      `/api/admin/notifications/schedules/${jobId}/summary`,
    );
  }

  private post<T>(
    path: '/preview' | '/schedules' | `/schedules/${string}/cancel`,
    body: object,
    action: NotificationAction,
  ): Observable<T> {
    let dispatched = false;
    return defer(() => {
      if (!this.adminAccess.decide().allowed || this.notificationAccess(action) !== true) {
        throw new NotificationActionBlockedError();
      }
      if (dispatched) {
        throw new Error('This notification request has already been dispatched.');
      }
      dispatched = true;

      return this.http.post<T>(`${environment.apiBaseUrl}/api/admin/notifications${path}`, body);
    }).pipe(catchError((error: unknown) => throwError(() => normalizeApiError(error))));
  }
}

function isValidCommand(command: NotificationAdminCommand | null | undefined): command is NotificationAdminCommand {
  if (!command || !isApiGuid(command.operationId) || !Number.isInteger(command.template) ||
      command.template < 1 || command.template > 7 || !command.audience ||
      command.text != null || command.deepLink != null) {
    return false;
  }

  const { target, sendAtUtc, template, audience: { role, district, userIds } } = command;
  // The backend maps templates 1–7 to categories 1–7 in the same order.
  return (target == null || (target.category === template && isApiGuid(target.id))) &&
    (sendAtUtc == null || (typeof sendAtUtc === 'string' &&
      /T.*(?:Z|\+00:00)$/i.test(sendAtUtc) && Number.isFinite(Date.parse(sendAtUtc)))) &&
    (role == null || role === 1 || role === 2) &&
    (district == null || (typeof district === 'string' && district.length >= 1 &&
      district.length <= 40 && !/[^a-zA-Z -]/.test(district))) &&
    (userIds == null || (Array.isArray(userIds) && userIds.length >= 1 && userIds.length <= 100 &&
      Array.from(userIds).every((id) => isApiGuid(id) && id === id.toLowerCase()))) &&
    (role != null || district != null || userIds != null);
}

function snapshotCommand(command: NotificationAdminCommand): NotificationAdminCommand {
  const { operationId, template, target, audience, sendAtUtc, text, deepLink } = command;
  return {
    operationId,
    template,
    target: target == null ? target : { category: target.category, id: target.id },
    audience: {
      role: audience.role,
      district: audience.district,
      userIds: audience.userIds == null ? audience.userIds : [...audience.userIds],
    },
    sendAtUtc,
    text,
    deepLink,
  };
}
