export const transactionTypes = [
  'Welcome Reward', 'Hunter Approval Reward', 'Game Creation Reward', 'Verified Game Win Reward',
  'Voucher Reservation', 'Voucher Redemption', 'Voucher Issue',
] as const;

export const transactionStatuses = [
  'Pending', 'Approved', 'Completed', 'Reserved', 'Released', 'Rejected', 'Failed',
] as const;

export type TransactionType = typeof transactionTypes[number];
export type TransactionStatus = typeof transactionStatuses[number];

export interface CoinTransaction {
  readonly reference: string;
  readonly userId: string;
  readonly type: TransactionType;
  readonly timestamp: string;
  readonly status: TransactionStatus;
  readonly module: 'Accounts' | 'Hunter' | 'Games' | 'Redemptions';
  readonly postedDelta: number;
  readonly reservedDelta: number;
}

export interface CoinBalance {
  readonly lifetimeEarned: number;
  readonly spent: number;
  readonly reserved: number;
  readonly spendable: number;
}

export interface CoinsRewardsView {
  readonly asOf: string;
  readonly transactions: readonly CoinTransaction[];
  readonly totals: CoinBalance;
  readonly rewardEvents: number;
  readonly sampleWallet: CoinBalance & { readonly userId: string };
}
