export type DashboardRange = '7' | '30' | '90';

export type DashboardSourceResult =
  | { readonly kind: 'ready'; readonly view: DashboardView }
  | { readonly kind: 'empty' | 'unavailable' };

export interface DashboardSnapshot {
  readonly view: DashboardView;
  readonly range: DashboardRange;
  readonly loadedAt: number;
}

export type DashboardState =
  | { readonly kind: 'ready'; readonly snapshot: DashboardSnapshot }
  | { readonly kind: 'loading' | 'error'; readonly snapshot?: DashboardSnapshot }
  | { readonly kind: 'empty'; readonly loadedAt: number }
  | { readonly kind: 'unavailable' };

export interface DashboardPoint {
  readonly label: string;
  readonly trips: number;
  readonly newUsers: number;
}

export type ActivityStatus = 'Completed' | 'Pending review' | 'Scheduled';

export interface DashboardActivity {
  readonly id: number;
  readonly dateTime: string;
  readonly module: string;
  readonly activity: string;
  readonly status: ActivityStatus;
}

export interface DashboardMetric {
  readonly label: string;
  readonly value: number;
  readonly detail: string;
  readonly change: number;
}

export interface DashboardView {
  readonly period: string;
  readonly metrics: readonly DashboardMetric[];
  readonly points: readonly DashboardPoint[];
  readonly activities: readonly DashboardActivity[];
}
