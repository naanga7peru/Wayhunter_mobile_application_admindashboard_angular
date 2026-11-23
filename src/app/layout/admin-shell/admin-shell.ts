import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

interface MenuGroup {
  label: string;
  links: { label: string; path: string }[];
}

@Component({
  selector: 'wayhunter-admin-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss',
})
export class AdminShell {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly groups: MenuGroup[] = [
    { label: 'Workspace', links: [
      { label: 'Dashboard', path: 'dashboard' },
      { label: 'Reports & Analytics', path: 'reports-analytics' },
    ] },
    { label: 'Community & Safety', links: [
      { label: 'Users', path: 'users' },
      { label: 'Hunter Verification', path: 'hunter-verification' },
      { label: 'Places', path: 'places' },
      { label: 'Trips & Routes', path: 'trips-historical-routes' },
      { label: 'Group Trips', path: 'group-trips' },
      { label: 'Hazards', path: 'hazards' },
      { label: 'Games', path: 'games' },
    ] },
    { label: 'Rewards & Vouchers', links: [
      { label: 'Coins & Rewards', path: 'coins-rewards' },
      { label: 'Merchants & Inventory', path: 'merchants-voucher-inventory' },
      { label: 'Redemptions', path: 'redemptions-settlements' },
    ] },
    { label: 'Growth & Outreach', links: [
      { label: 'Advertisements', path: 'advertisements' },
      { label: 'Campaigns', path: 'campaigns' },
      { label: 'Notifications', path: 'notifications' },
    ] },
    { label: 'Administration', links: [
      { label: 'Admin Authentication', path: 'authentication' },
      { label: 'Settings & Audit', path: 'settings-security-audit' },
    ] },
  ];

  protected readonly collapsed = signal(false);
  protected readonly drawerOpen = signal(false);
  protected readonly title = signal(this.pageTitle());
  protected readonly preview = this.route.snapshot.routeConfig?.path === 'preview';

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed(),
    ).subscribe(() => {
      this.title.set(this.pageTitle());
      this.drawerOpen.set(false);
    });
  }

  protected closeDrawer(toggle: HTMLButtonElement): void {
    this.drawerOpen.set(false);
    toggle.focus();
  }

  private pageTitle(): string {
    const path = this.route.snapshot.firstChild?.routeConfig?.path;
    return this.groups.flatMap(group => group.links).find(link => link.path === path)?.label ?? 'Dashboard';
  }
}
