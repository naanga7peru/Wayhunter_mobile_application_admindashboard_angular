import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ADMIN_HAZARD_ACTION_ACCESS, AdminActionBlockedError } from '../../../core/http/api-client.service';
import { ApiError } from '../../../core/http/api-error';
import { AdminAccessService } from '../../../core/permissions/admin-access.service';
import { HazardWarningDto } from '../models/hazard-actions';
import { AdminHazardApiService } from './admin-hazard-api.service';

const hazardId = '12d0c123-8e87-4ff1-ba76-51d8bcec33b1';
const hazardUrl = `${environment.apiBaseUrl}/api/admin/hazards/${hazardId}`;
const warning: HazardWarningDto = {
  hazardId,
  status: 2,
  isVerified: true,
  latitude: null,
  longitude: null,
  description: null,
  hasPhotoEvidence: false,
  photoCapturedAtUtc: '2026-11-23T10:00:00Z',
  reportedAtUtc: '2026-11-23T10:01:00Z',
  expiresAtUtc: '2026-11-24T10:01:00Z',
  verifiedAtUtc: '2026-11-23T10:05:00Z',
  resolvedAtUtc: null,
};

describe('AdminHazardApiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  function allowGenericAdminAccess(): void {
    TestBed.overrideProvider(AdminAccessService, {
      useValue: { decide: () => ({ allowed: true }) },
    });
  }

  function serviceWithMockedAccess(): AdminHazardApiService {
    allowGenericAdminAccess();
    TestBed.overrideProvider(ADMIN_HAZARD_ACTION_ACCESS, { useValue: () => true });
    return TestBed.inject(AdminHazardApiService);
  }

  it('blocks both actions with the production access service before issuing HTTP', async () => {
    const service = TestBed.inject(AdminHazardApiService);

    await expect(firstValueFrom(service.verify(hazardId))).rejects.toBeInstanceOf(AdminActionBlockedError);
    await expect(
      firstValueFrom(service.resolve(hazardId, { reason: 'Road cleared' })),
    ).rejects.toBeInstanceOf(AdminActionBlockedError);
  });

  it('blocks both actions even when generic Admin access is allowed', async () => {
    allowGenericAdminAccess();
    const service = TestBed.inject(AdminHazardApiService);

    await expect(firstValueFrom(service.verify(hazardId))).rejects.toBeInstanceOf(AdminActionBlockedError);
    await expect(
      firstValueFrom(service.resolve(hazardId, { reason: 'Road cleared' })),
    ).rejects.toBeInstanceOf(AdminActionBlockedError);
  });

  it('still requires generic Admin access when the action-specific decision allows it', async () => {
    TestBed.overrideProvider(ADMIN_HAZARD_ACTION_ACCESS, { useValue: () => true });
    const service = TestBed.inject(AdminHazardApiService);

    await expect(firstValueFrom(service.verify(hazardId))).rejects.toBeInstanceOf(AdminActionBlockedError);
  });

  it('checks the action and target grant at subscription time', async () => {
    allowGenericAdminAccess();
    let granted = true;
    const checked: string[][] = [];
    TestBed.overrideProvider(ADMIN_HAZARD_ACTION_ACCESS, {
      useValue: (action: string, target: string) => {
        checked.push([action, target]);
        return granted && action === 'verify' && target === hazardId;
      },
    });
    const service = TestBed.inject(AdminHazardApiService);
    const request = service.verify(hazardId);
    expect(checked).toEqual([]);

    await expect(
      firstValueFrom(service.resolve(hazardId, { reason: 'Road cleared' })),
    ).rejects.toBeInstanceOf(AdminActionBlockedError);
    granted = false;
    await expect(firstValueFrom(request)).rejects.toBeInstanceOf(AdminActionBlockedError);
    expect(checked).toEqual([['resolve', hazardId], ['verify', hazardId]]);
  });

  it.each(['../invalid', '00000000-0000-0000-0000-000000000000'])(
    'rejects invalid hazard IDs for both actions',
    async (invalidId) => {
      const service = serviceWithMockedAccess();

      await expect(firstValueFrom(service.verify(invalidId))).rejects.toBeInstanceOf(TypeError);
      await expect(
        firstValueFrom(service.resolve(invalidId, { reason: 'Road cleared' })),
      ).rejects.toBeInstanceOf(TypeError);
    },
  );

  it('rejects a whitespace-only resolution reason before issuing HTTP', async () => {
    const service = serviceWithMockedAccess();

    await expect(
      firstValueFrom(service.resolve(hazardId, { reason: '  \t' })),
    ).rejects.toBeInstanceOf(TypeError);
  });

  it('only sends Verify when subscribed and posts no body', async () => {
    const service = serviceWithMockedAccess();
    const http = TestBed.inject(HttpTestingController);
    const action = service.verify(hazardId);

    http.expectNone(() => true);
    const result = firstValueFrom(action);
    const request = http.expectOne({ method: 'POST', url: `${hazardUrl}/verify` });
    expect(request.request.body).toBeNull();
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush(warning);

    expect(await result).toEqual(warning);
  });

  it('posts only the reason and returns the server-confirmed resolution response', async () => {
    const service = serviceWithMockedAccess();
    const result = firstValueFrom(service.resolve(hazardId, { reason: 'Road cleared' }));
    const request = TestBed.inject(HttpTestingController).expectOne({
      method: 'POST',
      url: `${hazardUrl}/resolve`,
    });
    expect(request.request.body).toEqual({ reason: 'Road cleared' });
    expect(request.request.headers.has('Authorization')).toBe(false);
    const resolved: HazardWarningDto = {
      ...warning,
      status: 3,
      isVerified: false,
      resolvedAtUtc: '2026-11-23T11:00:00Z',
    };
    request.flush(resolved);

    expect(await result).toEqual(resolved);
  });

  it.each([
    [400, 'Bad Request'],
    [401, 'Unauthorized'],
    [403, 'Forbidden'],
    [404, 'Not Found'],
    [409, 'Conflict'],
    [503, 'Service Unavailable'],
  ] as const)('preserves HTTP %i as an error without retrying either action', async (status, statusText) => {
    const service = serviceWithMockedAccess();
    const http = TestBed.inject(HttpTestingController);
    const verify = firstValueFrom(service.verify(hazardId));
    const resolve = firstValueFrom(service.resolve(hazardId, { reason: 'Road cleared' }));

    http.expectOne({ method: 'POST', url: `${hazardUrl}/verify` }).flush(null, { status, statusText });
    http.expectOne({ method: 'POST', url: `${hazardUrl}/resolve` }).flush(null, { status, statusText });

    await expect(verify).rejects.toBeInstanceOf(ApiError);
    await expect(verify).rejects.toMatchObject({ status });
    await expect(resolve).rejects.toBeInstanceOf(ApiError);
    await expect(resolve).rejects.toMatchObject({ status });
  });
});
