import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'wayhunter-trips-historical-routes-page',
  template: `
    <section class="pane" aria-labelledby="trips-historical-routes-title">
      <h2 id="trips-historical-routes-title">Trips & Historical Routes</h2>
      <section aria-labelledby="trips-historical-routes-list">
        <h3 id="trips-historical-routes-list">Trip activity</h3>
        <p id="trips-historical-routes-availability">
          <strong>Trip listing unavailable.</strong> Searching and filtering trips requires an authorized Admin trip catalog.
        </p>
        <form aria-labelledby="trips-historical-routes-list" aria-describedby="trips-historical-routes-availability"
              (submit)="$event.preventDefault()">
          <fieldset disabled>
            <div>
              <label for="trips-historical-routes-query">Trip search</label>
              <input id="trips-historical-routes-query" type="search" autocomplete="off">
            </div>
            <div>
              <label for="trips-historical-routes-status">Trip status</label>
              <select id="trips-historical-routes-status"><option>Status filter unavailable</option></select>
            </div>
            <button type="submit">Search</button>
          </fieldset>
        </form>
      </section>
      <section class="details" aria-labelledby="trips-historical-routes-details-1">
        <h3 id="trips-historical-routes-details-1">Trip details</h3>
        <p>Trip status, start and finish times, and activity are unavailable.</p>
      </section>
      <section class="details" aria-labelledby="trips-historical-routes-details-2">
        <h3 id="trips-historical-routes-details-2">Historical routes</h3>
        <p>Completed routes and route reuse history are unavailable.</p>
      </section>
      <section class="details" aria-labelledby="trips-historical-routes-details-3">
        <h3 id="trips-historical-routes-details-3">Safety sessions</h3>
        <p>Safety summaries require a scoped Admin grant for a specific trip and session.</p>
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
export class TripsRoutesPage {}
