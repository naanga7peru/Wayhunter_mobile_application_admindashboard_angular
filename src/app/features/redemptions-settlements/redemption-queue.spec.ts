import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AdminAccessService } from '../../core/permissions/admin-access.service';
import { RedemptionQueueItem } from './data-access/admin-redemption-api.service';
import { RedemptionQueue } from './redemption-queue';

describe('Admin redemption queue', () => {
  let allowed: boolean;
  let fixture: ComponentFixture<RedemptionQueue>;
  let http: HttpTestingController;
  const item: RedemptionQueueItem = {
    requestId: 'request-reference',
    offerId: 'offer-reference',
    ownerUserId: 'user-reference',
    ownerName: 'Test account',
    costCoins: 10_000,
    requestedAtUtc: '2026-11-26T12:00:00Z',
    availableStock: 3,
  };
  const url = (page: number) =>
    `${environment.apiBaseUrl}/api/admin/coins-wallet/vouchers/requests?page=${page}&pageSize=20`;

  beforeEach(() => {
    allowed = true;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AdminAccessService, useValue: { decide: () => ({ allowed }) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RedemptionQueue);
  });

  afterEach(() => http.verify());

  it('renders returned rows, filters the current page and requests the next server page', () => {
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Loading redemption requests');
    http.expectOne({ method: 'GET', url: url(1) })
      .flush({ page: 1, pageSize: 20, totalCount: 21, items: [item] });
    fixture.detectChanges();
    expect(element.querySelector('tbody')?.textContent).toContain(item.requestId);
    const search = element.querySelector<HTMLInputElement>('input[type="search"]')!;
    search.value = 'missing';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(element.textContent).toContain('No requests on this page match your search.');
    element.querySelector<HTMLButtonElement>('nav button:last-child')!.click();
    http.expectOne({ method: 'GET', url: url(2) })
      .flush({ page: 2, pageSize: 20, totalCount: 21, items: [item] });
    fixture.detectChanges();
    expect(element.textContent).toContain('Page 2');
  });

  it('shows the server-confirmed empty queue', () => {
    fixture.detectChanges();
    http.expectOne(url(1)).flush({ page: 1, pageSize: 20, totalCount: 0, items: [] });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No pending redemption requests.');
  });

  it('blocks the request when the shared gate denies access', () => {
    allowed = false;
    fixture.detectChanges();
    http.expectNone(url(1));
    expect(fixture.nativeElement.textContent).toContain('does not have access');
  });

  it.each([[401, 'does not have access'], [403, 'does not have access'],
    [500, 'could not be loaded'], [503, 'temporarily unavailable']])(
    'handles HTTP %s',
    (status, message) => {
      fixture.detectChanges();
      http.expectOne(url(1)).flush(null, { status, statusText: 'Test error' });
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain(message);
    },
  );
});
