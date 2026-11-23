import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { CampaignsDemoSource, CampaignsSnapshot } from './campaigns-demo';

describe('ADM-14 Campaigns Management', () => {
  async function openPage(load?: CampaignsDemoSource['load']) {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), ...(load ? [{ provide: CampaignsDemoSource, useValue: { load } }] : [])],
    });
    const harness = await RouterTestingHarness.create('/preview/campaigns');
    async function refresh() {
      await harness.fixture.whenStable();
      harness.detectChanges();
    }
    await refresh();
    const page = harness.routeNativeElement!.querySelector('wayhunter-campaigns-page')!;
    const ids = () => Array.from(page.querySelectorAll('.record-id'), cell => cell.textContent);
    function change(field: HTMLInputElement | HTMLSelectElement, value: string) {
      field.value = value;
      field.dispatchEvent(new Event(field instanceof HTMLSelectElement ? 'change' : 'input'));
      harness.detectChanges();
    }
    function button(label: string) {
      return page.querySelector<HTMLButtonElement>('button[aria-label="' + label + '"]')!;
    }
    return { harness, page, ids, change, refresh, button };
  }

  it('renders five full-inventory cards, sorted dates, weighted performance and audit records', async () => {
    const { page, ids } = await openPage();
    expect(page.querySelector('.intro')?.textContent).toContain('Demo data');
    expect(Array.from(page.querySelectorAll('.metric-value'), metric => metric.textContent)).toEqual(['6', '2', '1', '1', '1']);
    expect(ids()).toHaveLength(6);
    expect(Array.from(page.querySelectorAll('.performance dd'), metric => metric.textContent)).toEqual(['7,000', '300', '4.29%']);
    expect(Array.from(page.querySelectorAll('.schedule wh-status-badge'), badge => badge.textContent)).toEqual([
      'Past window', 'Current window', 'Current window', 'Upcoming window', 'Upcoming window', 'Upcoming window',
    ]);
    const audit = page.querySelector('wh-data-table')?.textContent;
    expect(audit).toContain('Schedule recorded');
    expect(audit).toContain('Time (UTC)');
  });

  it('combines and resets search, status, category and date filters', async () => {
    const { harness, page, ids, change } = await openPage();
    const search = page.querySelector<HTMLInputElement>('input[type="search"]')!;
    const [status, category, dates] = page.querySelectorAll('select');
    change(search, '  demo ridge  ');
    expect(ids()).toEqual(['CMP-201', 'CMP-204', 'CMP-206']);
    change(category, 'Promoted place');
    expect(ids()).toEqual(['CMP-201', 'CMP-204']);
    change(dates, 'Upcoming window');
    expect(ids()).toEqual(['CMP-204']);
    change(status, 'Draft');
    expect(ids()).toEqual([]);
    expect(page.querySelector('wh-empty-state')?.textContent).toContain('No sample campaigns match');
    page.querySelector<HTMLButtonElement>('.filters button')!.click();
    harness.detectChanges();
    expect(ids()).toHaveLength(6);
    expect([search.value, status.value, category.value, dates.value]).toEqual(['', '', '', '']);
    change(search, 'cmp-203');
    expect(ids()).toEqual(['CMP-203']);
    change(search, 'kandy');
    expect(ids()).toEqual(['CMP-201', 'CMP-206']);
  });

  it('shows the selected ad and sponsored preview, then restores focus on Escape', async () => {
    const { harness, page, button } = await openPage();
    const trigger = button('View details for CMP-201');
    trigger.click();
    harness.detectChanges();
    const details = page.querySelector('#campaign-details')!;
    expect(details.textContent).toContain('Ridge Trail Spotlight');
    expect(details.textContent).toContain('10 Nov 2026');
    expect(details.textContent).toContain('4.0% CTR');
    expect(details.textContent).toContain('AD-101');
    expect(details.textContent).toContain('Home banner');
    expect(details.querySelector('.preview')?.textContent).toContain('Sponsored by Demo Ridge Outfitters');
    expect(document.activeElement?.id).toBe('campaign-details-title');
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    harness.detectChanges();
    expect(page.querySelector('#campaign-details')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('opens pending review details with zero CTR and shows an empty linked-ad state for drafts', async () => {
    const { harness, page, button } = await openPage();
    button('Review details for CMP-203').click();
    harness.detectChanges();
    expect(page.textContent).toContain('Read-only · 1 pending');
    expect(page.querySelector('#campaign-details')?.textContent).toContain('0.0% CTR');
    expect(page.querySelector('#campaign-details')?.textContent).toContain('AD-103');
    button('View details for CMP-205').click();
    harness.detectChanges();
    expect(page.querySelector('#campaign-details wh-empty-state')?.textContent).toContain('no associated advertisements');
    expect(Array.from(page.querySelectorAll('button')).some(el => /^(approve|reject|publish)$/i.test(el.textContent!.trim()))).toBe(false);
  });

  it('announces loading, retries a failure, and distinguishes a genuinely empty inventory', async () => {
    let rejectFirstLoad!: (error: Error) => void;
    const firstLoad = new Promise<CampaignsSnapshot>((_, reject) => { rejectFirstLoad = reject; });
    const empty: CampaignsSnapshot = { asOf: '2026-11-23', campaigns: [], ads: [], history: [] };
    let attempts = 0;
    const { page, refresh } = await openPage(() => ++attempts === 1 ? firstLoad : Promise.resolve(empty));
    expect(page.querySelector('wh-loading-state [role="status"]')?.textContent).toContain('Loading');
    rejectFirstLoad(new Error('Demo source unavailable'));
    await refresh();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('could not be loaded');
    page.querySelector<HTMLButtonElement>('wh-error-state button')!.click();
    await refresh();
    expect(attempts).toBe(2);
    expect(page.querySelector('[role="alert"]')).toBeNull();
    expect(page.querySelector('wh-empty-state')?.textContent).toContain('No sample campaigns are available');
    expect(page.querySelector('.performance')?.textContent).toContain('0.0%');
  });
});
