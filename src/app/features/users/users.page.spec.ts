import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UsersPage } from './users.page';

describe('User management', () => {
  it('disables lookup and filtering and reports unavailable details without requests', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(UsersPage);
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;

    expect(page.querySelector('#user-search-status')?.textContent).toContain('User lookup unavailable');
    expect(page.querySelector('#user-search-id:required:disabled')).not.toBeNull();
    expect(page.querySelector('#user-search-status-filter:disabled')).not.toBeNull();
    expect(page.querySelector('button:disabled')).not.toBeNull();
    expect(page.querySelector('.details')?.textContent).toContain('information are unavailable');
    expect(page.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }))).toBe(false);
    TestBed.inject(HttpTestingController).verify();
  });
});
