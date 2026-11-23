import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'wayhunter-places-page',
  template: `
    <section class="pane" aria-labelledby="places-title">
      <h2 id="places-title">Places Management</h2>
      <section aria-labelledby="places-list-title">
        <h3 id="places-list-title">Published places</h3>
        <p id="places-list-status">
          <strong>Place listing unavailable.</strong> Searching approved places requires an authorized Admin catalog.
        </p>
        <form aria-labelledby="places-list-title" aria-describedby="places-list-status"
              (submit)="$event.preventDefault()">
          <fieldset disabled>
            <div>
              <label for="places-query">Search places</label>
              <input id="places-query" type="search" autocomplete="off">
            </div>
            <div>
              <label for="places-category">Category</label>
              <select id="places-category"><option>Category filter unavailable</option></select>
            </div>
            <div>
              <label for="places-status">Publication status</label>
              <select id="places-status"><option>Status filter unavailable</option></select>
            </div>
            <button type="submit">Search</button>
          </fieldset>
        </form>
      </section>
      <section class="details" aria-labelledby="places-details-title">
        <h3 id="places-details-title">Place details</h3>
        <p>Category, publication status, and place history are unavailable.</p>
      </section>
      <section class="details" aria-labelledby="places-moderation-title">
        <h3 id="places-moderation-title">Place moderation</h3>
        <p id="places-moderation-status">Editing, merging, and hiding places require authorized Admin APIs and an audit trail.</p>
        <div class="actions" role="group" aria-labelledby="places-moderation-title" aria-describedby="places-moderation-status">
          <button type="button" disabled>Edit place</button>
          <button type="button" disabled>Merge duplicates</button>
          <button type="button" disabled>Hide place</button>
        </div>
      </section>
    </section>
  `,
  styles: `
    fieldset, .actions { display: flex; flex-wrap: wrap; align-items: end; gap: .75rem; }
    fieldset { border: 0; margin: 1rem 0; padding: 0; }
    fieldset div { flex: 1 1 10rem; min-width: 0; }
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
export class PlacesPage {}
