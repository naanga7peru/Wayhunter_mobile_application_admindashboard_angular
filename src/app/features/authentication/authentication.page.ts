import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'wayhunter-authentication-page',
  template: `
    <section class="pane" aria-labelledby="authentication-title">
      <h2 id="authentication-title">Admin Authentication</h2>
      <p>Admin sign-in is unavailable until the server can verify Admin sessions and permissions.</p>
      <dl>
        <div><dt>Sign-in and account recovery</dt><dd>Unavailable</dd></div>
        <div><dt>Session and permission verification</dt><dd>Unavailable</dd></div>
        <div><dt>Sign-in audit history</dt><dd>Unavailable</dd></div>
      </dl>
    </section>
  `,
  styles: `
    dl div { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .4rem 1rem; padding: .75rem 0; border-top: 1px solid var(--line); }
    dt { font-weight: 600; }
    dd { margin: 0; color: var(--muted); }
  `,
})
export class AdminAuthenticationPage {}
