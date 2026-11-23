import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NotificationsPage } from './notifications.page';

describe('Notification Management', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('renders unavailable operations without displaying schedules or delivery counts', () => {
    const fixture = TestBed.createComponent(NotificationsPage);
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;

    expect(page.querySelector('h2')?.textContent).toBe('Notification Management');
    expect(page.querySelector('#notifications-availability')?.textContent).toContain(
      'Notification operations unavailable.',
    );
    expect(page.querySelector('#notification-schedule-status')?.textContent).toContain(
      'Schedule details and status are unavailable.',
    );
    expect(page.querySelector('#notification-delivery-status')?.textContent).toContain(
      'Delivery counts are unavailable.',
    );
    expect(page.querySelector('table, [role="row"]')).toBeNull();
  });

  it('keeps preview, scheduling, cancellation, and delivery controls disabled', () => {
    const fixture = TestBed.createComponent(NotificationsPage);
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelectorAll('input:disabled, select:disabled')).toHaveLength(3);

    const buttons = Array.from(page.querySelectorAll('button'));
    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      'Preview audience',
      'Schedule notification',
      'Cancel schedule',
      'View delivery summary',
    ]);
    for (const button of buttons) {
      expect(button.disabled).toBe(true);
      button.click();
    }
  });
});
