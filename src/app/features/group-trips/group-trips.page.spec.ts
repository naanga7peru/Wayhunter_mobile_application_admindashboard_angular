import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GroupTripsPage } from './group-trips.page';

describe('Group Trip Management', () => {
  it('shows unavailable group and safety views without displaying records or issuing requests', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(GroupTripsPage);
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;

    expect(page.querySelector('h2')?.textContent).toBe('Group Trip Management');
    expect(page.querySelector('#group-trips-availability strong')?.textContent).toBe(
      'Group trip listing unavailable.',
    );
    expect(page.querySelector('#group-trip-details')?.textContent).toBe('Group trip details');
    const form = page.querySelector('form')!;
    expect(form.querySelector('input:disabled')).not.toBeNull();
    expect(form.querySelector('select:disabled')).not.toBeNull();
    expect(form.querySelector('button:disabled')).not.toBeNull();
    expect(form.dispatchEvent(new Event('submit', { cancelable: true }))).toBe(false);
    const safetySummary = page.querySelector<HTMLButtonElement>('button[type="button"]')!;
    expect(safetySummary.textContent).toBe('View safety summary');
    expect(safetySummary.disabled).toBe(true);
    safetySummary.click();
    expect(page.querySelector('table, [role="row"], img, video, canvas')).toBeNull();
    TestBed.inject(HttpTestingController).verify();
  });
});
