import { Injectable } from '@angular/core';
import { CoinBalance, CoinTransaction, CoinsRewardsView } from '../models/coins-rewards-view';

const sampleUser = 'DEMO-208';
const opening: Readonly<Record<string, number>> = {
  'DEMO-104': 12_100,
  [sampleUser]: 22_000,
  'DEMO-317': 12_200,
  'DEMO-421': 0,
};

// The opening snapshot predates the activity window. Posted and reserved deltas
// are fixture inputs, independent of the display status and transaction filters.
const history = [
  { reference: 'CR-0412', userId: 'DEMO-317', type: 'Voucher Issue', timestamp: '2026-11-22T13:10:00Z', status: 'Failed', module: 'Redemptions', postedDelta: 0, reservedDelta: 0 },
  { reference: 'CR-0411', userId: 'DEMO-317', type: 'Voucher Redemption', timestamp: '2026-11-22T12:45:00Z', status: 'Approved', module: 'Redemptions', postedDelta: -10_000, reservedDelta: -10_000 },
  { reference: 'CR-0410', userId: 'DEMO-104', type: 'Voucher Reservation', timestamp: '2026-11-21T14:30:00Z', status: 'Released', module: 'Redemptions', postedDelta: 0, reservedDelta: -10_000 },
  { reference: 'CR-0409', userId: 'DEMO-208', type: 'Voucher Reservation', timestamp: '2026-11-20T11:15:00Z', status: 'Reserved', module: 'Redemptions', postedDelta: 0, reservedDelta: 10_000 },
  { reference: 'CR-0408', userId: 'DEMO-208', type: 'Verified Game Win Reward', timestamp: '2026-11-19T15:20:00Z', status: 'Approved', module: 'Games', postedDelta: 100, reservedDelta: 0 },
  { reference: 'CR-0407', userId: 'DEMO-104', type: 'Hunter Approval Reward', timestamp: '2026-11-18T09:15:00Z', status: 'Approved', module: 'Hunter', postedDelta: 200, reservedDelta: 0 },
  { reference: 'CR-0406', userId: 'DEMO-421', type: 'Welcome Reward', timestamp: '2026-11-17T08:00:00Z', status: 'Completed', module: 'Accounts', postedDelta: 100, reservedDelta: 0 },
  { reference: 'CR-0405', userId: 'DEMO-104', type: 'Voucher Reservation', timestamp: '2026-11-12T14:30:00Z', status: 'Reserved', module: 'Redemptions', postedDelta: 0, reservedDelta: 10_000 },
  { reference: 'CR-0404', userId: 'DEMO-317', type: 'Voucher Reservation', timestamp: '2026-11-10T12:20:00Z', status: 'Reserved', module: 'Redemptions', postedDelta: 0, reservedDelta: 10_000 },
  { reference: 'CR-0403', userId: 'DEMO-421', type: 'Hunter Approval Reward', timestamp: '2026-11-04T10:10:00Z', status: 'Rejected', module: 'Hunter', postedDelta: 0, reservedDelta: 0 },
  { reference: 'CR-0402', userId: 'DEMO-208', type: 'Game Creation Reward', timestamp: '2026-11-02T16:00:00Z', status: 'Pending', module: 'Games', postedDelta: 0, reservedDelta: 0 },
  { reference: 'CR-0401', userId: 'DEMO-317', type: 'Game Creation Reward', timestamp: '2026-10-14T13:00:00Z', status: 'Approved', module: 'Games', postedDelta: 100, reservedDelta: 0 },
] as const satisfies readonly CoinTransaction[];

function balance(openingEarned: number, transactions: readonly CoinTransaction[]): CoinBalance {
  let lifetimeEarned = openingEarned;
  let spent = 0;
  let reserved = 0;
  for (const { postedDelta, reservedDelta } of transactions) {
    lifetimeEarned += Math.max(0, postedDelta);
    spent += Math.max(0, -postedDelta);
    reserved += reservedDelta;
  }
  return { lifetimeEarned, spent, reserved, spendable: lifetimeEarned - spent - reserved };
}

// V04 presentation data only. A later read adapter can map confirmed ledger,
// Flutter reward events, admin reviews and lifecycle/audit records to this view.
@Injectable({ providedIn: 'root' })
export class CoinsRewardsDemoSource {
  async load(): Promise<CoinsRewardsView> {
    return {
      asOf: '2026-11-22T23:59:59Z',
      transactions: history,
      totals: balance(Object.values(opening).reduce((total, earned) => total + earned, 0), history),
      rewardEvents: history.filter(transaction => transaction.postedDelta > 0).length,
      sampleWallet: {
        userId: sampleUser,
        ...balance(opening[sampleUser], history.filter(transaction => transaction.userId === sampleUser)),
      },
    };
  }
}
