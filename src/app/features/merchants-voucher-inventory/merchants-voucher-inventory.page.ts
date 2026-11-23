import { DatePipe, DecimalPipe } from '@angular/common';
import {
  afterNextRender, ChangeDetectionStrategy, Component, computed, ElementRef, inject, Injector,
  OnInit, signal, viewChild,
} from '@angular/core';
import { UiButton } from '../../shared/ui/button';
import { UiCard } from '../../shared/ui/card';
import { FilterOption, UiFilterSelect } from '../../shared/ui/filter-select';
import { UiSearchInput } from '../../shared/ui/search-input';
import { UiEmptyState, UiErrorState, UiLoadingState } from '../../shared/ui/states';
import { StatusTone, UiStatusBadge } from '../../shared/ui/status-badge';
import { DEMO_LOW_STOCK_MAX, DEMO_VOUCHER, VoucherInventoryDemoSource } from './data-access/voucher-inventory-demo';
import { DemoMerchant, DemoVoucher, InventorySnapshot, InventoryStatus, inventoryStatuses } from './models/voucher-inventory';

interface InventoryRow extends DemoVoucher {
  readonly merchant: DemoMerchant;
  readonly status: InventoryStatus;
}

type InventoryState =
  | { readonly kind: 'loading' | 'error' }
  | { readonly kind: 'ready'; readonly snapshot: InventorySnapshot };

const statusTones: Record<InventoryStatus, StatusTone> = {
  Available: 'success', 'Low stock': 'warning', 'Out of stock': 'neutral', Expired: 'danger',
};

const fileTypes: Readonly<Record<string, string>> = {
  pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
};
const maxFileSize = 5 * 1024 * 1024;

function inventoryStatus(voucher: DemoVoucher, asOf: string): InventoryStatus {
  if (voucher.expiresOn < asOf) return 'Expired';
  if (voucher.available === 0) return 'Out of stock';
  return voucher.available <= DEMO_LOW_STOCK_MAX ? 'Low stock' : 'Available';
}

@Component({
  selector: 'wayhunter-merchants-voucher-inventory-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, UiButton, UiCard, UiFilterSelect, UiSearchInput, UiStatusBadge,
    UiEmptyState, UiErrorState, UiLoadingState],
  templateUrl: './merchants-voucher-inventory.page.html',
  styleUrl: './merchants-voucher-inventory.page.scss',
})
export class MerchantsInventoryPage implements OnInit {
  private readonly demo = inject(VoucherInventoryDemoSource);
  private readonly injector = inject(Injector);
  private readonly detailsHeading = viewChild<ElementRef<HTMLHeadingElement>>('detailsHeading');
  private readonly resultsRegion = viewChild<ElementRef<HTMLElement>>('resultsRegion');
  private detailsTrigger?: HTMLButtonElement;

  protected readonly state = signal<InventoryState>({ kind: 'loading' });
  protected readonly search = signal('');
  protected readonly merchant = signal('');
  protected readonly status = signal('');
  protected readonly stock = signal('');
  protected readonly selected = signal<InventoryRow | null>(null);
  protected readonly selectedFile = signal('');
  protected readonly fileError = signal('');
  protected readonly voucherTerms = DEMO_VOUCHER;
  protected readonly lowStockMax = DEMO_LOW_STOCK_MAX;
  protected readonly tones = statusTones;

