import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HazardsPage } from './hazards.page';

describe('Hazard Management', () => {
  it('shows the unavailable workflow without rendering records or issuing HTTP requests', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(HazardsPage);
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;

    expect(page.querySelector('h2')?.textContent).toBe('Hazard Management');
    expect(page.querySelector('#hazards-availability strong')?.textContent).toBe(
      'Hazard reports unavailable.',
    );
    const form = page.querySelector('form')!;
    expect(form.querySelector('input:disabled')).not.toBeNull();
    expect(form.querySelector('select:disabled')).not.toBeNull();
    expect(form.querySelector('button:disabled')).not.toBeNull();
    expect(form.dispatchEvent(new Event('submit', { cancelable: true }))).toBe(false);
    const actions = Array.from(page.querySelectorAll<HTMLButtonElement>('[role="group"] button'));
    expect(actions.map((button) => button.textContent?.trim())).toEqual(['Verify', 'Resolve']);
    for (const action of actions) {
      expect(action.disabled).toBe(true);
      action.click();
    }
    expect(page.querySelector('table, [role="row"], img, video, canvas')).toBeNull();
    TestBed.inject(HttpTestingController).verify();
  });
});
