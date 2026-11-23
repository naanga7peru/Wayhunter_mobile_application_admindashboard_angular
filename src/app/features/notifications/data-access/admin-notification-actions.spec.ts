import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiError } from '../../../core/http/api-error';
import { AdminAccessService } from '../../../core/permissions/admin-access.service';
import { NotificationAdminCommand } from '../models/notification-actions';
import {
  ADMIN_NOTIFICATION_ACTION_ACCESS,
  AdminNotificationsApiService,
  NotificationAction,
  NotificationActionBlockedError,
} from './admin-notifications-api.service';

const jobId = '0a38fa7c-de0d-4f8d-82ba-e0c60060dcda';
const operationId = '12d0c123-8e87-4ff1-ba76-51d8bcec33b1';
const receiptId = '668bc792-de19-4fc7-a656-ece774712ebd';
const url = `${environment.apiBaseUrl}/api/admin/notifications`;
const command: NotificationAdminCommand = {
  operationId,
  template: 2,
  target: null,
  audience: { district: 'Colombo' },
  sendAtUtc: '2099-01-01T12:00:00Z',
};
const operation = { operationId, revision: 2 };
const schedule = { command, confirmBulk: true, previewReceiptId: receiptId };
const preview = { receiptId, count: 2, expiresAtUtc: '2099-01-01T11:55:00Z' };

