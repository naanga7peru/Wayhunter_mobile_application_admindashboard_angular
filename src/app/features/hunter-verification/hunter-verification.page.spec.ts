import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { ApiError } from '../../core/http/api-error';
import { AdminHunterApiService, HunterSubmissionDto } from './admin-hunter-api.service';
import { HunterVerificationPage } from './hunter-verification.page';

describe('Hunter Verification', () => {
  let page: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(HunterVerificationPage);
    fixture.detectChanges();
    page = fixture.nativeElement;
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).expectNone(() => true);
    TestBed.inject(HttpTestingController).verify();
  });

  it('announces the review workflow and unavailable backend without showing counts', () => {
    expect(page.querySelector('h2')?.textContent).toBe('Hunter Verification');
    expect(page.querySelector('header p')?.textContent).toContain('assess submitted evidence');
    expect(page.querySelector('header')?.textContent).toContain('Live integration unavailable');
    expect(page.querySelector('[role="status"]')?.textContent).toContain('Verification queue unavailable');
    expect(Array.from(page.querySelectorAll('li'), (item) => item.textContent?.trim())).toEqual([
      'Pending review', 'Under review', 'Approved', 'Rejected',
    ]);
  });

  it('provides labeled search and status controls but prevents submission', () => {
    expect(page.querySelector('label[for="hunter-query"]')?.textContent).toBe('Applicant name or reference');
    expect(page.querySelector('label[for="hunter-status"]')?.textContent).toBe('Verification status');
    const form = page.querySelector('form')!;
    expect(form.querySelectorAll('input:disabled, select:disabled, button:disabled')).toHaveLength(3);
    expect(form.dispatchEvent(new Event('submit', { cancelable: true }))).toBe(false);
  });

  it('renders an accessible, keyboard-scrollable table without applicant records', () => {
    expect(page.querySelector('[aria-label="Application table"]')?.getAttribute('tabindex')).toBe('0');
    expect(Array.from(page.querySelectorAll('th[scope="col"]'), (cell) => cell.textContent)).toEqual([
      'Applicant name', 'Application reference', 'Submitted', 'Status', 'Details',
    ]);
    expect(page.querySelector('table')?.getAttribute('aria-describedby')).toBe('hunter-queue-status');
    expect(page.querySelectorAll('tbody tr')).toHaveLength(0);
  });

  it('keeps evidence, history and decisions unavailable without issuing requests', () => {
    expect(Array.from(page.querySelectorAll('h4'), (heading) => heading.textContent)).toEqual([
      'Applicant overview', 'Submitted verification evidence', 'Review history', 'Moderation decision',
    ]);
    expect(page.querySelector('img, video')).toBeNull();
    const group = page.querySelector('[role="group"]')!;
    expect(group.getAttribute('aria-describedby')).toBe('hunter-review-status');
    const actions = Array.from(group.querySelectorAll('button'));
    expect(actions.map((button) => button.textContent?.trim())).toEqual(['Approve', 'Reject', 'Hold']);
    for (const action of actions) {
      expect(action.disabled).toBe(true);
      action.click();
    }
    expect(page.querySelectorAll('input:enabled, select:enabled, button:enabled')).toHaveLength(0);
  });
});

describe('Hunter Verification protected queue', () => {
  let response: Subject<readonly HunterSubmissionDto[]>;

  beforeEach(() => {
    response = new Subject();
    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: { parent: { routeConfig: { path: 'admin' } } } },
        { provide: AdminHunterApiService, useValue: { listPending: () => response } },
      ],
    });
  });

  it('shows loading and then an empty queue', () => {
    const fixture = TestBed.createComponent(HunterVerificationPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Loading');
    response.next([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('No applications');
  });

  it.each([[401, 'does not have access'], [403, 'does not have access'],
    [500, 'could not be loaded'], [503, 'queue unavailable']])(
    'shows the correct message for HTTP %s',
    (status, message) => {
      const fixture = TestBed.createComponent(HunterVerificationPage);
      fixture.detectChanges();
      response.error(new ApiError(status));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(message);
    },
  );

  it('paginates returned applications and restarts at page one when filtering', () => {
    const fixture = TestBed.createComponent(HunterVerificationPage);
    fixture.detectChanges();
    response.next(Array.from({ length: 21 }, (_, index) => ({
      submissionId: `ref-${index}`,
      placeName: `Place ${index}`,
      district: index === 20 ? 'Kandy' : 'Colombo',
      status: 1,
      createdAtUtc: '2026-11-26T12:00:00Z',
      submittedAtUtc: null,
    })));
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelectorAll('tbody tr')).toHaveLength(20);
    page.querySelector<HTMLButtonElement>('nav button:last-child')!.click();
    fixture.detectChanges();
    expect(page.querySelector('tbody')?.textContent).toContain('Kandy');
    const input = page.querySelector<HTMLInputElement>('#hunter-live-query')!;
    input.value = ' colombo ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(page.querySelectorAll('tbody tr')).toHaveLength(20);
    expect(page.querySelector('tbody')?.textContent).not.toContain('Kandy');
  });
});
