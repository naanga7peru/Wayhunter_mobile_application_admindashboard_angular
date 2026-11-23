import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HunterVerificationPage } from './hunter-verification.page';

describe('Hunter Verification', () => {
  it('shows the unavailable workflow without accepting input or issuing requests', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(HunterVerificationPage);
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;

    expect(page.querySelector('h2')?.textContent).toBe('Hunter Verification');
    expect(page.querySelector('strong')?.textContent).toContain('Verification queue unavailable');
    const form = page.querySelector('form')!;
    expect(form.querySelectorAll('input:enabled, select:enabled, button:enabled')).toHaveLength(0);
    expect(form.dispatchEvent(new Event('submit', { cancelable: true }))).toBe(false);
    const actions = Array.from(page.querySelectorAll<HTMLButtonElement>('[role="group"] button'));
    expect(actions.map((button) => button.textContent?.trim())).toEqual(['Approve', 'Reject', 'Hold']);
    for (const action of actions) {
      expect(action.disabled).toBe(true);
      action.click();
    }
    expect(page.querySelector('table, img, video')).toBeNull();
    TestBed.inject(HttpTestingController).verify();
  });
});
