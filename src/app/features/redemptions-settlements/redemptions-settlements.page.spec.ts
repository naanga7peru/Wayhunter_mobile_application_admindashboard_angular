import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { RedemptionsDemoSource } from './data-access/redemptions-demo';
import { RedemptionsSnapshot } from './models/redemptions-view';

describe('ADM-13 Redemptions & Settlements', () => {
  async function openPage(source?: Pick<RedemptionsDemoSource, 'load'>) {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), ...(source ? [{ provide: RedemptionsDemoSource, useValue: source }] : [])],
    });
    const harness = await RouterTestingHarness.create('/preview/redemptions-settlements');
    await harness.fixture.whenStable();
    harness.detectChanges();
    const page = harness.routeNativeElement!.querySelector('wayhunter-redemptions-settlements-page')!;
    const references = () => Array.from(page.querySelectorAll('.request-table tbody th'), row => row.textContent);
    const search = () => page.querySelector<HTMLInputElement>('input[type="search"]')!;
    function change(field: HTMLInputElement | HTMLSelectElement, value: string) {
      field.value = value;
      field.dispatchEvent(new Event(field instanceof HTMLSelectElement ? 'change' : 'input'));
      harness.detectChanges();
    }
    return { harness, page, references, search, change };
  }

  it('derives overview metrics and keeps approved requests distinct from issued vouchers', async () => {
    const { page, references } = await openPage();
    expect(page.querySelector('.intro')?.textContent).toContain('Demo Data');
    expect(Array.from(page.querySelectorAll('.metric-value'), value => value.textContent)).toEqual(['7', '2', '3', '1', '1']);
    expect(references()).toHaveLength(7);
    const statuses = Array.from(page.querySelectorAll('.request-table tbody tr:nth-child(2) wh-status-badge'), badge => badge.textContent);
    expect(statuses).toEqual(['Approved', 'Issuance failed']);
    expect(page.querySelectorAll('.queue li')).toHaveLength(2);
  });

  it('searches for reference, sample user ID and voucher name with a useful empty state', async () => {
    const { page, references, search, change } = await openPage();
    expect(search().labels?.[0].textContent).toContain('Search requests');
    change(search(), ' rd-106 ');
    expect(references()).toEqual(['RD-106']);
    change(search(), 'DEMO-208');
    expect(references()).toEqual(['RD-107', 'RD-105']);
    change(search(), 'coastal');
    expect(references()).toEqual(['RD-106', 'RD-103']);
    change(search(), 'unknown');
    expect(references()).toEqual([]);
    expect(page.querySelector('wh-empty-state [role="status"]')?.textContent).toContain('No sample redemption requests');
    expect(page.querySelector('.results')?.textContent).toContain('0 of 7');
  });

  it('combines request, issuance and date filters and resets all controls', async () => {
    const { harness, page, references, search, change } = await openPage();
    const [status, issuance, range] = page.querySelectorAll('select');
    change(status, 'Approved');
    expect(references()).toEqual(['RD-106', 'RD-105', 'RD-101']);
    change(issuance, 'Issued');
    expect(references()).toEqual(['RD-101']);
    change(range, '30');
    expect(references()).toEqual([]);
    change(issuance, 'Issuance failed');
    change(search(), 'DEMO-404');
    expect(references()).toEqual(['RD-106']);
    page.querySelector<HTMLButtonElement>('.filters button')!.click();
    harness.detectChanges();
    expect([search().value, status.value, issuance.value, range.value]).toEqual(['', '', '', '']);
    expect(references()).toHaveLength(7);
  });

  it('moves focus to the details panel and restores it after Escape', async () => {
    const { harness, page } = await openPage();
    const trigger = page.querySelector<HTMLButtonElement>('button[aria-label="View details for RD-106"]')!;
    trigger.click();
    harness.detectChanges();
    const panel = page.querySelector('#redemption-details')!;
    expect(panel.textContent).toContain('DEMO-404');
    expect(panel.textContent).toContain('Demo reviewer A');
    expect(panel.textContent).toContain('Request timeline');
    expect(panel.textContent).toContain('ReservationConsumed');
    expect(panel.textContent).toContain('DebitFinalized');
    expect(panel.textContent).toContain('Sample voucher artwork was unavailable');
    expect(document.activeElement?.id).toBe('redemption-title');
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    harness.detectChanges();
    expect(page.querySelector('#redemption-details')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('shows held and released reservations with no posted debit', async () => {
    const { harness, page } = await openPage();
    for (const [buttonLabel, hold] of [['Review sample request RD-107', 'Held'], ['View details for RD-103', 'Released'],
      ['View details for RD-102', 'Released']]) {
      page.querySelector<HTMLButtonElement>('button[aria-label="' + buttonLabel + '"]')!.click();
      harness.detectChanges();
      const panel = page.querySelector('#redemption-details')!;
      expect(panel.textContent).toContain('Reservation' + hold);
      expect(panel.textContent).toContain('DebitNot posted');
      expect(panel.textContent).toContain('IssuanceNot started');
      panel.querySelector<HTMLButtonElement>('button')!.click();
      harness.detectChanges();
    }
  });

  it('shows failed issuance as unissued and offers no approval, settlement or issuance mutation', async () => {
    const { page } = await openPage();
    const failed = page.querySelector('.issue-failed')!;
    expect(failed.textContent).toContain('ISS-106');
    expect(failed.textContent).toContain('approved and unissued');
    expect(failed.textContent).toContain('finalized debit is preserved');
    expect(failed.textContent).toContain('without an additional debit');
    expect(failed.querySelector('.artwork')).toBeNull();
    expect(page.querySelectorAll('.tracker-grid .artwork')).toHaveLength(1);
    expect(page.querySelector('.decision')?.textContent).toContain('10,100 spendable Coins');
    expect(page.querySelector('.decision button, .tracker-grid button')).toBeNull();
    const audit = page.querySelector('wh-data-table')!;
    expect(audit.textContent).toContain('RD-106/03');
    expect(audit.textContent).toContain('one 10,000-Coin debit finalized');
    expect(audit.textContent).toContain('Reservation released once');
    expect(audit.textContent).toContain('Voucher issued · no additional debit');
  });

  it('renders loading and error states and retries the sample source', async () => {
    const sample = await new RedemptionsDemoSource().load();
    let rejectLoad!: (reason: Error) => void;
    const pending = new Promise<RedemptionsSnapshot>((_, reject) => { rejectLoad = reject; });
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
    expect(references()).toHaveLength(7);
  });
});
