import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'wayhunter-settings-security-audit-page',
  template: `
    <section class="pane" aria-labelledby="settings-title">
      <h2 id="settings-title">Settings, Security & Audit</h2>
      <p>Settings and audit history require authorized Admin access.</p>
      <div class="sections">
        <section aria-labelledby="settings-categories-title">
          <h3 id="settings-categories-title">Settings</h3>
          <dl>
            <div><dt>Versioned rules</dt><dd>Unavailable</dd></div>
            <div><dt>Restricted zones</dt><dd>Unavailable</dd></div>
            <div><dt>Integration status</dt><dd>Unavailable</dd></div>
          </dl>
        </section>
        <section aria-labelledby="security-title">
          <h3 id="security-title">Security</h3>
          <p>Admin role and permission management is unavailable.</p>
          <p>The server must verify Admin access before protected settings can be viewed or changed.</p>
        </section>
        <section aria-labelledby="audit-title">
          <h3 id="audit-title">Audit history</h3>
          <p>Audit retrieval is unavailable. The number of records is unknown.</p>
        </section>
      </div>
    </section>
  `,
  styles: `
    .sections { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr)); gap: 1rem; }
    .sections section { border: 1px solid var(--line); border-radius: .65rem; padding: 1rem; }
    h3 { margin: 0 0 .75rem; }
    dl, p:last-child { margin-bottom: 0; }
    dl div + div { margin-top: .65rem; }
    dt { font-weight: 600; }
    dd { margin: .15rem 0 0; color: var(--muted); }
  `,
})
export class SettingsAuditPage {}
