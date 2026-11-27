import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminReadBlockedError } from '../../core/http/api-client.service';
import { AdminAccessService } from '../../core/permissions/admin-access.service';
import { AdminHunterApiService } from './admin-hunter-api.service';

describe('Admin Hunter pending submissions adapter', () => {
  const endpoint = `${environment.apiBaseUrl}/api/admin/hunter/submissions`;
  let allowed: boolean;

  beforeEach(() => {
    allowed = false;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AdminAccessService, useValue: { decide: () => ({ allowed }) } },
      ],
    });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('preserves the shared access gate before making a request', async () => {
    await expect(firstValueFrom(TestBed.inject(AdminHunterApiService).listPending()))
      .rejects.toBeInstanceOf(AdminReadBlockedError);
    TestBed.inject(HttpTestingController).expectNone(endpoint);
  });

  it('reads the pending queue through the documented GET contract', async () => {
    allowed = true;
    const rows = [{
      submissionId: 'test-reference',
      placeName: 'Test place',
      district: 'Test district',
      status: 1,
      createdAtUtc: '2026-11-26T12:00:00Z',
      submittedAtUtc: null,
    }];
    const pending = firstValueFrom(TestBed.inject(AdminHunterApiService).listPending());
    TestBed.inject(HttpTestingController).expectOne({ method: 'GET', url: endpoint }).flush(rows);
    await expect(pending).resolves.toEqual(rows);
  });
});
