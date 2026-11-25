import { ReportsAnalyticsDemoSource } from '../data-access/reports-analytics-demo';
import { buildReport, Category, DayActivity, Range, ReportsSnapshot } from './reports-analytics-view';

const dayMs = 86_400_000;

function activity(date: string, registrations = 0): DayActivity {
  return { date, registrations, welcomeAwards: 0, trips: [], hunters: [], games: [], ads: [] };
}

function snapshot(days: readonly DayActivity[], asOf = '2024-03-02T23:59:59Z'): ReportsSnapshot {
  return { asOf, days, campaigns: [], vouchers: [], history: [] };
}

function sum<T>(items: readonly T[], value: (item: T) => number): number {
  return items.reduce((total, item) => total + value(item), 0);
}

describe('Reports Analytics model', () => {
  const periods = [
    { range: 7, asOf: '2024-03-02', current: '25 Feb 2024 – 2 Mar 2024', previous: '18 Feb 2024 – 24 Feb 2024' },
    { range: 30, asOf: '2024-03-02', current: '2 Feb 2024 – 2 Mar 2024', previous: '3 Jan 2024 – 1 Feb 2024' },
    { range: 90, asOf: '2024-03-02', current: '4 Dec 2023 – 2 Mar 2024', previous: '5 Sept 2023 – 3 Dec 2023' },
    { range: 7, asOf: '2026-01-03', current: '28 Dec 2025 – 3 Jan 2026', previous: '21 Dec 2025 – 27 Dec 2025' },
    { range: 30, asOf: '2026-01-03', current: '5 Dec 2025 – 3 Jan 2026', previous: '5 Nov 2025 – 4 Dec 2025' },
    { range: 90, asOf: '2026-01-03', current: '6 Oct 2025 – 3 Jan 2026', previous: '8 Jul 2025 – 5 Oct 2025' },
  ] satisfies { range: Range; asOf: string; current: string; previous: string }[];

  it.each(periods)('uses adjacent inclusive $range-day UTC periods ending $asOf', ({ range, asOf, current, previous }) => {
    const timestamp = asOf + 'T23:59:59Z';
    const end = Date.parse(asOf);
    // Cover both periods and one day outside each edge. Increment each date in turn to test membership.
    const days = Array.from({ length: 2 * range + 2 }, (_, index) => {
      const offset = index - 2 * range;
      const date = new Date(end + offset * dayMs).toISOString().slice(0, 10);
      return activity(date, 1);
    });
    const baseline = buildReport(snapshot(days, timestamp), range, 'Users');
    expect(baseline.label).toBe(current);
    expect(baseline.comparisonLabel).toBe(previous);
    expect(baseline.rows[0]).toMatchObject({ current: String(range), previous: String(range) });

    for (const [index, day] of days.entries()) {
      const offset = index - 2 * range;
      const marked = days.map(item => item === day ? activity(day.date, 2) : item);
      const report = buildReport(snapshot(marked, timestamp), range, 'Users');
      expect(report.rows[0], day.date).toMatchObject({
        current: String(offset > -range && offset <= 0 ? range + 1 : range),
        previous: String(offset > -2 * range && offset <= -range ? range + 1 : range),
      });
    }
  });

  const buckets = [
    {
      range: 7, start: '2024-02-25',
      labels: ['25 Feb', '26 Feb', '27 Feb', '28 Feb', '29 Feb', '1 Mar', '2 Mar'],
      values: [1, 2, 3, 4, 5, 6, 7],
    },
    {
      range: 30, start: '2024-02-02',
      labels: ['2 Feb – 8 Feb', '9 Feb – 15 Feb', '16 Feb – 22 Feb', '23 Feb – 29 Feb', '1 Mar – 2 Mar'],
      values: [28, 77, 126, 175, 59],
    },
    {
      range: 90, start: '2023-12-04',
      labels: [
        '4 Dec – 10 Dec', '11 Dec – 17 Dec', '18 Dec – 24 Dec', '25 Dec – 31 Dec',
        '1 Jan – 7 Jan', '8 Jan – 14 Jan', '15 Jan – 21 Jan', '22 Jan – 28 Jan',
        '29 Jan – 4 Feb', '5 Feb – 11 Feb', '12 Feb – 18 Feb', '19 Feb – 25 Feb', '26 Feb – 2 Mar',
      ],
      values: [28, 77, 126, 175, 224, 273, 322, 371, 420, 469, 518, 567, 525],
    },
  ] satisfies { range: Range; start: string; labels: string[]; values: number[] }[];

  it.each(buckets)('assigns $range-day chart values to the exact UTC buckets', ({ range, start, labels, values }) => {
    const days = Array.from({ length: range }, (_, index) => {
      const date = new Date(Date.parse(start) + index * dayMs).toISOString().slice(0, 10);
      return activity(date, index + 1);
    });
    const { trends } = buildReport(snapshot(days), range, 'Users');
    expect(trends.users.map(point => point.label)).toEqual(labels);
    expect(trends.users.map(point => point.value)).toEqual(values);
  });

  const totals = [
    { range: 7, current: [63, 26, 8500, 3528], previous: [63, 25, 8700, 3087], tripCounts: [40, 7] },
    { range: 30, current: [271, 107, 37100, 7815], previous: [252, 103, 35200, 5250], tripCounts: [167, 30] },
    { range: 90, current: [763, 317, 106300, 15735], previous: [582, 313, 88200, 0], tripCounts: [497, 90] },
  ] satisfies { range: Range; current: number[]; previous: number[]; tripCounts: number[] }[];

  it.each(totals)('reconciles $range-day demo totals, comparison, charts and ad breakdowns', async ({
    range, current, previous, tripCounts,
  }) => {
    const report = buildReport(await new ReportsAnalyticsDemoSource().load(), range, 'Overview');
    const ids = ['registrations', 'completed', 'awarded', 'impressions'];
    const rows = ids.map(id => report.rows.find(row => row.id === id));
    const formatted = (values: number[]) => values.map((value, index) =>
      value.toLocaleString('en-US') + (ids[index] === 'awarded' ? ' Coins' : ''),
    );
    expect(rows.map(row => row?.current)).toEqual(formatted(current));
    expect(rows.map(row => row?.previous)).toEqual(formatted(previous));
    expect(ids.map(id => report.overview.find(metric => metric.id === id)?.value)).toEqual(current);
    expect([report.trends.users, report.trends.trips, report.trends.coins, report.trends.ads]
      .map(points => sum(points, point => point.value))).toEqual(current);
    expect([
      sum(report.trends.trips, point => point.started),
      sum(report.trends.trips, point => point.cancelled),
    ]).toEqual(tripCounts);
    expect(['started', 'cancelled'].map(id => report.rows.find(row => row.id === id)?.current))
      .toEqual(formatted(tripCounts));
    expect(sum(report.placements, item => item.impressions)).toBe(current[3]);
    expect(sum(report.campaigns, item => item.impressions)).toBe(current[3]);
  });

  const categoryRows = {
    Users: { registrations: '63' },
    Trips: { started: '40', completed: '26', cancelled: '7' },
    'Hunters & Games': {
      'hunter-submitted': '17', 'hunter-approved': '10', 'hunter-pending': '3', 'hunter-rejected': '4',
      'game-submitted': '14', 'game-approved': '7', 'game-pending': '7', wins: '2', archived: '0',
    },
    'Coins & Rewards': {
      awarded: '8,500 Coins', spent: '10,000 Coins', reserved: '20,000 Coins', welcome: '5,600 Coins',
      'hunter-reward': '2,000 Coins', 'game-reward': '700 Coins', 'winner-reward': '200 Coins',
    },
    'Advertisements & Campaigns': {
      impressions: '3,528', clicks: '113', ctr: '3.2%', 'campaign-total': '4', 'campaign-active': '2',
      'campaign-scheduled': '1', 'campaign-pending': '1', 'campaign-ads': '4',
    },
  };
  const categoryCases = [
    { category: 'Overview', historyIds: ['DEMO-R05', 'DEMO-R04', 'DEMO-R03', 'DEMO-R02', 'DEMO-R01'] },
    { category: 'Users', historyIds: ['DEMO-R01'] },
    { category: 'Trips', historyIds: ['DEMO-R02'] },
    { category: 'Hunters & Games', historyIds: ['DEMO-R03'] },
    { category: 'Coins & Rewards', historyIds: ['DEMO-R04'] },
    { category: 'Advertisements & Campaigns', historyIds: ['DEMO-R05'] },
  ] satisfies { category: Category; historyIds: string[] }[];

  it.each(categoryCases)('scopes summary rows, section values and history to $category', async ({ category, historyIds }) => {
    const demo = await new ReportsAnalyticsDemoSource().load();
    const groups = category === 'Overview' ? Object.entries(categoryRows) : [[category, categoryRows[category]] as const];
    const expected = groups.flatMap(([group, values]) =>
      Object.entries(values).map(([id, current]) => ({ category: group, id, current })),
    );
    const report = buildReport(demo, 7, category);
    expect(report.rows.map(({ category, id, current }) => ({ category, id, current }))).toEqual(expected);
    expect(report.sections.flatMap(section => section.stats.map(stat => ({
      category: section.category, id: stat.id, current: stat.display,
    })))).toEqual(expected);
    expect(report.history.map(event => event.id)).toEqual(historyIds.filter(id => id !== 'DEMO-R01'));
    expect(buildReport(demo, 30, category).history.map(event => event.id)).toEqual(historyIds);
  });

  it('shows unavailable current rows and empty trends when only the comparison period has records', () => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(Date.UTC(2024, 1, 18 + index)).toISOString().slice(0, 10);
      return activity(date, 3);
    });
    const report = buildReport(snapshot(days), 7, 'Overview');
    expect(report.hasData).toBe(false);
    expect(report.rows.every(row => row.current === 'Unavailable' && row.change === 'Unavailable')).toBe(true);
    expect(report.rows.find(row => row.id === 'registrations')?.previous).toBe('21');
    expect(report.trends).toEqual({ users: [], trips: [], coins: [], ads: [] });
  });

  it('shows explicit zero values when both periods contain zero-valued records', () => {
    const days = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(Date.UTC(2024, 1, 18 + index)).toISOString().slice(0, 10);
      return activity(date);
    });
    const report = buildReport(snapshot(days), 7, 'Users');
    expect(report.hasData).toBe(true);
    expect(report.rows[0]).toMatchObject({ current: '0', previous: '0', change: '0.0%' });
    expect(report.trends.users.map(point => point.value)).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it('shows an unavailable comparison when the current period has records and the preceding period has none', () => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(Date.UTC(2024, 1, 25 + index)).toISOString().slice(0, 10);
      return activity(date, 2);
    });
    const report = buildReport(snapshot(days), 7, 'Users');
    expect(report.hasData).toBe(true);
    expect(report.rows[0]).toMatchObject({ current: '14', previous: 'Unavailable', change: 'Unavailable' });
  });
});
