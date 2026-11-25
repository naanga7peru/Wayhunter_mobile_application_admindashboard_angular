export type DashboardRange = '7' | '30' | '90';

export interface DashboardDistrictActivity {
  readonly district: string;
  readonly trips: number;
}

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
  readonly districtActivity: readonly DashboardDistrictActivity[];
  readonly period: string;
  readonly metrics: readonly DashboardMetric[];
  readonly points: readonly DashboardPoint[];
  readonly activities: readonly DashboardActivity[];
}
