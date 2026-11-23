export const requestStatuses = ['Pending', 'Approved', 'Rejected', 'Cancelled'] as const;
export const issuanceStatuses = ['Not started', 'Awaiting issuance', 'Issued', 'Issuance failed'] as const;

interface Review {
  readonly actor: string;
  readonly at: string;
  readonly note: string;
}

interface RequestFields {
  readonly reference: string;
  readonly userId: string;
  readonly voucher: string;
  readonly requestedAt: string;
}

export type ApprovedIssuance = { readonly reference: string } & (
  | { readonly status: 'Awaiting issuance' }
  | { readonly status: 'Issued'; readonly at: string }
  | { readonly status: 'Issuance failed'; readonly at: string; readonly reason: string }
);

export type Redemption = RequestFields & (
  | { readonly status: 'Pending'; readonly reservation: 'Held'; readonly debit: 'Not posted' }
  | { readonly status: 'Approved'; readonly reservation: 'Consumed'; readonly debit: 'Finalized';
      readonly review: Review; readonly issuance: ApprovedIssuance }
  | { readonly status: 'Rejected' | 'Cancelled'; readonly reservation: 'Released'; readonly debit: 'Not posted';
      readonly review: Review }
);

export interface AuditEvent {
  readonly reference: string;
  readonly request: string;
  readonly at: string;
  readonly actor: string;
  readonly event: string;
}

export interface RedemptionsSnapshot {
  readonly asOf: string;
  readonly requests: readonly Redemption[];
}

export function issuanceStatus(request: Redemption): typeof issuanceStatuses[number] {
  return request.status === 'Approved' ? request.issuance.status : 'Not started';
}

export function requestTimeline(request: Redemption): readonly AuditEvent[] {
  const events = [
    { reference: request.reference + '/01', request: request.reference, at: request.requestedAt,
      actor: request.userId, event: 'Request received · 10,000 Coins reserved' },
  ];
  if (request.status === 'Pending') return events;
  const { actor, at } = request.review;
  events.push({ reference: request.reference + '/02', request: request.reference, at, actor,
    event: request.status === 'Cancelled' ? 'Request cancelled' : 'Admin review · ' + request.status });
  events.push({ reference: request.reference + '/03', request: request.reference, at, actor: 'Demo ledger',
    event: request.status === 'Approved' ? 'Reservation consumed · one 10,000-Coin debit finalized' :
      'Reservation released once · no posted debit' });
  if (request.status === 'Approved' && request.issuance.status !== 'Awaiting issuance') {
    events.push({ reference: request.reference + '/04', request: request.reference, at: request.issuance.at,
      actor: 'Demo issuance', event: request.issuance.status === 'Issued' ?
        'Voucher issued · no additional debit' : 'Issuance failed · finalized debit preserved' });
  }
  return events;
}
