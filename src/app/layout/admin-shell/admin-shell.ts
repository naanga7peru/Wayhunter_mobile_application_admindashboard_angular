import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface MenuLink { label: string; path: string; owner: string; }
@Component({
  selector: 'wayhunter-admin-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="admin-shell">
      <aside class="sidebar">
        <h1>WAYHUNTER</h1>
        <p class="eyebrow">Local scaffold preview</p>
        <nav aria-label="Admin modules">
          @for (entry of links; track entry.path) {
            <a [routerLink]="entry.path" routerLinkActive="active">
              <span>{{ entry.label }}</span><small>{{ entry.owner }}</small>
            </a>
          }
        </nav>
      </aside>
      <main class="main-area">
        <p class="warning-strip">Development preview only · No real admin access, user data or approvals</p>
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminShell {
  readonly links: MenuLink[] = [
    { label: 'Dashboard', path: 'dashboard', owner: 'M7' },
    { label: 'Admin Authentication', path: 'authentication', owner: 'M1' },
    { label: 'Users', path: 'users', owner: 'M1' },
    { label: 'Hunter Verification', path: 'hunter-verification', owner: 'M4' },
    { label: 'Advertisements', path: 'advertisements', owner: 'M7' },
    { label: 'Places', path: 'places', owner: 'M4' },
    { label: 'Trips & Routes', path: 'trips-historical-routes', owner: 'M2' },
    { label: 'Hazards', path: 'hazards', owner: 'M3' },
    { label: 'Group Trips', path: 'group-trips', owner: 'M3' },
    { label: 'Games', path: 'games', owner: 'M5' },
    { label: 'Coins & Rewards', path: 'coins-rewards', owner: 'M6' },
    { label: 'Merchants & Inventory', path: 'merchants-voucher-inventory', owner: 'M6' },
    { label: 'Redemptions', path: 'redemptions-settlements', owner: 'M6' },
    { label: 'Campaigns', path: 'campaigns', owner: 'M7' },
    { label: 'Reports & Analytics', path: 'reports-analytics', owner: 'M7' },
    { label: 'Notifications', path: 'notifications', owner: 'M3' },
    { label: 'Settings & Audit', path: 'settings-security-audit', owner: 'M1' },
  ];
}
