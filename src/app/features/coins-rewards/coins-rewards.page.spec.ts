import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { CoinsRewardsDemoSource } from './data-access/coins-rewards-demo';
import { CoinsRewardsView } from './models/coins-rewards-view';

describe('ADM-11 Coins & Rewards', () => {
  async function openPage(source?: Pick<CoinsRewardsDemoSource, 'load'>) {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), ...(source ? [{ provide: CoinsRewardsDemoSource, useValue: source }] : [])],
    });
    const harness = await RouterTestingHarness.create('/preview/coins-rewards');
    await harness.fixture.whenStable();
    harness.detectChanges();
    const page = harness.routeNativeElement!.querySelector('wayhunter-coins-rewards-page')!;
    const tableRows = () => Array.from(page.querySelectorAll('tbody tr'), row => row.textContent ?? '');
    return { harness, page, tableRows };
  }

  function changeFilter(field: HTMLSelectElement, value: string) {
    field.value = value;
    field.dispatchEvent(new Event('change'));
  }

  it('renders the sample overview, transaction history and status badges', async () => {
    const { page, tableRows } = await openPage();
    expect(page.querySelector('.intro')?.textContent).toContain('Demo Data');
    expect(page.querySelectorAll('.metrics wh-card')).toHaveLength(5);
    expect(page.querySelector('table caption')?.textContent).toBe('Sample Coin transactions');
    expect(page.querySelectorAll('th[scope="col"]')).toHaveLength(7);
    expect(page.querySelectorAll('.badges wh-status-badge')).toHaveLength(7);
    expect(tableRows()).toHaveLength(12);
    expect(tableRows()[0]).toContain('Failed');
    expect(tableRows()[0]).toContain('Voucher Issue');
  });

  it('displays approved one-time rewards and eligibility rules', async () => {
    const { page } = await openPage();
    const rules = Array.from(page.querySelectorAll('.rules > div'), rule => rule.textContent);
    expect(rules[0]).toContain('Eligible verified account · +100 Coins once');
    expect(rules[1]).toContain('Approved Hunter submission · +200 Coins once');
    expect(rules[2]).toContain('Approved game creation · +100 Coins once');
    expect(rules[3]).toContain('Admin-verified winner · +100 Coins once');
    const notes = page.querySelector('.details-grid .notes')?.textContent;
    expect(notes).toContain('Exactly one verified winner per community game');
    expect(notes).toContain('creator cannot win');
    expect(notes).toContain('pending or rejected');
  });

  it('searches by sample user and reference and renders empty results', async () => {
    const { harness, page, tableRows } = await openPage();
    const search = page.querySelector<HTMLInputElement>('input[type="search"]')!;
    expect(search.labels?.[0].textContent?.trim()).toBe('Search history');

    for (const [value, count] of [['  demo-317 ', 4], ['cr-0407', 1], ['unknown', 0]] as const) {
      search.value = value;
      search.dispatchEvent(new Event('input'));
      harness.detectChanges();
      expect(tableRows()).toHaveLength(count);
    }

    expect(page.querySelector('wh-empty-state [role="status"]')?.textContent).toContain('No sample transactions');
  });

  it('combines status, type and date filters and resets the controls and results', async () => {
    const { harness, page, tableRows } = await openPage();
    const [type, status, range] = page.querySelectorAll('select');
    for (const [field, label] of [[type, 'Transaction type'], [status, 'Status'], [range, 'Date range']] as const) {
      expect(field.labels?.[0].textContent).toContain(label);
    }
    changeFilter(status, 'Approved');
    harness.detectChanges();
    expect(tableRows()).toHaveLength(4);
    expect(tableRows().every(row => row.includes('Approved'))).toBe(true);

    changeFilter(type, 'Game Creation Reward');
    harness.detectChanges();
    expect(tableRows()).toHaveLength(1);
    expect(tableRows()[0]).toContain('CR-0401');

    changeFilter(range, '30');
    harness.detectChanges();
    expect(tableRows()).toHaveLength(0);
    page.querySelector<HTMLButtonElement>('.toolbar button')!.click();
    harness.detectChanges();
    expect([type.value, status.value, range.value]).toEqual(['', '', '']);
    expect(tableRows()).toHaveLength(12);
  });

  it('reconciles balances and computes proposed level progress from lifetime earnings', async () => {
    const { page } = await openPage();
    expect(Array.from(page.querySelectorAll('.metric-value'), value => value.textContent)).toEqual([
      '46,800', '10,000', '26,800', '10,000', '4',
    ]);
    expect(Array.from(page.querySelectorAll('.wallet dd'), value => value.textContent)).toEqual([
      '22,100', '12,100', '10,000',
    ]);
    const progress = page.querySelector('progress')!;
    expect(progress.labels?.[0].textContent).toContain('Lifetime-earned progress');
    expect(progress.value).toBe(100);
    expect(progress.max).toBe(2_000);
    expect(page.querySelector('.progress-caption')?.textContent).toContain('100 of 2,000');
  });

  it('shows the voucher minimum and one-time debit lifecycle as information', async () => {
    const { page } = await openPage();
    const voucher = page.querySelector('.voucher-layout')!;
    expect(voucher.textContent).toContain('LKR 100');
    expect(voucher.textContent).toContain('Sample balance meets minimum');
    expect(voucher.textContent).toContain('10,100 spendable Coins');
    expect(voucher.textContent).toContain('100 spendable Coins after redemption');
    expect(voucher.textContent).toContain('releases the reservation once');
    expect(voucher.textContent).toContain('10,000-Coin debit once');
    expect(voucher.textContent).toContain('no automatic refund');
    expect(voucher.querySelector('button')).toBeNull();
  });

  it('announces loading and failure and retries the local sample source', async () => {
    const sample = await new CoinsRewardsDemoSource().load();
    let rejectLoad!: (reason: Error) => void;
    const pending = new Promise<CoinsRewardsView>((_resolve, reject) => { rejectLoad = reject; });
    let attempts = 0;
    const { harness, page, tableRows } = await openPage({
      load: () => ++attempts === 1 ? pending : Promise.resolve(sample),
    });

    expect(page.querySelector('wh-loading-state [role="status"]')?.textContent).toContain('Loading');
    expect(tableRows()).toHaveLength(0);
    rejectLoad(new Error('Sample unavailable'));
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('could not be loaded');

    page.querySelector<HTMLButtonElement>('wh-error-state button')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(attempts).toBe(2);
    expect(page.querySelector('[role="alert"]')).toBeNull();
    expect(tableRows()).toHaveLength(12);
  });
});