  protected readonly snapshot = computed(() => {
    const state = this.state();
    return state.kind === 'ready' ? state.snapshot : null;
  });
  protected readonly inventory = computed<readonly InventoryRow[]>(() => {
    const snapshot = this.snapshot();
    if (!snapshot) return [];
    const merchants = new Map(snapshot.merchants.map(merchant => [merchant.id, merchant]));
    return snapshot.vouchers.flatMap(voucher => {
      const merchant = merchants.get(voucher.merchantId);
      return merchant ? [{ ...voucher, merchant, status: inventoryStatus(voucher, snapshot.asOf) }] : [];
    });
  });
  protected readonly metrics = computed(() => {
    const rows = this.inventory();
    const available = rows.reduce((sum, row) => sum + row.available, 0);
    const reserved = rows.reduce((sum, row) => sum + row.reserved, 0);
    const expired = rows.reduce((sum, row) => sum + row.expired, 0);
    return [
      { label: 'Total demo vouchers', count: available + reserved + expired, detail: 'Units across all offers' },
      { label: 'Available stock', count: available, detail: 'Units ready to reserve' },
      { label: 'Reserved stock', count: reserved, detail: 'Units held for requests' },
      { label: 'Low-stock items', count: rows.filter(row => row.status === 'Low stock').length, detail: 'Offers with 1–' + this.lowStockMax + ' available units' },
      { label: 'Expired voucher items', count: rows.filter(row => row.status === 'Expired').length, detail: expired + ' expired units' },
    ];
  });
  protected readonly merchants = computed(() => (this.snapshot()?.merchants ?? []).map(merchant => {
    const offers = this.inventory().filter(voucher => voucher.merchantId === merchant.id);
    return {
      ...merchant,
      count: offers.length,
      available: offers.reduce((sum, row) => sum + row.available, 0),
      reserved: offers.reduce((sum, row) => sum + row.reserved, 0),
      expired: offers.reduce((sum, row) => sum + row.expired, 0),
    };
  }));
  protected readonly merchantOptions = computed<readonly FilterOption[]>(() => [
    { label: 'All merchants', value: '' },
    ...this.merchants().map(merchant => ({ label: merchant.name, value: merchant.id })),
  ]);
  protected readonly statusOptions: readonly FilterOption[] = [
    { label: 'All statuses', value: '' }, ...inventoryStatuses.map(value => ({ label: value, value })),
  ];
  protected readonly stockOptions: readonly FilterOption[] = [
    { label: 'All stock levels', value: '' },
    { label: 'In stock', value: 'available' },
    { label: 'Low stock', value: 'low' },
    { label: 'No available units', value: 'none' },
  ];
  protected readonly filtered = computed(() => {
    const search = this.search().trim().toLowerCase();
    const merchant = this.merchant();
    const status = this.status();
    const stock = this.stock();
    return this.inventory().filter(row =>
      (!merchant || row.merchantId === merchant) &&
      (!status || row.status === status) &&
      (!stock || (stock === 'available' && row.available > 0) ||
        (stock === 'low' && row.status === 'Low stock') || (stock === 'none' && row.available === 0)) &&
      [row.name, row.reference, row.merchant.name].some(value => value.toLowerCase().includes(search)),
    );
  });

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.state.set({ kind: 'loading' });
    try {
      this.state.set({ kind: 'ready', snapshot: await this.demo.load() });
    } catch {
      this.state.set({ kind: 'error' });
    }
  }

  protected resetFilters(): void {
    this.search.set('');
    this.merchant.set('');
    this.status.set('');
    this.stock.set('');
  }

  protected showMerchant(id: string): void {
    this.resetFilters();
    this.merchant.set(id);
    this.resultsRegion()?.nativeElement.focus();
  }

  protected openDetails(row: InventoryRow, event: MouseEvent): void {
    this.detailsTrigger = event.currentTarget instanceof HTMLButtonElement ? event.currentTarget : undefined;
    this.selected.set(row);
    afterNextRender({ write: () => this.detailsHeading()?.nativeElement.focus() }, { injector: this.injector });
  }

  protected closeDetails(): void {
    this.selected.set(null);
    const trigger = this.detailsTrigger;
    this.detailsTrigger = undefined;
    (trigger?.isConnected ? trigger : this.resultsRegion()?.nativeElement)?.focus();
  }

  protected selectFile(input: HTMLInputElement): void {
    this.clearFile();
    const file = input.files?.[0];
    if (!file) return;

    const extension = /\.([^.]+)$/.exec(file.name)?.[1].toLowerCase() ?? '';
    const expectedType = Object.hasOwn(fileTypes, extension) ? fileTypes[extension] : undefined;
    if (!expectedType || (file.type && file.type !== expectedType)) {
      this.fileError.set('Choose a PDF, PNG, JPEG or WebP file.');
    } else if (file.size === 0 || file.size > maxFileSize) {
      this.fileError.set('Choose a non-empty file no larger than 5 MiB.');
    } else {
      this.selectedFile.set(file.name);
    }
    if (this.fileError()) input.value = '';
  }

  protected clearFile(input?: HTMLInputElement): void {
    if (input) input.value = '';
    this.selectedFile.set('');
    this.fileError.set('');
  }
}
