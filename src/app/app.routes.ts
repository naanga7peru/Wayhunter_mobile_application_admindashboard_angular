import { Routes } from '@angular/router';
import { AdminShell } from './layout/admin-shell/admin-shell';
import { authRequiredGuard, devPreviewGuard } from './core/guards/dev-preview.guard';

const shellChildren: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'authentication', loadComponent: () => import('./features/authentication/authentication.page').then(m => m.AdminAuthenticationPage) },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.page').then(m => m.DashboardPage) },
      { path: 'users', loadComponent: () => import('./features/users/users.page').then(m => m.UsersPage) },
      { path: 'hunter-verification', loadComponent: () => import('./features/hunter-verification/hunter-verification.page').then(m => m.HunterVerificationPage) },
      { path: 'advertisements', loadComponent: () => import('./features/advertisements/advertisements.page').then(m => m.AdvertisementsPage) },
      { path: 'places', loadComponent: () => import('./features/places/places.page').then(m => m.PlacesPage) },
      { path: 'trips-historical-routes', loadComponent: () => import('./features/trips-historical-routes/trips-historical-routes.page').then(m => m.TripsRoutesPage) },
      { path: 'hazards', loadComponent: () => import('./features/hazards/hazards.page').then(m => m.HazardsPage) },
      { path: 'group-trips', loadComponent: () => import('./features/group-trips/group-trips.page').then(m => m.GroupTripsPage) },
      { path: 'games', loadComponent: () => import('./features/games/games.page').then(m => m.GamesPage) },
      { path: 'coins-rewards', loadComponent: () => import('./features/coins-rewards/coins-rewards.page').then(m => m.CoinsRewardsPage) },
      { path: 'merchants-voucher-inventory', loadComponent: () => import('./features/merchants-voucher-inventory/merchants-voucher-inventory.page').then(m => m.MerchantsInventoryPage) },
      { path: 'redemptions-settlements', loadComponent: () => import('./features/redemptions-settlements/redemptions-settlements.page').then(m => m.RedemptionsPage) },
      { path: 'campaigns', loadComponent: () => import('./features/campaigns/campaigns.page').then(m => m.CampaignsPage) },
      { path: 'reports-analytics', loadComponent: () => import('./features/reports-analytics/reports-analytics.page').then(m => m.ReportsAnalyticsPage) },
      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications.page').then(m => m.NotificationsPage) },
      { path: 'settings-security-audit', loadComponent: () => import('./features/settings-security-audit/settings-security-audit.page').then(m => m.SettingsAuditPage) },
];

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'preview' },
  { path: 'login', loadComponent: () => import('./features/authentication/login.page').then(m => m.LoginPage) },
  { path: 'preview', canMatch: [devPreviewGuard], component: AdminShell, children: shellChildren },
  // Real admin pages are deliberately inaccessible until M1 implements auth+RBAC.
  { path: 'admin', canMatch: [authRequiredGuard], component: AdminShell, children: shellChildren },
  { path: '**', redirectTo: 'login' },
];
