import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { AdminReadBlockedError } from '../../../core/http/api-client.service';
import { ApiError } from '../../../core/http/api-error';
import { AdminAccessService } from '../../../core/permissions/admin-access.service';
import type { GameAdminQueueItemDto } from '../game-creation-queue';
import { GamesPage } from '../games.page';
import { AdminGamesQueueApiService } from './admin-games-queue-api.service';
import { DEMO_GAME_CREATION_QUEUE } from './game-creation-queue-demo';

const queueUrl = `${environment.apiBaseUrl}/api/admin/games/reviews/pending`;
const submission: GameAdminQueueItemDto = {
  gameId: 'a38fa7cd-de0d-4f8d-82ba-e0c60060dcda',
  creatorUserId: 'sample-creator',
  creatorNameSnapshot: 'Sample Creator',
  gameTitle: 'Mock API game',
  submittedAtUtc: '2026-11-25T08:00:00.1234567+00:00',
};

describe('AdminGamesQueueApiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { parent: { routeConfig: { path: 'preview' } } } },
      ],
    });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  function allowMockedHttp() {
    const decide = vi.fn(() => ({ allowed: true }));
    TestBed.overrideProvider(AdminAccessService, { useValue: { decide } });
    return decide;
  }

  function readQueue() {
    return firstValueFrom(TestBed.inject(AdminGamesQueueApiService).list());
  }

  it('gets the pending queue and maps only the five DTO fields in response order', async () => {
    allowMockedHttp();
    const result = readQueue();
    const request = TestBed.inject(HttpTestingController).expectOne({ method: 'GET', url: queueUrl });
    const laterSubmission = {
      ...submission,
      gameId: '61f9fa53-9e05-4b1e-8c79-bf626f271ec4',
      submittedAtUtc: '2026-11-25T08:05:00Z',
    };
    expect(request.request.body).toBeNull();
    request.flush([{ ...submission, unexpectedField: 'ignored' }, laterSubmission]);

    expect(await result).toEqual([submission, laterSubmission]);
  });

  it('preserves an empty queue', async () => {
    allowMockedHttp();
    const result = readQueue();
    TestBed.inject(HttpTestingController).expectOne({ method: 'GET', url: queueUrl }).flush([]);

    expect(await result).toEqual([]);
  });

  it.each([
    [401, 'Unauthorized'],
    [403, 'Forbidden'],
    [500, 'Internal Server Error'],
  ] as const)('propagates HTTP %i as an API error', async (status, statusText) => {
    allowMockedHttp();
    const result = readQueue();
    TestBed.inject(HttpTestingController)
      .expectOne({ method: 'GET', url: queueUrl })
      .flush(null, { status, statusText });

    await expect(result).rejects.toBeInstanceOf(ApiError);
    await expect(result).rejects.toMatchObject({ status });
  });

  it('propagates a network failure as an API error with status zero', async () => {
    allowMockedHttp();
    const result = readQueue();
    TestBed.inject(HttpTestingController)
      .expectOne({ method: 'GET', url: queueUrl })
      .error(new ProgressEvent('error'));

    await expect(result).rejects.toBeInstanceOf(ApiError);
    await expect(result).rejects.toMatchObject({ status: 0 });
  });

  it('sends no HTTP request when the real Admin gate denies access', async () => {
    await expect(readQueue()).rejects.toBeInstanceOf(AdminReadBlockedError);
    TestBed.inject(HttpTestingController).expectNone(() => true);
  });

  it('rechecks access on each subscription before dispatch', async () => {
    const decide = allowMockedHttp();
    const queue$ = TestBed.inject(AdminGamesQueueApiService).list();
    const http = TestBed.inject(HttpTestingController);
    expect(decide).not.toHaveBeenCalled();
    http.expectNone(() => true);

    const firstRead = firstValueFrom(queue$);
    http.expectOne({ method: 'GET', url: queueUrl }).flush([]);
    expect(await firstRead).toEqual([]);

    decide.mockReturnValue({ allowed: false });
    await expect(firstValueFrom(queue$)).rejects.toBeInstanceOf(AdminReadBlockedError);
    expect(decide).toHaveBeenCalledTimes(2);
    http.expectNone(() => true);
  });

  it('renders the default synthetic preview without making an HTTP request', async () => {
    const decide = allowMockedHttp();
    const fixture = TestBed.createComponent(GamesPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    const titles = Array.from(page.querySelectorAll('tbody th'), (cell) => cell.textContent?.trim());
    expect(titles).toEqual(DEMO_GAME_CREATION_QUEUE.map((item) => item.gameTitle));
    expect(decide).not.toHaveBeenCalled();
    TestBed.inject(HttpTestingController).expectNone(() => true);
  });

  it('renders a protected response through the existing page without decision previews', async () => {
    allowMockedHttp();
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { parent: { routeConfig: { path: 'admin' } } },
    });
    const fixture = TestBed.createComponent(GamesPage);
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    expect(page.textContent).toContain('Loading game submissions');
    TestBed.inject(HttpTestingController).expectOne(queueUrl).flush([submission]);
    await fixture.whenStable();
    fixture.detectChanges();
    const title = page.querySelector<HTMLButtonElement>('tbody button')!;
    expect(title.textContent).toContain(submission.gameTitle);
    title.click();
    fixture.detectChanges();
    expect(page.querySelector('#game-creation-details')?.textContent).toContain(submission.gameId);
    expect(page.querySelector('#creation-decision-preview')).toBeNull();
    expect(page.textContent).not.toContain('Demo data');
  });

  it('shows unavailable when the protected queue returns 503', async () => {
    allowMockedHttp();
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { parent: { routeConfig: { path: 'admin' } } },
    });
    const fixture = TestBed.createComponent(GamesPage);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne(queueUrl)
      .flush(null, { status: 503, statusText: 'Service Unavailable' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('temporarily unavailable');
    expect(fixture.nativeElement.querySelector('tbody')).toBeNull();
  });
});
