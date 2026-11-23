import { Injectable } from '@angular/core';
import { RedemptionsSnapshot } from '../models/redemptions-view';

export const redemptionTerms = { coins: 10_000, lkr: 100, minimum: 10_100 } as const;

const sample: RedemptionsSnapshot = {
  asOf: '2026-11-23T23:59:59Z',
  requests: [
    { reference: 'RD-107', userId: 'DEMO-208', voucher: 'Ridge Trail Voucher', requestedAt: '2026-11-23T09:15:00Z',
      status: 'Pending', reservation: 'Held', debit: 'Not posted' },
    { reference: 'RD-106', userId: 'DEMO-404', voucher: 'Coastal Walk Voucher', requestedAt: '2026-11-21T14:30:00Z',
      status: 'Approved', reservation: 'Consumed', debit: 'Finalized',
      review: { actor: 'Demo reviewer A', at: '2026-11-22T08:15:00Z', note: 'Sample review completed.' },
      issuance: { reference: 'ISS-106', status: 'Issuance failed', at: '2026-11-22T08:20:00Z',
        reason: 'Sample voucher artwork was unavailable for this attempt.' } },
    { reference: 'RD-105', userId: 'DEMO-208', voucher: 'Forest Loop Voucher', requestedAt: '2026-11-19T11:45:00Z',
      status: 'Approved', reservation: 'Consumed', debit: 'Finalized',
      review: { actor: 'Demo reviewer B', at: '2026-11-20T12:30:00Z', note: 'Sample review completed.' },
      issuance: { reference: 'ISS-105', status: 'Awaiting issuance' } },
    { reference: 'RD-104', userId: 'DEMO-315', voucher: 'Ridge Trail Voucher', requestedAt: '2026-11-15T17:10:00Z',
      status: 'Pending', reservation: 'Held', debit: 'Not posted' },
    { reference: 'RD-103', userId: 'DEMO-174', voucher: 'Coastal Walk Voucher', requestedAt: '2026-11-10T09:20:00Z',
      status: 'Rejected', reservation: 'Released', debit: 'Not posted',
      review: { actor: 'Demo reviewer A', at: '2026-11-11T09:30:00Z', note: 'Sample verification could not confirm request details.' } },
    { reference: 'RD-102', userId: 'DEMO-530', voucher: 'Forest Loop Voucher', requestedAt: '2026-11-02T07:45:00Z',
      status: 'Cancelled', reservation: 'Released', debit: 'Not posted',
      review: { actor: 'DEMO-530', at: '2026-11-02T10:30:00Z', note: 'Sample requester withdrew before review.' } },
    { reference: 'RD-101', userId: 'DEMO-601', voucher: 'Ridge Trail Voucher', requestedAt: '2026-10-10T12:00:00Z',
      status: 'Approved', reservation: 'Consumed', debit: 'Finalized',
      review: { actor: 'Demo reviewer B', at: '2026-10-11T09:00:00Z', note: 'Sample review completed.' },
      issuance: { reference: 'ISS-101', status: 'Issued', at: '2026-10-11T09:15:00Z' } },
  ],
};

@Injectable({ providedIn: 'root' })
export class RedemptionsDemoSource {
  async load(): Promise<RedemptionsSnapshot> {
    return sample;
  }
}
