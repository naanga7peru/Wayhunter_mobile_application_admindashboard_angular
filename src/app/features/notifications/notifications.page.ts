import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiButton } from '../../shared/ui/button';

@Component({
  standalone: true,
  selector: 'wayhunter-notifications-page',
  imports: [UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pane" aria-labelledby="notifications-title">
      <h2 id="notifications-title">Notification Management</h2>
      <p>Preview an audience, schedule a notification, and review delivery for an individual schedule.</p>
      <p id="notifications-availability" class="notice">
        <strong>Notification operations unavailable.</strong>
        These operations require verified Admin access and an available notification service.
      </p>

      <div class="operations">
        <section aria-labelledby="notification-preview-title">
          <h3 id="notification-preview-title">Audience preview</h3>
          <fieldset aria-labelledby="notification-preview-title" aria-describedby="notifications-availability" disabled>
            <label for="notification-template">Notification template</label>
            <select id="notification-template"><option>Templates unavailable</option></select>
            <label for="notification-audience">Audience</label>
            <select id="notification-audience"><option>Audience selection unavailable</option></select>
            <button whButton disabled>Preview audience</button>
          </fieldset>
        </section>
        <section aria-labelledby="notification-scheduling-title">
          <h3 id="notification-scheduling-title">Scheduling</h3>
          <fieldset aria-labelledby="notification-scheduling-title" aria-describedby="notifications-availability" disabled>
            <label for="notification-send-at">Send date and time (UTC)</label>
            <input id="notification-send-at" type="datetime-local">
            <button whButton disabled>Schedule notification</button>
          </fieldset>
        </section>
        <section aria-labelledby="notification-schedule-title">
          <h3 id="notification-schedule-title">Schedule details</h3>
          <p id="notification-schedule-status">Schedule details and status are unavailable.</p>
          <button whButton variant="outline" disabled aria-describedby="notification-schedule-status">
            Cancel schedule
          </button>
        </section>
        <section aria-labelledby="notification-delivery-title">
          <h3 id="notification-delivery-title">Delivery summary</h3>
          <p id="notification-delivery-status">
            Delivery counts are unavailable. A summary requires access to a specific schedule.
          </p>
          <button whButton variant="outline" disabled aria-describedby="notification-delivery-status">
            View delivery summary
          </button>
        </section>
      </div>
    </section>
  `,
  styles: `
    .notice, .operations section {
      padding: 1rem;
      border: 1px solid var(--line);
      border-radius: var(--radius-control);
    }
    .notice { background: var(--neutral-bg); color: var(--muted); }
    .notice strong { color: var(--ink); }
    .operations {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
      gap: 1rem;
    }
    .operations section { min-width: 0; background: var(--surface); }
    h3 { margin: 0 0 .75rem; }
    fieldset { display: grid; gap: .5rem; border: 0; padding: 0; margin: 0; min-width: 0; }
    fieldset button { justify-self: start; margin-top: .25rem; }
    label { font-weight: 600; }
    input, select {
      width: 100%;
      min-width: 0;
      min-height: 44px;
      padding: .5rem .65rem;
      font: inherit;
      color: var(--muted);
      border: 1px solid var(--control-border);
      border-radius: var(--radius-control);
      background: var(--neutral-bg);
    }
  `,
})
export class NotificationsPage {}
