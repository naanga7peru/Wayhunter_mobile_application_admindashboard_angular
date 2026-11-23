import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SettingsAuditPage } from './settings-security-audit.page';

describe('Settings, security and audit', () => {
  it('shows unavailable settings and audit history without fetching or offering mutations', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(SettingsAuditPage);
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;

    expect(Array.from(page.querySelectorAll('dd'), (item) => item.textContent)).toEqual([
      'Unavailable',
      'Unavailable',
      'Unavailable',
    ]);
    expect(page.querySelector('[aria-labelledby="security-title"]')?.textContent).toContain(
      'permission management is unavailable',
    );
    expect(page.querySelector('[aria-labelledby="audit-title"]')?.textContent).toContain(
      'Audit retrieval is unavailable',
    );
    expect(page.querySelector('button, input, table')).toBeNull();
    TestBed.inject(HttpTestingController).verify();
  });
});
