import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminReadBlockedError } from '../../../core/http/api-client.service';
import { ApiError } from '../../../core/http/api-error';
import { AdminAccessService } from '../../../core/permissions/admin-access.service';
import {
  AdminAdvertisementsApiService,
  AdvertisementDto,
} from './admin-advertisements-api.service';

const id = 'A38FA7CD-DE0D-4F8D-82BA-E0C60060DCDA';
const listUrl = `${environment.apiBaseUrl}/api/admin/advertisements`;
const detailUrl = `${listUrl}/${id}`;
const advertisement: AdvertisementDto = {
  id: id.toLowerCase(),
  title: 'Mock API advertisement',
  imageUrl: 'https://example.test/banner.png',
  destinationUrl: null,
  startAtUtc: '2026-11-25T08:00:00+00:00',
  endAtUtc: '2026-12-01T08:00:00+00:00',
  isEnabled: false,
  placement: 1,
  status: 2,
};

describe('AdminAdvertisementsApiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  function allowMockedHttp() {
    TestBed.overrideProvider(AdminAccessService, {
      useValue: { decide: () => ({ allowed: true }) },
    });
    return TestBed.inject(AdminAdvertisementsApiService);
  }

  it('blocks both reads with the real Admin access gate and sends zero HTTP requests', async () => {
    const service = TestBed.inject(AdminAdvertisementsApiService);

    await expect(firstValueFrom(service.list())).rejects.toBeInstanceOf(AdminReadBlockedError);
    await expect(firstValueFrom(service.getById(id))).rejects.toBeInstanceOf(AdminReadBlockedError);
    TestBed.inject(HttpTestingController).expectNone(() => true);
  });

  it('lazily reads and maps the bare list using only DTO fields', async () => {
    const service = allowMockedHttp();
    const http = TestBed.inject(HttpTestingController);
    const list$ = service.list();
    http.expectNone(() => true);

    const result = firstValueFrom(list$);
    const request = http.expectOne({ method: 'GET', url: listUrl });
    expect(request.request.headers.has('Authorization')).toBe(false);
    expect(request.request.body).toBeNull();
    request.flush([{ ...advertisement, unexpectedField: 'ignored' }]);

    expect(await result).toEqual([advertisement]);
  });

  it('preserves an empty list', async () => {
    const result = firstValueFrom(allowMockedHttp().list());
    TestBed.inject(HttpTestingController).expectOne({ method: 'GET', url: listUrl }).flush([]);

    expect(await result).toEqual([]);
  });

  it('accepts a non-empty GUID and maps the detail response', async () => {
    const result = firstValueFrom(allowMockedHttp().getById(id));
    const detail: AdvertisementDto = {
      ...advertisement,
      destinationUrl: 'https://example.test/sponsor',
      isEnabled: true,
      placement: 2,
      status: 1,
    };
    TestBed.inject(HttpTestingController)
      .expectOne({ method: 'GET', url: detailUrl })
      .flush({ ...detail, unexpectedField: 'ignored' });

    expect(await result).toEqual(detail);
  });

  it.each([
    '',
    'not-a-guid',
    '../list',
    `${id}?x=1`,
    `${id}\n`,
    '00000000-0000-0000-0000-000000000000',
  ])('rejects invalid ID %j before issuing HTTP', async (invalidId) => {
    const service = allowMockedHttp();

    await expect(firstValueFrom(service.getById(invalidId))).rejects.toBeInstanceOf(TypeError);
    TestBed.inject(HttpTestingController).expectNone(() => true);
  });

  it('preserves a missing detail as a 404 error', async () => {
    const result = firstValueFrom(allowMockedHttp().getById(id));
    TestBed.inject(HttpTestingController)
      .expectOne({ method: 'GET', url: detailUrl })
      .flush(null, { status: 404, statusText: 'Not Found' });

    await expect(result).rejects.toBeInstanceOf(ApiError);
    await expect(result).rejects.toMatchObject({ status: 404 });
  });

  it.each([
    [401, 'Unauthorized'],
    [403, 'Forbidden'],
    [500, 'Internal Server Error'],
  ] as const)('preserves HTTP %i without a fallback list or retry', async (status, statusText) => {
    const result = firstValueFrom(allowMockedHttp().list());
    TestBed.inject(HttpTestingController)
      .expectOne({ method: 'GET', url: listUrl })
      .flush(null, { status, statusText });

    await expect(result).rejects.toBeInstanceOf(ApiError);
    await expect(result).rejects.toMatchObject({ status });
  });

  it('preserves a network failure without a fallback list or retry', async () => {
    const result = firstValueFrom(allowMockedHttp().list());
    TestBed.inject(HttpTestingController)
      .expectOne({ method: 'GET', url: listUrl })
      .error(new ProgressEvent('error'));

    await expect(result).rejects.toBeInstanceOf(ApiError);
    await expect(result).rejects.toMatchObject({ status: 0 });
  });
});
