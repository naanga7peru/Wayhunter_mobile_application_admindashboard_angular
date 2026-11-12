import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'wayhunter-login-page',
  imports: [RouterLink],
  template: `
    <main class="login-screen">
      <section class="pane">
        <p class="eyebrow">ADM-01 · M1</p>
        <h1>Wayhunter Admin</h1>
        <p>Authentication NOT implemented. This is a starter screen, not a working login.</p>
        <p>Admin routes are blocked until M1 implements secure RBAC and session management.</p>
        <a routerLink="/preview">Local development preview</a>
      </section>
    </main>
  `,
})
export class LoginPage {}
