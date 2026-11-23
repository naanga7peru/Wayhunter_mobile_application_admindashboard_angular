import { inject, Injectable } from '@angular/core';
import { AdvertisementsDemoSource } from '../advertisements/data-access/advertisements-demo';
import { Advertisement } from '../advertisements/models/advertisements-view';

export const campaignStatuses = ['Active', 'Scheduled', 'Pending Review', 'Draft', 'Ended'] as const;
export const campaignCategories = ['Sponsored game', 'District pass', 'Verified mission', 'Promoted place'] as const;

type CampaignStatus = typeof campaignStatuses[number];
type CampaignCategory = typeof campaignCategories[number];

export interface Campaign {
  readonly id: string;
  readonly title: string;
  readonly sponsor: string;
  readonly category: CampaignCategory;
  readonly status: CampaignStatus;
  readonly district: string;
  readonly audience: string;
  readonly start: string;
  readonly end: string;
  readonly summary: string;
  readonly reviewNote: string;
  readonly adIds: readonly string[];
  readonly impressions: number;
  readonly clicks: number;
}

export interface CampaignAuditEvent {
  readonly id: string;
  readonly campaignId: string;
  readonly event: string;
  readonly actor: string;
  readonly at: string;
  readonly note: string;
}

export interface CampaignsSnapshot {
  readonly asOf: string;
  readonly campaigns: readonly Campaign[];
  readonly ads: readonly Advertisement[];
  readonly history: readonly CampaignAuditEvent[];
}

const campaigns: readonly Campaign[] = [
  {
    id: 'CMP-201', title: 'Ridge Trail Spotlight', sponsor: 'Demo Ridge Outfitters',
    category: 'Promoted place', status: 'Active', district: 'Kandy', audience: 'Travelers exploring Kandy',
    start: '2026-11-10', end: '2026-12-12', impressions: 3600, clicks: 144, adIds: ['AD-101'],
    summary: 'Explore a sample collection of ridge walks and viewpoints.',
    reviewNote: 'Sponsor disclosure and destination copy reviewed in the sample.',
  },
  {
    id: 'CMP-202', title: 'Coastal Discovery Pass', sponsor: 'Demo Coast Collective',
    category: 'District pass', status: 'Active', district: 'Galle', audience: 'Travelers exploring Galle',
    start: '2026-11-03', end: '2026-12-01', impressions: 2400, clicks: 96, adIds: ['AD-102'],
    summary: 'Browse an illustrative itinerary of coastal walks.',
    reviewNote: 'The sample itinerary and district label were reviewed.',
  },
  {
    id: 'CMP-203', title: 'Forest Loop Challenge', sponsor: 'Demo Forest Lab',
    category: 'Sponsored game', status: 'Pending Review', district: 'Matale', audience: 'Players browsing Matale',
    start: '2026-12-01', end: '2026-12-21', impressions: 0, clicks: 0, adIds: ['AD-103'],
    summary: 'Preview a sponsored discovery challenge along a fictional forest loop.',
    reviewNote: 'Sample review is waiting for a creative and sponsor disclosure check.',
  },
  {
    id: 'CMP-204', title: 'Highland Sunrise Series', sponsor: 'Demo Ridge Outfitters',
    category: 'Promoted place', status: 'Scheduled', district: 'Nuwara Eliya', audience: 'Travelers exploring Nuwara Eliya',
    start: '2026-12-02', end: '2026-12-23', impressions: 0, clicks: 0, adIds: ['AD-105'],
    summary: 'Discover a sample set of highland viewpoints for early walks.',
    reviewNote: 'A future display window is recorded in the sample.',
  },
  {
    id: 'CMP-205', title: 'Canopy Field Journal', sponsor: 'Demo Canopy Studio',
    category: 'Verified mission', status: 'Draft', district: 'Ratnapura', audience: 'Hunters exploring Ratnapura',
    start: '2026-12-10', end: '2026-12-28', impressions: 0, clicks: 0, adIds: [],
    summary: 'Preview a fictional mission about documenting trail observations.',
    reviewNote: 'The sample brief is awaiting submission.',
  },
  {
    id: 'CMP-206', title: 'Autumn Trail Map', sponsor: 'Demo Ridge Outfitters',
    category: 'District pass', status: 'Ended', district: 'Kandy', audience: 'Travelers exploring Kandy',
    start: '2026-10-05', end: '2026-10-31', impressions: 1000, clicks: 60, adIds: ['AD-110'],
    summary: 'Browse an example of a past seasonal trail promotion.',
    reviewNote: 'The sample display window has ended.',
  },
];

const history: readonly CampaignAuditEvent[] = [
  { id: 'CAM-E04', campaignId: 'CMP-203', event: 'Submitted for review', actor: 'Demo editor',
    at: '2026-11-22T08:40:00Z', note: 'Sample creative and district attached.' },
  { id: 'CAM-E03', campaignId: 'CMP-204', event: 'Schedule recorded', actor: 'Demo reviewer',
    at: '2026-11-20T10:00:00Z', note: 'December window recorded in the fixture.' },
  { id: 'CAM-E02', campaignId: 'CMP-201', event: 'Review recorded', actor: 'Demo reviewer',
    at: '2026-11-09T09:45:00Z', note: 'Sample sponsor disclosure reviewed.' },
  { id: 'CAM-E01', campaignId: 'CMP-206', event: 'Window ended', actor: 'Demo scheduler',
    at: '2026-11-01T00:00:00Z', note: 'Sample window closed.' },
];

@Injectable({ providedIn: 'root' })
export class CampaignsDemoSource {
  private readonly advertisements = inject(AdvertisementsDemoSource);

  async load(): Promise<CampaignsSnapshot> {
    const { ads } = await this.advertisements.load();
    return { asOf: '2026-11-23', campaigns, ads, history };
  }
}
