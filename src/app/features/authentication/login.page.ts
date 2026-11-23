import { Component, isDevMode } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'wayhunter-login-page',
  imports: [RouterLink],
  template: `
    <main class="login-screen">
      <section class="pane login-pane" aria-labelledby="sign-in-title">
        <h1 id="sign-in-title">Wayhunter Admin sign-in</h1>
        <div id="sign-in-status" class="notice">
          <strong>Sign-in unavailable</strong>
          <p>Admin sign-in requires verified server-side session and permission checks. This screen cannot accept credentials yet.</p>
        </div>
        <form aria-labelledby="sign-in-title" aria-describedby="sign-in-status"
              (submit)="$event.preventDefault()">
          <fieldset disabled>
            <label for="admin-email">Email address</label>
            <input id="admin-email" type="email" autocomplete="off" required>
            <label for="admin-password">Password</label>
            <input id="admin-password" type="password" autocomplete="off" required>
            <button type="submit">Sign in</button>
          </fieldset>
        </form>
        @if (showPreview) {
          <a routerLink="/preview">Local development preview</a>
        }
      </section>
    </main>
  `,
  styles: `
    .login-pane { width: min(100%, 30rem); }
    h1 { margin: 0 0 1rem; font-size: clamp(1.4rem, 5vw, 1.9rem); }
    .notice {
      padding: .85rem 1rem;
      border: 1px solid var(--line);
      border-radius: .65rem;
      background: #f5f7fc;
      color: var(--muted);
    }
    .notice strong { color: var(--ink); }
    .notice p { margin: .3rem 0 0; }
    fieldset { display: grid; gap: .5rem; border: 0; padding: 0; margin: 1.25rem 0; }
    label { font-weight: 600; }
    input {
      width: 100%;
      min-width: 0;
      margin-bottom: .5rem;
      padding: .65rem .75rem;
      border: 1px solid var(--line);
      border-radius: .5rem;
      background: #f5f7fc;
      font: inherit;
    }
    button:disabled { background: #e4eaf4; color: var(--muted); cursor: not-allowed; }
    a { text-decoration: underline; text-underline-offset: .18em; }
  `,
})
export class LoginPage {
  protected readonly showPreview = isDevMode();
}
