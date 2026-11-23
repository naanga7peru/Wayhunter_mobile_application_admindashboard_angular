import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminAuthenticationPage } from './authentication.page';
import { LoginPage } from './login.page';

describe('Admin authentication screens', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('labels the fields and disables credential entry while Admin sign-in is unavailable', () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;

    expect(page.querySelector('#sign-in-status')?.textContent).toContain('Sign-in unavailable');
    expect(page.querySelector('label[for="admin-email"]')?.textContent).toBe('Email address');
    expect(page.querySelector('label[for="admin-password"]')?.textContent).toBe('Password');
    expect(page.querySelectorAll('input:required:disabled')).toHaveLength(2);
    expect(page.querySelector('button:disabled')?.textContent).toBe('Sign in');
  });

  it('cancels form submission without issuing a request', () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    const submit = new Event('submit', { bubbles: true, cancelable: true });

    expect(form.dispatchEvent(submit)).toBe(false);
    expect(new FormData(form).entries().next().done).toBe(true);
  });

  it('shows the authentication module capabilities as unavailable', () => {
    const fixture = TestBed.createComponent(AdminAuthenticationPage);
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;

    expect(Array.from(page.querySelectorAll('dd'), (item) => item.textContent)).toEqual([
      'Unavailable',
      'Unavailable',
      'Unavailable',
    ]);
  });
});
