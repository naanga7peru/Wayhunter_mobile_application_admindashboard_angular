export const adStatuses = ['Draft', 'Pending Review', 'Approved', 'Active', 'Scheduled', 'Paused', 'Rejected', 'Expired'] as const;
export const creativeTypes = ['Banner', 'Square image', 'Promotional card'] as const;
export const placements = ['Home banner', 'Traveler', 'Hunter', 'Game'] as const;

export type AdStatus = typeof adStatuses[number];
export type CreativeType = typeof creativeTypes[number];

export interface Advertisement {
  readonly id: string;
  readonly title: string;
  readonly advertiser: string;
  readonly placement: typeof placements[number];
  readonly creative: CreativeType;
  readonly start: string;
  readonly end: string;
  readonly status: AdStatus;
  readonly description: string;
  readonly notes: string;
  readonly updatedAt: string;
  readonly submittedAt?: string;
  readonly impressions: number;
  readonly clicks: number;
}

export interface AdAuditEvent {
  readonly id: string;
  readonly adId: string;
  readonly event: string;
  readonly previous: AdStatus;
  readonly next: AdStatus;
  readonly reviewer: string;
  readonly at: string;
  readonly notes: string;
}

export interface AdvertisementsSnapshot {
  readonly asOf: string;
  readonly ads: readonly Advertisement[];
  readonly history: readonly AdAuditEvent[];
}

export function clickThroughRate(clicks: number, impressions: number): number {
  return impressions > 0 ? (clicks / impressions) * 100 : 0;
}
