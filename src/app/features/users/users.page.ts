import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'wayhunter-users-page',
  template: `
    <section class="pane" aria-labelledby="users-title">
      <h2 id="users-title">User Management</h2>
      <p id="user-search-status">
        <strong>User lookup unavailable.</strong> Search and moderation require authorized Admin APIs.
      </p>
      <form aria-label="User search" aria-describedby="user-search-status"
            (submit)="$event.preventDefault()">
        <fieldset disabled>
          <div>
            <label for="user-search-id">User ID</label>
            <input id="user-search-id" type="search" autocomplete="off" required>
          </div>
          <div>
            <label for="user-search-status-filter">Account status</label>
            <select id="user-search-status-filter">
              <option>Status filter unavailable</option>
            </select>
          </div>
          <button type="submit">Search</button>
        </fieldset>
      </form>
      <section class="details" aria-labelledby="user-details-title">
        <h3 id="user-details-title">User details</h3>
        <p>Account status, profile, activity, and wallet information are unavailable.</p>
        <p>Warnings, suspensions, and reactivations are unavailable.</p>
      </section>
    </section>
  `,
  styles: `
    fieldset { display: flex; align-items: end; flex-wrap: wrap; gap: 1rem; padding: 0; margin: 1.25rem 0; border: 0; }
    fieldset div { flex: 1 1 12rem; min-width: 0; }
    label { display: block; margin-bottom: .35rem; font-weight: 600; }
    input, select { width: 100%; padding: .65rem .75rem; border: 1px solid var(--line); border-radius: .5rem; background: #f5f7fc; color: var(--muted); font: inherit; }
    button:disabled { background: #e4eaf4; color: var(--muted); cursor: not-allowed; }
    .details { border-top: 1px solid var(--line); }
    .details p { color: var(--muted); }
  `,
})
export class UsersPage {}
