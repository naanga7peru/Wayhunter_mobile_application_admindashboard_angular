export const inventoryStatuses = ['Available', 'Low stock', 'Out of stock', 'Expired'] as const;
export type InventoryStatus = typeof inventoryStatuses[number];

export interface DemoMerchant {
  readonly id: string;
  readonly name: string;
  readonly source: 'Sample image' | 'Sample PDF' | 'Manual sample';
}

export interface DemoVoucher {
  readonly reference: string;
  readonly name: string;
  readonly merchantId: string;
  readonly available: number;
  readonly reserved: number;
  readonly expired: number;
  readonly expiresOn: string;
}

export interface InventorySnapshot {
  readonly asOf: string;
  readonly merchants: readonly DemoMerchant[];
  readonly vouchers: readonly DemoVoucher[];
}
