import { clickThroughRate } from '../../advertisements/models/advertisements-view';

export const categories = ['Overview', 'Users', 'Trips', 'Hunters & Games', 'Coins & Rewards', 'Advertisements & Campaigns'] as const;
export type Category = typeof categories[number];
type ReportCategory = Exclude<Category, 'Overview'>;
export const ranges = [7, 30, 90] as const;
export type Range = typeof ranges[number];

export interface DayActivity {
  readonly date: string;
  readonly registrations: number;
  readonly welcomeAwards: number;
  readonly trips: readonly Trip[];
  readonly hunters: readonly ('Approved' | 'Pending Review' | 'Rejected')[];
  readonly games: readonly Game[];
  readonly ads: readonly AdDelivery[];
}

interface Trip {
  readonly started: boolean;
  readonly validFinish: boolean;
  readonly cancelled: boolean;
}

interface Game {
  readonly creation: 'Approved' | 'Pending Review';
  // Each game record can contain one verified winner and any number of unverified proofs.
  readonly winnerVerified: boolean;
}

interface AdDelivery {
  readonly adId: string;
  readonly placement: 'Home banner' | 'Traveler' | 'Game';
  readonly campaignId: string;
  readonly impressions: number;
  readonly clicks: number;
}

export interface CampaignRecord {
  readonly id: string;
  readonly name: string;
  readonly since: string;
  readonly endedAt?: string;
  readonly status: 'Active' | 'Scheduled' | 'Pending Review' | 'Draft' | 'Ended';
  readonly adIds: readonly string[];
}

export interface VoucherRecord {
  readonly requested: string;
  readonly resolved?: { readonly date: string; readonly status: 'Approved' | 'Rejected' | 'Cancelled' };
}

export interface ReportEvent {
  readonly id: string;
  readonly category: ReportCategory;
  readonly description: string;
  readonly at: string;
  readonly source: string;
  readonly status: string;
}

export interface ReportsSnapshot {
  readonly asOf: string;
  readonly days: readonly DayActivity[];
  readonly campaigns: readonly CampaignRecord[];
  readonly vouchers: readonly VoucherRecord[];
  readonly history: readonly ReportEvent[];
}

interface Metric {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly unit?: 'Coins' | '%';
}

export interface ReportRow {
  readonly id: string;
  readonly category: ReportCategory;
  readonly section: string;
  readonly label: string;
  readonly current: string;
  readonly previous: string;
  readonly change: string;
  readonly period: string;
  readonly comparisonPeriod: string;
  readonly status: string;
}

export interface TrendPoint { readonly label: string; readonly value: number; readonly started: number; readonly cancelled: number; }

const utcDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const utcShortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
export const reportTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
const countFormat = new Intl.NumberFormat('en-US');
const rateFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