describe('Admin notification actions', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  function allowGenericAccess(): void {
    TestBed.overrideProvider(AdminAccessService, { useValue: { decide: () => ({ allowed: true }) } });
  }

  function allowMockedActions(): void {
    allowGenericAccess();
    TestBed.overrideProvider(ADMIN_NOTIFICATION_ACTION_ACCESS, { useValue: () => true });
  }

  it.each([false, true])('denies all POSTs with only generic Admin access set to %s', async (genericAccess) => {
    if (genericAccess) {
      allowGenericAccess();
    }
    const api = TestBed.inject(AdminNotificationsApiService);

    await expect(firstValueFrom(api.previewAudience(command))).rejects.toBeInstanceOf(NotificationActionBlockedError);
    await expect(firstValueFrom(api.scheduleNotification(schedule))).rejects.toBeInstanceOf(NotificationActionBlockedError);
    await expect(firstValueFrom(api.cancelScheduledNotification(jobId, operation))).rejects.toBeInstanceOf(NotificationActionBlockedError);
  });

  it('requires global Admin access even when the notification decision allows the action', async () => {
    TestBed.overrideProvider(ADMIN_NOTIFICATION_ACTION_ACCESS, { useValue: () => true });
    const api = TestBed.inject(AdminNotificationsApiService);
    await expect(firstValueFrom(api.previewAudience(command))).rejects.toBeInstanceOf(NotificationActionBlockedError);
  });

  it('checks audience, action and job scope on subscription', async () => {
    allowGenericAccess();
    let previewAllowed = true;
    TestBed.overrideProvider(ADMIN_NOTIFICATION_ACTION_ACCESS, {
      useValue: (action: NotificationAction) => action.action === 'cancel'
        ? action.jobId === jobId
        : previewAllowed && action.action === 'preview' && action.command.audience.district === 'Colombo',
    });
    const api = TestBed.inject(AdminNotificationsApiService);
    const pending = api.previewAudience(command);
    previewAllowed = false;
    await expect(firstValueFrom(pending)).rejects.toBeInstanceOf(NotificationActionBlockedError);
    previewAllowed = true;
    await expect(firstValueFrom(api.previewAudience({ ...command, audience: { district: 'Kandy' } })))
      .rejects.toBeInstanceOf(NotificationActionBlockedError);
    await expect(firstValueFrom(api.scheduleNotification(schedule))).rejects.toBeInstanceOf(NotificationActionBlockedError);
    await expect(firstValueFrom(api.cancelScheduledNotification(receiptId, operation)))
      .rejects.toBeInstanceOf(NotificationActionBlockedError);
  });

  it('posts an explicit preview only on subscription and returns the server receipt', async () => {
    allowMockedActions();
    const api = TestBed.inject(AdminNotificationsApiService);
    const http = TestBed.inject(HttpTestingController);
    const pending = api.previewAudience(command);
    http.expectNone(() => true);
    const result = firstValueFrom(pending);
    const request = http.expectOne({ method: 'POST', url: `${url}/preview` });
    expect(request.request.serializeBody()).toBe(JSON.stringify(command));
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush(preview);
    expect(await result).toEqual(preview);
  });

  it('forwards explicit bulk confirmation and receipt and dispatches an invocation only once', async () => {
    allowMockedActions();
    const api = TestBed.inject(AdminNotificationsApiService);
    const http = TestBed.inject(HttpTestingController);
    const pending = api.scheduleNotification(schedule);
    const result = firstValueFrom(pending);
    const request = http.expectOne({ method: 'POST', url: `${url}/schedules` });
    expect(request.request.body).toEqual(schedule);
    const receipt = { jobId, revision: 1, state: 0, dueAtUtc: command.sendAtUtc };
    request.flush(receipt);
    expect(await result).toEqual(receipt);
    await expect(firstValueFrom(pending)).rejects.toThrow('already been dispatched');
  });

  it('preserves an explicit false confirmation and a null receipt', async () => {
    allowMockedActions();
    const api = TestBed.inject(AdminNotificationsApiService);
    const body = { command, confirmBulk: false, previewReceiptId: null };
    const result = firstValueFrom(api.scheduleNotification(body));
    const request = TestBed.inject(HttpTestingController).expectOne({ method: 'POST', url: `${url}/schedules` });
    expect(request.request.body).toEqual(body);
    request.flush({ jobId, revision: 1, state: 0, dueAtUtc: command.sendAtUtc });
    await result;
  });

  it('posts the supplied cancellation revision and operation ID and accepts a 204 response', async () => {
    allowMockedActions();
    const api = TestBed.inject(AdminNotificationsApiService);
    const result = firstValueFrom(api.cancelScheduledNotification(jobId, operation));
    const request = TestBed.inject(HttpTestingController).expectOne({ method: 'POST', url: `${url}/schedules/${jobId}/cancel` });
    expect(request.request.body).toEqual(operation);
    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(await result).toBeUndefined();
  });

  it('rejects invalid identifiers, revision, confirmation receipt, and missing audience without HTTP', async () => {
    allowMockedActions();
    const api = TestBed.inject(AdminNotificationsApiService);
    const invalidRequests = [
      api.previewAudience({ ...command, audience: {} }),
      api.previewAudience({ ...command, operationId: '' }),
      api.previewAudience({ ...command, target: { category: 1, id: jobId } }),
      api.previewAudience({ ...command, sendAtUtc: '2099-01-01T12:00:00+01:00' }),
      api.scheduleNotification({ ...schedule, previewReceiptId: '../bad' }),
      api.cancelScheduledNotification('../bad', operation),
      api.cancelScheduledNotification('00000000-0000-0000-0000-000000000000', operation),
      api.cancelScheduledNotification(jobId, { ...operation, revision: 0 }),
      api.cancelScheduledNotification(jobId, { ...operation, operationId: '' }),
    ];
    for (const request of invalidRequests) {
      await expect(firstValueFrom<unknown>(request)).rejects.toBeInstanceOf(TypeError);
    }
  });

  it.each([
    [400, 'Bad Request'],
    [401, 'Unauthorized'],
    [403, 'Forbidden'],
    [404, 'Not Found'],
    [409, 'Conflict'],
    [503, 'Service Unavailable'],
  ] as const)('propagates HTTP %i without retrying any POST', async (status, statusText) => {
    allowMockedActions();
    const api = TestBed.inject(AdminNotificationsApiService);
    const http = TestBed.inject(HttpTestingController);
    const results = [
      firstValueFrom(api.previewAudience(command)),
      firstValueFrom(api.scheduleNotification(schedule)),
      firstValueFrom(api.cancelScheduledNotification(jobId, operation)),
    ];
    for (const path of ['/preview', '/schedules', `/schedules/${jobId}/cancel`]) {
      http.expectOne({ method: 'POST', url: url + path }).flush(null, { status, statusText });
    }
    await Promise.all(results.map(async (result) => {
      await expect(result).rejects.toBeInstanceOf(ApiError);
      await expect(result).rejects.toMatchObject({ status });
    }));
  });
});
