import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'wayhunter-hunter-verification-page',
  template: `
    <section class="pane" aria-labelledby="hunter-title">
      <h2 id="hunter-title">Hunter Verification</h2>
      <section aria-labelledby="hunter-queue-title">
        <h3 id="hunter-queue-title">Pending verification requests</h3>
        <p id="hunter-queue-status">
          <strong>Verification queue unavailable.</strong> Viewing and filtering requests requires authorized Admin access.
        </p>
        <form aria-labelledby="hunter-queue-title" aria-describedby="hunter-queue-status"
              (submit)="$event.preventDefault()">
          <fieldset disabled>
            <div>
              <label for="hunter-query">User ID or display name</label>
              <input id="hunter-query" type="search" autocomplete="off">
            </div>
            <div>
              <label for="hunter-status">Verification status</label>
              <select id="hunter-status"><option>Status filter unavailable</option></select>
            </div>
            <button type="submit">Search</button>
          </fieldset>
        </form>
      </section>
      <section class="details" aria-labelledby="hunter-details-title">
        <h3 id="hunter-details-title">Application details</h3>
        <p>Applicant identity, capture district and GPS, live 360° and photo evidence, duplicate candidates within 200 m, and restricted-area checks are unavailable.</p>
      </section>
      <section class="details" aria-labelledby="hunter-review-title">
        <h3 id="hunter-review-title">Review decision</h3>
        <p id="hunter-review-status">Decisions require a trusted Admin service that records the reviewer, reason, and outcome.</p>
        <div class="actions" role="group" aria-labelledby="hunter-review-title" aria-describedby="hunter-review-status">
          <button type="button" disabled>Approve</button>
          <button type="button" disabled>Reject</button>
          <button type="button" disabled>Hold</button>
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
export class HunterVerificationPage {}
