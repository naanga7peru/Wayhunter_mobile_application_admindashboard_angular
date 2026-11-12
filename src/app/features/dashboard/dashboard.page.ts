import { Component, inject, signal } from '@angular/core';
import { ApiClientService } from '../../core/http/api-client.service';

@Component({
  standalone: true,
  selector: 'wayhunter-dashboard-page',
  template: `
    <section class="pane">
      <p class="eyebrow">ADM-02 · M7 · DEVELOPMENT PREVIEW</p>
      <h2>Wayhunter Admin Dashboard</h2>
      <p>Starter UI only. Real analytics, approvals and roles have not been implemented.</p>
      <button type="button" (click)="checkBackend()">Check backend /health</button>
      <p role="status">{{ backendStatus() }}</p>
    </section>
  `,
})
export class DashboardPage {
  private readonly api = inject(ApiClientService);
  readonly backendStatus = signal('Not checked');

  checkBackend(): void {
    this.backendStatus.set('Checking localhost backend...');
    this.api.getHealth().subscribe({
      next: health => this.backendStatus.set(`API responded: ${health.status}`),
      error: () => this.backendStatus.set('Backend not reachable. Run Wayhunter.Api on port 5055.'),
    });
  }
}
