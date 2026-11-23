import { Injectable } from '@angular/core';
import { Advertisement, AdvertisementsSnapshot } from '../models/advertisements-view';

const ads = [
  { id: 'AD-101', title: 'Ridge Weekend', advertiser: 'Demo Ridge Outfitters', placement: 'Home banner', creative: 'Banner',
    start: '2026-11-10', end: '2026-12-12', status: 'Active', description: 'A weekend trail suggestion for the WayHunter Home screen.',
    notes: 'Fictional creative marked ready for display in this fixture.', updatedAt: '2026-11-10T09:45:00Z', impressions: 3600, clicks: 144 },
  { id: 'AD-102', title: 'Coastal Walks', advertiser: 'Demo Coast Collective', placement: 'Traveler', creative: 'Square image',
    start: '2026-11-03', end: '2026-12-01', status: 'Active', description: 'An illustrated coastal route tile for the Traveler screen.',
    notes: 'Sample image and sponsor label reviewed.', updatedAt: '2026-11-03T11:00:00Z', impressions: 2400, clicks: 96 },
  { id: 'AD-103', title: 'Forest Loop Challenge', advertiser: 'Demo Forest Lab', placement: 'Game', creative: 'Promotional card',
    start: '2026-12-01', end: '2026-12-21', status: 'Pending Review', description: 'A sample challenge promotion featuring a forest loop.',
    notes: 'Awaiting a sample creative review.', submittedAt: '2026-11-22T08:40:00Z', updatedAt: '2026-11-22T08:40:00Z', impressions: 0, clicks: 0 },
  { id: 'AD-104', title: 'Field Notes Weekend', advertiser: 'Demo Canopy Studio', placement: 'Hunter', creative: 'Square image',
    start: '2026-12-05', end: '2026-12-24', status: 'Pending Review', description: 'A square creative about trail observations.',
    notes: 'Review the example sponsor label and mobile legibility.', submittedAt: '2026-11-21T14:00:00Z', updatedAt: '2026-11-21T14:00:00Z', impressions: 0, clicks: 0 },
  { id: 'AD-105', title: 'Highland Sunrise', advertiser: 'Demo Ridge Outfitters', placement: 'Home banner', creative: 'Banner',
    start: '2026-12-02', end: '2026-12-23', status: 'Scheduled', description: 'A sample banner about early-morning hill walks.',
    notes: 'Future window recorded in the fixture.', updatedAt: '2026-11-20T10:00:00Z', impressions: 0, clicks: 0 },
  { id: 'AD-106', title: 'Island Picnic Stops', advertiser: 'Demo Coast Collective', placement: 'Traveler', creative: 'Promotional card',
    start: '2026-11-02', end: '2026-11-30', status: 'Paused', description: 'A travel card featuring fictional picnic stops.',
    notes: 'Sample delivery paused while creative is reviewed.', updatedAt: '2026-11-19T12:10:00Z', impressions: 1000, clicks: 20 },
  { id: 'AD-107', title: 'Creekside Discovery', advertiser: 'Demo Forest Lab', placement: 'Hunter', creative: 'Banner',
    start: '2026-12-10', end: '2026-12-28', status: 'Draft', description: 'A draft creative about creekside viewpoints.',
    notes: 'Draft placeholder awaiting creative copy.', updatedAt: '2026-11-17T09:00:00Z', impressions: 0, clicks: 0 },
  { id: 'AD-108', title: 'Pocket Trail Guide', advertiser: 'Demo Canopy Studio', placement: 'Traveler', creative: 'Square image',
    start: '2026-12-12', end: '2026-12-30', status: 'Approved', description: 'A square sample promoting a compact route guide.',
    notes: 'Sample review is complete; the proposed date window is awaiting scheduling.', updatedAt: '2026-11-16T13:10:00Z', impressions: 0, clicks: 0 },
  { id: 'AD-109', title: 'River Route Teaser', advertiser: 'Demo Forest Lab', placement: 'Game', creative: 'Promotional card',
    start: '2026-11-28', end: '2026-12-07', status: 'Rejected', description: 'A fictional river-themed discovery promotion.',
    notes: 'Sponsor label was missing from the sample creative.', updatedAt: '2026-11-15T08:30:00Z', impressions: 0, clicks: 0 },
  { id: 'AD-110', title: 'Autumn Trail Map', advertiser: 'Demo Ridge Outfitters', placement: 'Home banner', creative: 'Banner',
    start: '2026-10-05', end: '2026-10-31', status: 'Expired', description: 'A seasonal sample banner from the previous window.',
    notes: 'The sample delivery window ended.', updatedAt: '2026-11-01T00:00:00Z', impressions: 1000, clicks: 60 },
] as const satisfies readonly Advertisement[];

const sample: AdvertisementsSnapshot = {
  asOf: '2026-11-23T23:59:59Z',
  ads,
  history: [
    { id: 'EV-01', adId: 'AD-103', event: 'Submitted for review', previous: 'Draft', next: 'Pending Review', reviewer: 'Demo submitter', at: ads[2].updatedAt, notes: ads[2].notes },
    { id: 'EV-02', adId: 'AD-105', event: 'Schedule recorded', previous: 'Approved', next: 'Scheduled', reviewer: 'Demo reviewer A', at: ads[4].updatedAt, notes: ads[4].notes },
    { id: 'EV-03', adId: 'AD-106', event: 'Delivery paused', previous: 'Active', next: 'Paused', reviewer: 'Demo reviewer B', at: ads[5].updatedAt, notes: ads[5].notes },
    { id: 'EV-04', adId: 'AD-109', event: 'Review recorded', previous: 'Pending Review', next: 'Rejected', reviewer: 'Demo reviewer A', at: ads[8].updatedAt, notes: ads[8].notes },
  ],
};

@Injectable({ providedIn: 'root' })
export class AdvertisementsDemoSource {
  async load(): Promise<AdvertisementsSnapshot> {
    return sample;
  }
}
