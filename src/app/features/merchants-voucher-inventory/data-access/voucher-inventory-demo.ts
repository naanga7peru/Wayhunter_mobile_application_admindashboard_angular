import { Injectable } from '@angular/core';
import { InventorySnapshot } from '../models/voucher-inventory';

export const DEMO_VOUCHER = { coinCost: 10_000, valueLkr: 100, minimumSpendable: 10_100 } as const;
export const DEMO_LOW_STOCK_MAX = 5;

const sample: InventorySnapshot = {
  asOf: '2026-11-23',
  merchants: [
    { id: 'ridge', name: 'Demo Ridge Outpost', source: 'Sample image' },
    { id: 'coast', name: 'Demo Coast Kiosk', source: 'Sample PDF' },
    { id: 'forest', name: 'Demo Forest Desk', source: 'Manual sample' },
  ],
  vouchers: [
    { reference: 'VCH-001', name: 'Ridge Trail Pass', merchantId: 'ridge', available: 18, reserved: 4, expired: 0, expiresOn: '2027-01-31' },
    { reference: 'VCH-002', name: 'Coastal Refreshment', merchantId: 'coast', available: 3, reserved: 2, expired: 0, expiresOn: '2026-12-20' },
    { reference: 'VCH-003', name: 'Forest Explorer Pass', merchantId: 'forest', available: 0, reserved: 6, expired: 0, expiresOn: '2027-02-14' },
    { reference: 'VCH-004', name: 'Ridge Lookout Pass', merchantId: 'ridge', available: 5, reserved: 1, expired: 0, expiresOn: '2027-01-18' },
    { reference: 'VCH-005', name: 'Coastal Weekend Pass', merchantId: 'coast', available: 0, reserved: 0, expired: 7, expiresOn: '2026-11-15' },
    { reference: 'VCH-006', name: 'Forest Picnic Pass', merchantId: 'forest', available: 12, reserved: 0, expired: 0, expiresOn: '2027-03-01' },
  ],
};

@Injectable({ providedIn: 'root' })
export class VoucherInventoryDemoSource {
  async load(): Promise<InventorySnapshot> {
    return sample;
  }
}
