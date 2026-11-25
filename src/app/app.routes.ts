import { Routes } from '@angular/router';
import { AdminShell } from './layout/admin-shell/admin-shell';
import { authRequiredGuard, devPreviewGuard } from './core/guards/dev-preview.guard';

const shellChildren: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'authentication', title: 'Admin Authentication - Wayhunter Admin', loadComponent: () => import('./features/authentication/authentication.page').then(m => m.AdminAuthenticationPage) },
      { path: 'dashboard', title: 'Dashboard - Wayhunter Admin', loadComponent: () => import('./features/dashboard/dashboard.page').then(m => m.DashboardPage) },
      { path: 'users', title: 'User Management - Wayhunter Admin', loadComponent: () => import('./features/users/users.page').then(m => m.UsersPage) },
      { path: 'hunter-verification', title: 'Hunter Verification - Wayhunter Admin', loadComponent: () => import('./features/hunter-verification/hunter-verification.page').then(m => m.HunterVerificationPage) },
      { path: 'advertisements', title: 'Advertisements - Wayhunter Admin', loadComponent: () => import('./features/advertisements/advertisements.page').then(m => m.AdvertisementsPage) },
      { path: 'places', title: 'Places Management - Wayhunter Admin', loadComponent: () => import('./features/places/places.page').then(m => m.PlacesPage) },
      { path: 'trips-historical-routes', title: 'Trips & Historical Routes - Wayhunter Admin', loadComponent: () => import('./features/trips-historical-routes/trips-historical-routes.page').then(m => m.TripsRoutesPage) },
      { path: 'hazards', title: 'Hazard Management - Wayhunter Admin', loadComponent: () => import('./features/hazards/hazards.page').then(m => m.HazardsPage) },
      { path: 'group-trips', title: 'Group Trip Management - Wayhunter Admin', loadComponent: () => import('./features/group-trips/group-trips.page').then(m => m.GroupTripsPage) },
      { path: 'games', title: 'Games & Anti-Cheat - Wayhunter Admin', loadComponent: () => import('./features/games/games.page').then(m => m.GamesPage) },
      { path: 'coins-rewards', title: 'Coins & Rewards - Wayhunter Admin', loadComponent: () => import('./features/coins-rewards/coins-rewards.page').then(m => m.CoinsRewardsPage) },
      { path: 'merchants-voucher-inventory', title: 'Merchants & Voucher Inventory - Wayhunter Admin', loadComponent: () => import('./features/merchants-voucher-inventory/merchants-voucher-inventory.page').then(m => m.MerchantsInventoryPage) },
      { path: 'redemptions-settlements', title: 'Redemptions & Settlements - Wayhunter Admin', loadComponent: () => import('./features/redemptions-settlements/redemptions-settlements.page').then(m => m.RedemptionsPage) },
      { path: 'campaigns', title: 'Campaign Management - Wayhunter Admin', loadComponent: () => import('./features/campaigns/campaigns.page').then(m => m.CampaignsPage) },
      { path: 'reports-analytics', title: 'Reports & Analytics - Wayhunter Admin', loadComponent: () => import('./features/reports-analytics/reports-analytics.page').then(m => m.ReportsAnalyticsPage) },
      { path: 'notifications', title: 'Notification Management - Wayhunter Admin', loadComponent: () => import('./features/notifications/notifications.page').then(m => m.NotificationsPage) },
      { path: 'settings-security-audit', title: 'Settings, Security & Audit - Wayhunter Admin', loadComponent: () => import('./features/settings-security-audit/settings-security-audit.page').then(m => m.SettingsAuditPage) },
];

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'preview' },
  { path: 'login', title: 'Login - Wayhunter Admin', loadComponent: () => import('./features/authentication/login.page').then(m => m.LoginPage) },
  {
    path: 'preview',
    canMatch: [devPreviewGuard],
    component: AdminShell,
    children: [
      ...shellChildren,
      {
        path: 'shared-ui',
        title: 'Shared UI',
        loadComponent: () => import('./shared/ui/shared-ui-preview').then(m => m.SharedUiPreview),
      },
    ],
  },
  // Real admin pages are deliberately inaccessible until M1 implements auth+RBAC.
  { path: 'admin', canMatch: [authRequiredGuard], component: AdminShell, children: shellChildren },
  { path: '**', redirectTo: 'login' },
];
