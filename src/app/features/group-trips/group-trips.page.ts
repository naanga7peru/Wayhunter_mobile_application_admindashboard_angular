import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'wayhunter-group-trips-page',
  template: `
    <section class="pane" aria-labelledby="group-trips-title">
      <h2 id="group-trips-title">Group Trip Management</h2>
      <section aria-labelledby="group-trips-list">
        <h3 id="group-trips-list">Group trips</h3>
        <p id="group-trips-availability">
          <strong>Group trip listing unavailable.</strong> Search and filtering require authorized Admin access.
        </p>
        <form aria-labelledby="group-trips-list" aria-describedby="group-trips-availability"
              (submit)="$event.preventDefault()">
          <fieldset disabled>
            <div>
              <label for="group-trips-query">Group trip search</label>
              <input id="group-trips-query" type="search" autocomplete="off">
            </div>
            <div>
              <label for="group-trips-status">Group trip status</label>
              <select id="group-trips-status"><option>Status filter unavailable</option></select>
            </div>
            <button type="submit">Search</button>
          </fieldset>
        </form>
      </section>
      <section class="details" aria-labelledby="group-trip-details">
        <h3 id="group-trip-details">Group trip details</h3>
        <p>Trip status, organizer, membership, and invitation history are unavailable.</p>
      </section>
      <section class="details" aria-labelledby="group-safety-title">
        <h3 id="group-safety-title">Safety and activity</h3>
        <p id="group-safety-status">Safety summaries and I’m Safe check-ins require a scoped Admin grant for a specific trip and session. GPS sharing requires separate member consent.</p>
        <button type="button" aria-describedby="group-safety-status" disabled>View safety summary</button>
      </section>
    </section>
  `,
  styles: `
    fieldset { display: flex; flex-wrap: wrap; align-items: end; gap: .75rem; }
    fieldset { border: 0; margin: 1rem 0; padding: 0; }
    fieldset div { flex: 1 1 12rem; min-width: 0; }
    label { display: block; margin-bottom: .35rem; font-weight: 600; }
    input, select {
      width: 100%;
      padding: .65rem .75rem;
      border: 1px solid var(--line);
      border-radius: .5rem;
      background: #f5f7fc;
      color: var(--muted);
      font: inherit;
    }
    button:disabled { background: #e4eaf4; color: var(--muted); cursor: not-allowed; }
    .details { margin-top: 1.25rem; border-top: 1px solid var(--line); }
    .details p { color: var(--muted); }
  `,
})
export class GroupTripsPage {}
