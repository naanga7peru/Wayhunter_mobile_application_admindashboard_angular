import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiClientService } from './api-client.service';
import { ApiError } from './api-error';

describe('ApiClientService', () => {
  let client: ApiClientService;
  let http: HttpTestingController;
  const healthUrl = `${environment.apiBaseUrl}/health`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    client = TestBed.inject(ApiClientService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('preserves the public health request and response', async () => {
    const result = firstValueFrom(client.getHealth());
    const request = http.expectOne({ method: 'GET', url: healthUrl });
    const health = { service: 'Wayhunter.Api', status: 'ok', timestampUtc: '2026-11-23T00:00:00Z' };
    expect(request.request.headers.has('Authorization')).toBe(false);
    expect(request.request.withCredentials).toBe(false);
    request.flush(health);
    expect(await result).toEqual(health);
  });

  it('preserves HTTP status and API diagnostics without exposing the response body', async () => {
    const result = firstValueFrom(client.getHealth());
    http.expectOne(healthUrl).flush(
      { code: 'example_error', message: 'Internal details', correlationId: 'request-123' },
      { status: 403, statusText: 'Forbidden' },
    );
    await expect(result).rejects.toBeInstanceOf(ApiError);
    await expect(result).rejects.toMatchObject({
      status: 403,
      code: 'example_error',
      correlationId: 'request-123',
      message: 'The API request failed.',
    });
  });

  it('retains the status for failures without an API error envelope', async () => {
    const result = firstValueFrom(client.getHealth());
    http.expectOne(healthUrl).flush('Unexpected gateway response', {
      status: 502,
      statusText: 'Bad Gateway',
    });
    await expect(result).rejects.toMatchObject({ status: 502, code: undefined });
  });

  it('normalizes network failures', async () => {
    const result = firstValueFrom(client.getHealth());
    http.expectOne(healthUrl).error(new ProgressEvent('error'));
    await expect(result).rejects.toMatchObject({
      status: 0,
      message: 'The API could not be reached.',
    });
  });
});
