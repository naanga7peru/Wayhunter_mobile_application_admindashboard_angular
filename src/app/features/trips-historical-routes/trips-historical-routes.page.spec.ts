import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TripsRoutesPage } from './trips-historical-routes.page';

describe('Trips & Historical Routes', () => {
  it('shows the unavailable workflow without rendering records or issuing HTTP requests', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(TripsRoutesPage);
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;

    expect(page.querySelector('h2')?.textContent).toBe('Trips & Historical Routes');
    expect(page.querySelector('#trips-historical-routes-availability strong')?.textContent).toBe(
      'Trip listing unavailable.',
    );
    const form = page.querySelector('form')!;
    expect(form.querySelector('input:disabled')).not.toBeNull();
    expect(form.querySelector('select:disabled')).not.toBeNull();
    expect(form.querySelector('button:disabled')).not.toBeNull();
    expect(form.dispatchEvent(new Event('submit', { cancelable: true }))).toBe(false);
    expect(page.querySelector('table, [role="row"], img, video, canvas')).toBeNull();
    TestBed.inject(HttpTestingController).verify();
  });
});
