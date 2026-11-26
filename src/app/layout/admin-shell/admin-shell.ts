import { afterNextRender, Component, computed, ElementRef, inject, Injector, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, NavigationSkipped, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

interface MenuGroup {
  label: string;
  icon: string;
  links: { label: string; path: string }[];
}

@Component({
  selector: 'wayhunter-admin-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-shell.html',
  styleUrls: ['./admin-shell.scss', './admin-navigation.scss'],
})
export class AdminShell {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly mobileToggle = viewChild.required<ElementRef<HTMLButtonElement>>('mobileToggle');
  private readonly sidebar = viewChild.required<ElementRef<HTMLElement>>('sidebar');
  private panelTrigger?: HTMLButtonElement;

  protected readonly groups: MenuGroup[] = [
    { label: 'Workspace', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z', links: [
      { label: 'Dashboard', path: 'dashboard' },
      { label: 'Reports & Analytics', path: 'reports-analytics' },
    ] },
    { label: 'Community & Safety', icon: 'M12 22s7-3.5 7-10V5l-7-3-7 3v7c0 6.5 7 10 7 10ZM9 12l2 2 4-4', links: [
      { label: 'Users', path: 'users' },
      { label: 'Hunter Verification', path: 'hunter-verification' },
      { label: 'Places', path: 'places' },
      { label: 'Trips & Routes', path: 'trips-historical-routes' },
      { label: 'Group Trips', path: 'group-trips' },
      { label: 'Hazards', path: 'hazards' },
      { label: 'Games', path: 'games' },
    ] },
    { label: 'Rewards & Vouchers', icon: 'M4 12h16v9H4zM3 8h18v4H3zM12 8v13m0-13H8a2.5 2.5 0 1 1 2-4Zm0 0h4a2.5 2.5 0 1 0-2-4Z', links: [
      { label: 'Coins & Rewards', path: 'coins-rewards' },
      { label: 'Merchants & Inventory', path: 'merchants-voucher-inventory' },
      { label: 'Redemptions', path: 'redemptions-settlements' },
    ] },
    { label: 'Growth & Outreach', icon: 'M3 10h4l12-5v14L7 14H3zm4 4 2 6h3l-2-5m12-7v8', links: [
      { label: 'Advertisements', path: 'advertisements' },
      { label: 'Campaigns', path: 'campaigns' },
      { label: 'Notifications', path: 'notifications' },
    ] },
    { label: 'Administration', icon: 'M4 6h9m4 0h3M4 12h3m4 0h9M4 18h11m4 0h1M13 4v4M7 10v4m8 2v4', links: [
      { label: 'Admin Authentication', path: 'authentication' },
      { label: 'Settings & Audit', path: 'settings-security-audit' },
    ] },
  ];

  private readonly currentPath = signal(this.route.snapshot.firstChild?.routeConfig?.path);
  protected readonly activeGroup = computed(() => this.groups.find(group =>
    group.links.some(link => link.path === this.currentPath()),
  ));
  protected readonly openGroup = signal<MenuGroup | undefined>(undefined);
  protected readonly drawerOpen = signal(false);
  protected readonly title = signal(this.pageTitle());
  protected readonly preview = this.route.snapshot.routeConfig?.path === 'preview';

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd || event instanceof NavigationSkipped),
      takeUntilDestroyed(),
    ).subscribe(() => {
      this.title.set(this.pageTitle());
      this.currentPath.set(this.route.snapshot.firstChild?.routeConfig?.path);
      if (this.drawerOpen()) this.closeDrawer();
    });
  }

  protected toggleGroup(group: MenuGroup, trigger: HTMLButtonElement, keyboard: boolean): void {
    if (this.openGroup() === group) {
      this.closePanel();
      return;
    }
    this.openGroup.set(group);
    this.panelTrigger = trigger;
    if (keyboard) this.focusNavigation('.nav-link');
  }

  protected togglePanel(trigger: HTMLButtonElement, keyboard: boolean): void {
    if (this.openGroup()) this.panelTrigger = trigger;
    this.toggleGroup(this.openGroup() ?? this.activeGroup() ?? this.groups[0], trigger, keyboard);
  }

  protected toggleDrawer(): void {
    if (this.drawerOpen()) {
      this.closeDrawer();
      return;
    }
    this.openGroup.set(this.activeGroup() ?? this.groups[0]);
    this.drawerOpen.set(true);
    this.focusNavigation('.group-button[aria-expanded="true"]');
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
    this.openGroup.set(undefined);
    this.panelTrigger = undefined;
    this.mobileToggle().nativeElement.focus();
  }

  protected dismissNavigation(event: Event): void {
    if (this.drawerOpen()) this.closeDrawer();
    else if (this.openGroup()) this.closePanel();
    else return;
    event.stopPropagation();
  }

  private closePanel(): void {
    this.openGroup.set(undefined);
    this.panelTrigger?.focus();
    this.panelTrigger = undefined;
  }

  private focusNavigation(selector: string): void {
    afterNextRender(() => this.sidebar().nativeElement.querySelector<HTMLElement>(selector)?.focus(),
      { injector: this.injector });
  }

  private pageTitle(): string {
    const child = this.route.snapshot.firstChild;
    return this.groups.flatMap(group => group.links).find(link => link.path === child?.routeConfig?.path)?.label
      ?? child?.title
      ?? 'Dashboard';
  }
}
