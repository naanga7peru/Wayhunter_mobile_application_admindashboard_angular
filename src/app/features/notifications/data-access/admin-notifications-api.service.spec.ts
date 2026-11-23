import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminReadBlockedError } from '../../../core/http/api-client.service';
import { ApiError } from '../../../core/http/api-error';
import { AdminAccessService } from '../../../core/permissions/admin-access.service';
import { NotificationDeliverySummary } from '../models/notification-delivery-summary';
import { AdminNotificationsApiService } from './admin-notifications-api.service';

const jobId = '0a38fa7c-de0d-4f8d-82ba-e0c60060dcda';
const url = `${environment.apiBaseUrl}/api/admin/notifications/schedules/${jobId}/summary`;

describe('AdminNotificationsApiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  function allowMockedHttp() {
    TestBed.overrideProvider(AdminAccessService, {
      useValue: { decide: () => ({ allowed: true }) },
    });
  }

  it('fails closed with the actual Admin access service and sends no request', async () => {
    const service = TestBed.inject(AdminNotificationsApiService);

    await expect(firstValueFrom(service.getDeliverySummary(jobId))).rejects.toBeInstanceOf(
      AdminReadBlockedError,
    );
  });

  it.each(['../not-a-guid', '00000000-0000-0000-0000-000000000000', jobId + '\n'])('rejects an invalid route identifier before issuing a request', async (badJobId) => {
    allowMockedHttp();
    const service = TestBed.inject(AdminNotificationsApiService);

    await expect(firstValueFrom(service.getDeliverySummary(badJobId))).rejects.toBeInstanceOf(TypeError);
  });

  it('uses a lazy GET and returns the typed response from the test backend', async () => {
    allowMockedHttp();
    const service = TestBed.inject(AdminNotificationsApiService);
    const http = TestBed.inject(HttpTestingController);
    const summary$ = service.getDeliverySummary(jobId);

    http.expectNone(() => true);
    const result = firstValueFrom(summary$);
    const request = http.expectOne({ method: 'GET', url });
    expect(request.request.headers.has('Authorization')).toBe(false);
    const summary: NotificationDeliverySummary = { jobId, queued: 3, delivered: 7, suppressed: 1, failed: 0, read: 4 };
    request.flush(summary);

    expect(await result).toEqual(summary);
  });

  it.each([
    [401, 'Unauthorized'],
    [403, 'Forbidden'],
    [404, 'Not Found'],
    [503, 'Service Unavailable'],
  ] as const)('preserves HTTP %i as an error without retrying or reporting success', async (status, statusText) => {
    allowMockedHttp();
    const service = TestBed.inject(AdminNotificationsApiService);
    const result = firstValueFrom(service.getDeliverySummary(jobId));
    TestBed.inject(HttpTestingController).expectOne({ method: 'GET', url }).flush(null, {
      status,
      statusText,
    });

    await expect(result).rejects.toBeInstanceOf(ApiError);
    await expect(result).rejects.toMatchObject({ status });
  });
});
