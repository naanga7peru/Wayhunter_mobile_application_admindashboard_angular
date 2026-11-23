import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'wayhunter-hazards-page',
  template: `
    <section class="pane" aria-labelledby="hazards-title">
      <h2 id="hazards-title">Hazard Management</h2>
      <section aria-labelledby="hazards-list">
        <h3 id="hazards-list">Hazard reports</h3>
        <p id="hazards-availability">
          <strong>Hazard reports unavailable.</strong> Searching and filtering reports requires an authorized Admin hazard catalog.
        </p>
        <form aria-labelledby="hazards-list" aria-describedby="hazards-availability"
              (submit)="$event.preventDefault()">
          <fieldset disabled>
            <div>
              <label for="hazards-query">Hazard search</label>
              <input id="hazards-query" type="search" autocomplete="off">
            </div>
            <div>
              <label for="hazards-status">Verification status</label>
              <select id="hazards-status"><option>Status filter unavailable</option></select>
            </div>
            <button type="submit">Search</button>
          </fieldset>
        </form>
      </section>
      <section class="details" aria-labelledby="hazards-details-1">
        <h3 id="hazards-details-1">Report details</h3>
        <p>Hazard status, location, and photo evidence are unavailable.</p>
      </section>
      <section class="details" aria-labelledby="hazards-details-2">
        <h3 id="hazards-details-2">Traveler warnings</h3>
        <p>Warnings apply within 1 km of the planned route, show the photo capture time, and expire 24 hours after the stored report time.</p>
      </section>
      <section class="details" aria-labelledby="hazard-review-title">
        <h3 id="hazard-review-title">Verification and resolution</h3>
        <p id="hazard-review-status">These actions require trusted Admin authorization and access to the report and its evidence.</p>
        <div class="actions" role="group" aria-labelledby="hazard-review-title" aria-describedby="hazard-review-status">
          <button type="button" disabled>Verify</button>
          <button type="button" disabled>Resolve</button>
        </div>
      </section>
    </section>
  `,
  styles: `
    fieldset, .actions { display: flex; flex-wrap: wrap; align-items: end; gap: .75rem; }
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
export class HazardsPage {}
