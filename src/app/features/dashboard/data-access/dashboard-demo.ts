import { DashboardActivity, DashboardRange, DashboardView } from '../models/dashboard-view';

const dayMs = 86_400_000;
const sampleEnd = Date.UTC(2026, 10, 22);
const shortDate = new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const dateTime = new Intl.DateTimeFormat('en-GB', {
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
});

const days = Array.from({ length: 180 }, (_, index) => ({
  date: sampleEnd - (179 - index) * dayMs,
  trips: 19 + Math.floor(index / 7) + (index * 7 % 19),
  newUsers: 7 + Math.floor(index / 9) + (index * 5 % 13),
  hunters: Number(index % 4 === 3),
  hazards: Number(index % 9 === 7),
  redemptions: Number(index % 5 === 0),
  campaigns: Number(index % 6 === 0),
  vouchers: Number(index % 3 !== 0),
}));

const events: readonly (Omit<DashboardActivity, 'id' | 'dateTime'> & { daysAgo: number; hour: number })[] = [
  { daysAgo: 0, hour: 10, module: 'Hunter Verification', activity: 'Trail evidence submitted', status: 'Pending review' },
  { daysAgo: 1, hour: 14, module: 'Hazards', activity: 'Trail obstruction reported', status: 'Pending review' },
  { daysAgo: 2, hour: 9, module: 'Redemptions', activity: 'Demo voucher issued', status: 'Completed' },
  { daysAgo: 4, hour: 12, module: 'Campaigns', activity: 'Hill Country campaign scheduled', status: 'Scheduled' },
  { daysAgo: 9, hour: 11, module: 'Trips & Routes', activity: 'Route history reviewed', status: 'Completed' },
  { daysAgo: 19, hour: 15, module: 'Redemptions', activity: 'Voucher request queued', status: 'Pending review' },
  { daysAgo: 37, hour: 13, module: 'Campaigns', activity: 'Coastal trails campaign scheduled', status: 'Scheduled' },
  { daysAgo: 64, hour: 9, module: 'Places', activity: 'Place listing updated', status: 'Completed' },
];

type Count = Exclude<keyof (typeof days)[number], 'date'>;

function sum(records: typeof days, key: Count): number {
  return records.reduce((total, record) => total + record[key], 0);
}

export function getDashboardDemo(range: DashboardRange): DashboardView {
  const length = Number(range);
  const selected = days.slice(-length);
  const previous = days.slice(-2 * length, -length);
  const reviewRequests = sum(selected, 'hunters') + sum(selected, 'hazards') + sum(selected, 'redemptions');
  const previousReviewRequests = sum(previous, 'hunters') + sum(previous, 'hazards') + sum(previous, 'redemptions');
  const newUsers = sum(selected, 'newUsers');
  const totalUsers = 12_846;
  const trips = sum(selected, 'trips');
  const campaigns = sum(selected, 'campaigns');
  const vouchers = sum(selected, 'vouchers');
  const bucketCount = length === 7 ? 7 : 6;
  const bucketSize = length / bucketCount;

  return {
    period: shortDate.format(selected[0].date) + ' – ' + shortDate.format(sampleEnd) + ' 2026',
    metrics: [
      { label: 'Sample total users', value: totalUsers, detail: 'Accounts at period end', change: newUsers },
      { label: 'Sample trips', value: trips, detail: 'Trips in this period', change: trips - sum(previous, 'trips') },
      { label: 'Sample review requests opened', value: reviewRequests, detail: 'Requests opened in this period', change: reviewRequests - previousReviewRequests },
      { label: 'Sample campaign starts', value: campaigns, detail: 'Campaigns started in this period', change: campaigns - sum(previous, 'campaigns') },
      { label: 'Sample vouchers issued', value: vouchers, detail: 'Demo vouchers issued in this period', change: vouchers - sum(previous, 'vouchers') },
    ],
    points: Array.from({ length: bucketCount }, (_, index) => {
      const bucket = selected.slice(index * bucketSize, (index + 1) * bucketSize);
      const start = shortDate.format(bucket[0].date);
      return {
        label: bucket.length === 1 ? start : start + ' – ' + shortDate.format(bucket[bucket.length - 1].date),
        trips: sum(bucket, 'trips'),
        newUsers: sum(bucket, 'newUsers'),
      };
    }),
    activities: events.filter(event => event.daysAgo < length).map(event => ({
      id: event.daysAgo,
      dateTime: dateTime.format(sampleEnd - event.daysAgo * dayMs + event.hour * 3_600_000),
      module: event.module,
      activity: event.activity,
      status: event.status,
    })),
  };
}