export function shiftDate(day: string, days: number): string {
  const date = new Date(day + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

interface Period { readonly start: string; readonly end: string; }

function periodEnding(end: string, days: Range): Period {
  return { start: shiftDate(end, 1 - days), end };
}

function inPeriod(day: string, period: Period): boolean {
  return period.start <= day && day <= period.end;
}

function periodLabel(period: Period): string {
  return utcDate.format(new Date(period.start)) + ' – ' + utcDate.format(new Date(period.end));
}

function metric(id: string, label: string, value: number, unit?: Metric['unit']): Metric {
  return { id, label, value, unit };
}

function count<T>(rows: readonly T[], condition: (row: T) => boolean): number {
  return rows.filter(condition).length;
}

function adTotals(rows: readonly AdDelivery[]) {
  const impressions = rows.reduce((total, row) => total + row.impressions, 0);
  const clicks = rows.reduce((total, row) => total + row.clicks, 0);
  return { impressions, clicks, ctr: clickThroughRate(clicks, impressions) };
}

function dayCounts(day: DayActivity) {
  const huntersApproved = count(day.hunters, status => status === 'Approved');
  const gamesApproved = count(day.games, game => game.creation === 'Approved');
  const wins = count(day.games, game => game.creation === 'Approved' && game.winnerVerified);
  return {
    registrations: day.registrations,
    welcomeAwards: day.welcomeAwards,
    started: count(day.trips, trip => trip.started),
    cancelled: count(day.trips, trip => trip.cancelled),
    completedTrips: count(day.trips, trip => trip.started && trip.validFinish && !trip.cancelled),
    huntersApproved, gamesApproved, wins,
    coins: day.welcomeAwards * 100 + huntersApproved * 200 + gamesApproved * 100 + wins * 100,
    impressions: adTotals(day.ads).impressions,
  };
}

function collect(snapshot: ReportsSnapshot, days: readonly DayActivity[], period: Period) {
  const totals = days.map(dayCounts);
  const sum = (key: keyof ReturnType<typeof dayCounts>) => totals.reduce((total, day) => total + day[key], 0);
  const hunters = days.flatMap(day => day.hunters);
  const games = days.flatMap(day => day.games);
  const ads = days.flatMap(day => day.ads);
  const delivery = adTotals(ads);
  const deliveredCampaigns = new Set(ads.map(row => row.campaignId));
  const campaigns = snapshot.campaigns.filter(campaign =>
    inPeriod(campaign.since, period) || deliveredCampaigns.has(campaign.id),
  ).map(campaign => ({
    ...campaign,
    status: campaign.endedAt && campaign.endedAt > period.end ? 'Active' : campaign.status,
  }));
  const spent = count(snapshot.vouchers, voucher =>
    voucher.resolved?.status === 'Approved' && inPeriod(voucher.resolved.date, period));
  const reserved = count(snapshot.vouchers, voucher =>
    voucher.requested <= period.end && (!voucher.resolved || voucher.resolved.date > period.end));
  const archived = days.filter(day => shiftDate(day.date, 30) <= period.end)
    .reduce((total, day) => total + count(day.games, game => game.creation === 'Approved'), 0);

  return {
    users: [metric('registrations', 'Registered users', sum('registrations'))],
    trips: [
      metric('started', 'Started trips', sum('started')),
      metric('completed', 'Completed trips', sum('completedTrips')),
      metric('cancelled', 'Cancelled trips', sum('cancelled')),
    ],
    hunters: [
      metric('hunter-submitted', 'Submitted Hunter records', hunters.length),
      metric('hunter-approved', 'Approved Hunter records', sum('huntersApproved')),
      metric('hunter-pending', 'Hunter records pending review', count(hunters, status => status === 'Pending Review')),
      metric('hunter-rejected', 'Rejected Hunter records', count(hunters, status => status === 'Rejected')),
    ],
    games: [
      metric('game-submitted', 'Submitted games', games.length),
      metric('game-approved', 'Approved games', sum('gamesApproved')),
      metric('game-pending', 'Games pending review', count(games, game => game.creation === 'Pending Review')),
      metric('wins', 'Verified wins', sum('wins')),
      metric('archived', 'Approved games archived by period end', archived),
    ],
    coins: [
      metric('awarded', 'Coins awarded', sum('coins'), 'Coins'),
      metric('spent', 'Finalized Coins spent', spent * 10_000, 'Coins'),
      metric('reserved', 'Reserved Coins at period end', reserved * 10_000, 'Coins'),
      metric('welcome', 'Welcome awards', sum('welcomeAwards') * 100, 'Coins'),
      metric('hunter-reward', 'Hunter approval awards', sum('huntersApproved') * 200, 'Coins'),
      metric('game-reward', 'Game creation awards', sum('gamesApproved') * 100, 'Coins'),
      metric('winner-reward', 'Verified winner awards', sum('wins') * 100, 'Coins'),
    ],
    ads: [
      metric('impressions', 'Advertisement impressions', delivery.impressions),
      metric('clicks', 'Advertisement clicks', delivery.clicks),
      metric('ctr', 'Advertisement CTR', delivery.ctr, '%'),
    ],
    campaigns: [
      metric('campaign-total', 'Total sample campaigns', campaigns.length),
      metric('campaign-active', 'Active campaigns', count(campaigns, campaign => campaign.status === 'Active')),
      metric('campaign-scheduled', 'Scheduled campaigns', count(campaigns, campaign => campaign.status === 'Scheduled')),
      metric('campaign-pending', 'Pending reviews', count(campaigns, campaign => campaign.status === 'Pending Review')),
      metric('campaign-ads', 'Unique associated advertisements', new Set(campaigns.flatMap(campaign => campaign.adIds)).size),
    ],
    placements: [...new Set(ads.map(row => row.placement))].map(placement => ({
      label: placement, ...adTotals(ads.filter(row => row.placement === placement)),
    })),
    comparison: campaigns.map(campaign => ({
      label: campaign.name, status: campaign.status, ads: new Set(campaign.adIds).size,
      ...adTotals(ads.filter(row => row.campaignId === campaign.id)),
    })),
  };
}

export function changeLabel(current: number, previous: number, rate = false): string {
  if (rate) {
    const change = current - previous;
    return (change > 0 ? '+' : '') + rateFormat.format(change) + ' pp';
  }
  if (previous === 0) return current === 0 ? '0.0%' : 'Unavailable (zero baseline)';
  const change = (current - previous) / previous * 100;
  return (change > 0 ? '+' : '') + rateFormat.format(change) + '%';
}

function formatMetric(metric: Metric): string {
  if (metric.unit === '%') return rateFormat.format(metric.value) + '%';
  return countFormat.format(metric.value) + (metric.unit ? ' ' + metric.unit : '');
}

function trend(days: readonly DayActivity[], period: Period, length: Range, key: keyof ReturnType<typeof dayCounts>): TrendPoint[] {
  if (!days.length) return [];
  const totals = new Map(days.map(day => [day.date, dayCounts(day)]));
  const step = length === 7 ? 1 : 7;
  return Array.from({ length: Math.ceil(length / step) }, (_, index) => {
    const start = shiftDate(period.start, index * step);
    const size = Math.min(step, length - index * step);
    const end = shiftDate(start, size - 1);
    const label = utcShortDate.format(new Date(start)) +
      (size === 1 ? '' : ' – ' + utcShortDate.format(new Date(end)));
    const bucket = Array.from({ length: size }, (_, offset) => totals.get(shiftDate(start, offset)));
    const sum = (field: keyof ReturnType<typeof dayCounts>) =>
      bucket.reduce((total, day) => total + (day?.[field] ?? 0), 0);
    return { label, value: sum(key), started: sum('started'), cancelled: sum('cancelled') };
  });
}

export function buildReport(snapshot: ReportsSnapshot, range: Range, category: Category) {
  const current = periodEnding(snapshot.asOf.slice(0, 10), range);
  const previous = periodEnding(shiftDate(current.start, -1), range);
  const currentDays = snapshot.days.filter(day => inPeriod(day.date, current));
  const previousDays = snapshot.days.filter(day => inPeriod(day.date, previous));
  const now = collect(snapshot, currentDays, current);
  const before = collect(snapshot, previousDays, previous);
  const label = periodLabel(current);
  const comparisonLabel = periodLabel(previous);
  const groups = [
    { category: 'Users', heading: 'User Growth', key: 'users' },
    { category: 'Trips', heading: 'Trip Analytics', key: 'trips' },
    { category: 'Hunters & Games', heading: 'Hunter Analytics', key: 'hunters' },
    { category: 'Hunters & Games', heading: 'Game Analytics', key: 'games' },
    { category: 'Coins & Rewards', heading: 'Coins & Rewards', key: 'coins' },
    { category: 'Advertisements & Campaigns', heading: 'Ads Performance', key: 'ads' },
    { category: 'Advertisements & Campaigns', heading: 'Campaigns Report', key: 'campaigns' },
  ] as const;
  const sections = groups.filter(group => category === 'Overview' || category === group.category).map(group => ({
    ...group,
    stats: now[group.key].map(stat => ({ ...stat, display: formatMetric(stat) })),
  }));
  const rows = sections.flatMap(section => section.stats.map((stat, index): ReportRow => {
    const old = before[section.key][index];
    return {
      id: stat.id, section: section.heading, category: section.category, label: stat.label,
      current: currentDays.length ? stat.display : 'Unavailable',
      previous: previousDays.length ? formatMetric(old) : 'Unavailable',
      change: currentDays.length && previousDays.length ? changeLabel(stat.value, old.value, stat.unit === '%') : 'Unavailable',
      period: label, comparisonPeriod: comparisonLabel, status: 'Fictional demo data',
    };
  }));
  return {
    label, comparisonLabel, sections, rows,
    hasData: currentDays.length > 0,
    overview: [now.users[0], now.trips[1], now.hunters[1], now.games[1], now.coins[0], now.ads[0]],
    trends: {
      users: trend(currentDays, current, range, 'registrations'),
      trips: trend(currentDays, current, range, 'completedTrips'),
      coins: trend(currentDays, current, range, 'coins'),
      ads: currentDays.some(day => day.ads.length) ? trend(currentDays, current, range, 'impressions') : [],
    },
    placements: now.placements,
    campaigns: now.comparison,
    history: snapshot.history.filter(event =>
      (category === 'Overview' || event.category === category) && inPeriod(event.at.slice(0, 10), current)),
  };
}
