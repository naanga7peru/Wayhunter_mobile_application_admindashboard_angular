import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminReadBlockedError } from '../../../core/http/api-client.service';
import { ApiError } from '../../../core/http/api-error';
import { AdminAccessService } from '../../../core/permissions/admin-access.service';
import { AdminSafetySummary } from '../models/admin-safety-summary';
import { AdminSafetyApiService } from './admin-safety-api.service';

const target = {
  tripPlanId: '12d0c123-8e87-4ff1-ba76-51d8bcec33b1',
  sessionId: '0a38fa7c-de0d-4f8d-82ba-e0c60060dcda',
};
const url = `${environment.apiBaseUrl}/api/admin/safety/trips/${target.tripPlanId}/sessions/${target.sessionId}`;

describe('AdminSafetyApiService', () => {
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
    const service = TestBed.inject(AdminSafetyApiService);

    await expect(firstValueFrom(service.getSessionSummary(target))).rejects.toBeInstanceOf(
      AdminReadBlockedError,
    );
  });

  it.each([
    { ...target, tripPlanId: '../not-a-guid' },
    { ...target, sessionId: '00000000-0000-0000-0000-000000000000' },
    { ...target, sessionId: target.sessionId + '\n' },
  ])('rejects an invalid route identifier before issuing a request', async (badTarget) => {
    allowMockedHttp();
    const service = TestBed.inject(AdminSafetyApiService);

    await expect(firstValueFrom(service.getSessionSummary(badTarget))).rejects.toBeInstanceOf(TypeError);
  });

  it('uses a lazy GET and returns the typed response from the test backend', async () => {
    allowMockedHttp();
    const service = TestBed.inject(AdminSafetyApiService);
    const http = TestBed.inject(HttpTestingController);
    const summary$ = service.getSessionSummary(target);

    http.expectNone(() => true);
    const result = firstValueFrom(summary$);
    const request = http.expectOne({ method: 'GET', url });
    expect(request.request.headers.has('Authorization')).toBe(false);
    const summary: AdminSafetySummary = {
      target,
      tripStatus: 0,
      sessionStatus: 2,
      activeParticipantCount: 0,
      hazards: [{ status: 2, photoCapturedAtUtc: '2026-11-23T00:00:00Z', expiresAtUtc: '2026-11-24T00:00:00Z' }],
      activeSeparationCount: null,
      checkedInParticipantCount: null,
    };
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
    const service = TestBed.inject(AdminSafetyApiService);
    const result = firstValueFrom(service.getSessionSummary(target));
    TestBed.inject(HttpTestingController).expectOne({ method: 'GET', url }).flush(null, {
      status,
      statusText,
    });

    await expect(result).rejects.toBeInstanceOf(ApiError);
    await expect(result).rejects.toMatchObject({ status });
  });
});
