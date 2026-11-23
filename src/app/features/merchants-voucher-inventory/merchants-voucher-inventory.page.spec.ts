import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { VoucherInventoryDemoSource } from './data-access/voucher-inventory-demo';
import { InventorySnapshot } from './models/voucher-inventory';

describe('ADM-12 Merchants and Voucher Inventory', () => {
  async function openPage(source?: Pick<VoucherInventoryDemoSource, 'load'>) {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), ...(source ? [{ provide: VoucherInventoryDemoSource, useValue: source }] : [])],
    });
    const harness = await RouterTestingHarness.create('/preview/merchants-voucher-inventory');
    await harness.fixture.whenStable();
    harness.detectChanges();
    const page = harness.routeNativeElement!.querySelector('wayhunter-merchants-voucher-inventory-page')!;
    const references = () => Array.from(page.querySelectorAll('tbody th'), cell => cell.textContent?.trim());
    function change(field: HTMLInputElement | HTMLSelectElement, value: string) {
      field.value = value;
      field.dispatchEvent(new Event(field instanceof HTMLSelectElement ? 'change' : 'input'));
      harness.detectChanges();
    }
    return { harness, page, references, change };
  }

  it('derives overview values and merchant summaries from the sample inventory', async () => {
    const { page, references } = await openPage();
    expect(page.querySelector('.labels')?.textContent).toContain('Demo Data');
    expect(Array.from(page.querySelectorAll('.metric-value'), item => item.textContent)).toEqual([
      '58', '38', '13', '2', '1',
    ]);
    expect(references()).toHaveLength(6);
    expect(page.querySelector('.merchant')?.textContent).toContain('23 available · 5 reserved · 0 expired');
    expect(page.querySelector('.terms')?.textContent).toContain('10,100 spendable Coins');
  });

  it('searches by voucher name, reference and merchant and shows an empty state', async () => {
    const { page, references, change } = await openPage();
    const search = page.querySelector<HTMLInputElement>('input[type="search"]')!;
    expect(search.labels?.[0].textContent).toContain('Search vouchers');
    change(search, 'ridge trail');
    expect(references()).toEqual(['VCH-001']);
    change(search, ' vch-006 ');
    expect(references()).toEqual(['VCH-006']);
    change(search, 'Demo Coast Kiosk');
    expect(references()).toEqual(['VCH-002', 'VCH-005']);
    change(search, 'unknown');
    expect(references()).toEqual([]);
    expect(page.querySelector('wh-empty-state [role="status"]')?.textContent).toContain('No sample vouchers');
    expect(page.querySelector('.results')?.textContent).toContain('0 of 6');
  });

  it('combines merchant, status and low-stock filters and resets every control', async () => {
    const { harness, page, references, change } = await openPage();
    const [merchant, status, stock] = page.querySelectorAll('select');
    expect(merchant.labels?.[0].textContent).toContain('Merchant');
    change(stock, 'low');
    expect(references()).toEqual(['VCH-002', 'VCH-004']);
    change(merchant, 'coast');
    expect(references()).toEqual(['VCH-002']);
    change(status, 'Expired');
    expect(references()).toEqual([]);
    change(stock, '');
    expect(references()).toEqual(['VCH-005']);
    const search = page.querySelector<HTMLInputElement>('input[type="search"]')!;
    change(search, 'weekend');
    page.querySelector<HTMLButtonElement>('.filters button')!.click();
    harness.detectChanges();
    expect(references()).toHaveLength(6);
    expect([search.value, merchant.value, status.value, stock.value]).toEqual(['', '', '', '']);
  });

  it('filters inventory when a merchant overview action is used', async () => {
    const { harness, page, references } = await openPage();
    page.querySelector<HTMLButtonElement>('button[aria-label="Show inventory for Demo Forest Desk"]')!.click();
    harness.detectChanges();
    expect(references()).toEqual(['VCH-003', 'VCH-006']);
    expect(page.querySelector('select')?.value).toBe('forest');
  });

  it('opens voucher details, focuses the heading and restores focus on close', async () => {
    const { harness, page } = await openPage();
    const trigger = page.querySelector<HTMLButtonElement>('tbody button')!;
    trigger.click();
    harness.detectChanges();
    const panel = page.querySelector('#voucher-details')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(panel.textContent).toContain('VCH-001');
    expect(panel.textContent).toContain('Sample artwork');
    expect(panel.textContent).toContain('18 available · 4 reserved · 0 expired');
    expect(panel.textContent).toContain('31 Jan 2027');
    expect(document.activeElement?.id).toBe('voucher-details-title');
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    harness.detectChanges();
    expect(page.querySelector('#voucher-details')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('accepts valid local files and rejects invalid types and sizes', async () => {
    const { harness, page } = await openPage();
    const input = page.querySelector<HTMLInputElement>('input[type="file"]')!;
    function select(file: File) {
      Object.defineProperty(input, 'files', { configurable: true, value: [file] });
      input.dispatchEvent(new Event('change'));
      harness.detectChanges();
    }

    select(new File(['sample'], 'offer.pdf', { type: 'application/pdf' }));
    expect(page.querySelector('.filename')?.textContent).toContain('offer.pdf');
    select(new File(['sample'], 'offer.png', { type: 'text/plain' }));
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('Choose a PDF');
    expect(page.querySelector('.filename')).toBeNull();
    select(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }));
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('no larger than 5 MiB');
    select(new File(['sample'], 'offer.webp', { type: 'image/webp' }));
    expect(page.querySelector('.filename')?.textContent).toContain('Selected locally');
    page.querySelector<HTMLButtonElement>('.intake-grid button')!.click();
    harness.detectChanges();
    expect(page.querySelector('.filename')).toBeNull();
  });

  it('announces loading and error states and retries the local data source', async () => {
    const sample = await new VoucherInventoryDemoSource().load();
    let rejectLoad!: (reason: Error) => void;
    const pending = new Promise<InventorySnapshot>((_, reject) => { rejectLoad = reject; });
    let attempts = 0;
    const { harness, page, references } = await openPage({
      load: () => ++attempts === 1 ? pending : Promise.resolve(sample),
    });
    expect(page.querySelector('wh-loading-state [role="status"]')?.textContent).toContain('Loading');
    rejectLoad(new Error('Sample unavailable'));
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('could not be loaded');
    page.querySelector<HTMLButtonElement>('wh-error-state button')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(attempts).toBe(2);
    expect(references()).toHaveLength(6);
  });
});
