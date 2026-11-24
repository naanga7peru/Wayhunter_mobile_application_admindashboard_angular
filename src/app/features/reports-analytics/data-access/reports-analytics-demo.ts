import { Injectable } from '@angular/core';
import { DayActivity, ReportsSnapshot, shiftDate } from '../models/reports-analytics-view';

const asOf = '2026-11-23T23:59:59Z';
const days = Array.from({ length: 180 }, (_, index): DayActivity => {
  const date = shiftDate(asOf.slice(0, 10), index - 179);
  const registrations = 3 + index % 7 + Math.floor(index / 45);
  return {
    date,
    registrations,
    welcomeAwards: registrations - 1,
    trips: [
      ...Array.from({ length: 2 + index % 4 }, () => ({ started: true, validFinish: true, cancelled: false })),
      { started: true, validFinish: false, cancelled: true },
      { started: true, validFinish: false, cancelled: false },
      { started: false, validFinish: true, cancelled: false },
    ],
    hunters: index % 2 === 0
      ? ['Approved', 'Approved', 'Pending Review']
      : ['Approved', 'Rejected'],
    games: [
      { creation: 'Approved', winnerVerified: index % 3 === 0 },
      { creation: 'Pending Review', winnerVerified: false },
    ],
    ads: date >= '2026-11-10' ? [
      { adId: 'AD-101', placement: 'Home banner', campaignId: 'CMP-201', impressions: 240 + index % 20 * 5, clicks: 8 + index % 5 },
      { adId: 'AD-102', placement: 'Traveler', campaignId: 'CMP-202', impressions: 140 + index % 15 * 4, clicks: 4 + index % 4 },
    ] : date >= '2026-09-10' && date <= '2026-10-31' ? [
      { adId: 'AD-110', placement: 'Home banner', campaignId: 'CMP-206', impressions: 150 + index % 6 * 10, clicks: 4 + index % 4 },
    ] : [],
  };
});

// Reporting fixtures borrow ADM-14 labels. The activity figures form a separate sample.
const snapshot: ReportsSnapshot = {
  asOf, days,
  campaigns: [
    { id: 'CMP-201', name: 'Ridge Trail Spotlight', since: '2026-11-10', status: 'Active', adIds: ['AD-101'] },
    { id: 'CMP-202', name: 'Coastal Discovery Pass', since: '2026-11-10', status: 'Active', adIds: ['AD-102'] },
    { id: 'CMP-203', name: 'Forest Loop Challenge', since: '2026-11-20', status: 'Pending Review', adIds: ['AD-103'] },
    { id: 'CMP-204', name: 'Highland Sunrise Series', since: '2026-11-21', status: 'Scheduled', adIds: ['AD-105', 'AD-101'] },
    { id: 'CMP-205', name: 'Canopy Field Journal', since: '2026-11-07', status: 'Draft', adIds: [] },
    { id: 'CMP-206', name: 'Autumn Trail Map', since: '2026-09-10', endedAt: '2026-10-31', status: 'Ended', adIds: ['AD-110'] },
  ],
  // Requests represent eligible sample accounts; approval is the only finalized debit.
  vouchers: [
    { requested: '2026-08-19', resolved: { date: '2026-09-08', status: 'Approved' } },
    { requested: '2026-10-31', resolved: { date: '2026-11-18', status: 'Approved' } },
    { requested: '2026-11-17', resolved: { date: '2026-11-20', status: 'Rejected' } },
    { requested: '2026-11-18', resolved: { date: '2026-11-22', status: 'Cancelled' } },
    { requested: '2026-11-21' },
    { requested: '2026-11-23' },
  ],
  history: [
    { id: 'DEMO-R05', category: 'Advertisements & Campaigns', description: 'Placement comparison added to sample', at: '2026-11-23T10:00:00Z', source: 'Local fixture', status: 'Sample' },
    { id: 'DEMO-R04', category: 'Coins & Rewards', description: 'Reservation example recorded', at: '2026-11-21T09:20:00Z', source: 'Local fixture', status: 'Sample' },
    { id: 'DEMO-R03', category: 'Hunters & Games', description: 'Verification example included', at: '2026-11-19T11:45:00Z', source: 'Local fixture', status: 'Sample' },
    { id: 'DEMO-R02', category: 'Trips', description: 'Completion trend sample prepared', at: '2026-11-18T09:00:00Z', source: 'Local fixture', status: 'Sample' },
    { id: 'DEMO-R01', category: 'Users', description: 'Registration sample prepared', at: '2026-11-08T14:30:00Z', source: 'Local fixture', status: 'Sample' },
  ],
};

@Injectable({ providedIn: 'root' })
export class ReportsAnalyticsDemoSource {
  async load(): Promise<ReportsSnapshot> {
    return snapshot;
  }
}
