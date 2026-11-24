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
    function click(label: string) {
      Array.from(page.querySelectorAll('button')).find(element => element.textContent?.trim() === label)!.click();
      harness.detectChanges();
    }
    return { harness, page, ids, change, refresh, button, click };
  }

  it('renders five full-inventory cards, sorted dates, weighted performance and audit records', async () => {
    const { page, ids } = await openPage();
    expect(page.querySelector('.intro')?.textContent).toContain('Demo data');
    expect(Array.from(page.querySelectorAll('.metric-value'), metric => metric.textContent)).toEqual(['8', '2', '1', '1', '1']);
    expect(ids()).toHaveLength(8);
    expect(Array.from(page.querySelectorAll('.performance dd'), metric => metric.textContent)).toEqual(['7,000', '300', '4.29%']);
    expect(Array.from(page.querySelectorAll('.schedule wh-status-badge'), badge => badge.textContent)).toEqual([
      'Elapsed window', 'Elapsed window', 'Current window', 'Current window', 'Current window',
      'Upcoming window', 'Upcoming window', 'Upcoming window',
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
    expect(ids()).toHaveLength(8);
    expect([search.value, status.value, category.value, dates.value]).toEqual(['', '', '', '']);
    change(search, 'cmp-203');
    expect(ids()).toEqual(['CMP-203']);
    change(search, 'kandy');
    expect(ids()).toEqual(['CMP-201', 'CMP-206']);
  });

  it('combines sponsor and audience filters with inventory filters and recalculates weighted performance', async () => {
    const { harness, page, ids, change } = await openPage();
    const [status, category, dates, sponsor, audience] = page.querySelectorAll<HTMLSelectElement>('.filters select');
    const totals = () => Array.from(page.querySelectorAll('.performance dd'), metric => metric.textContent);
    change(sponsor, 'Demo Ridge Outfitters');
    expect(ids()).toEqual(['CMP-201', 'CMP-204', 'CMP-206']);
    change(audience, 'Travelers exploring Kandy');
    expect(ids()).toEqual(['CMP-201', 'CMP-206']);
    expect(totals()).toEqual(['4,600', '204', '4.43%']);
    change(status, 'Ended');
    change(category, 'District pass');
    change(dates, 'Elapsed window');
    expect(ids()).toEqual(['CMP-206']);
    expect(totals()).toEqual(['1,000', '60', '6.0%']);
    change(dates, 'Current window');
    expect(ids()).toEqual([]);
    expect(totals()).toEqual([]);
    expect(page.textContent).toContain('No matching campaigns to summarize.');
    expect(page.textContent).toContain('Actual views, actions, and spend are unavailable.');
    page.querySelector<HTMLButtonElement>('.filters button')!.click();
    harness.detectChanges();
    expect([status, category, dates, sponsor, audience].map(field => field.value)).toEqual(['', '', '', '', '']);
    expect(totals()).toEqual(['7,000', '300', '4.29%']);
    change(audience, 'Players browsing Matale');
    expect(ids()).toEqual(['CMP-203', 'CMP-208']);
  });

  it('keeps stored lifecycle separate from schedule at the exact UTC start and end', async () => {
    const { page, ids, change } = await openPage();
    const [status, , dates] = page.querySelectorAll<HTMLSelectElement>('.filters select');
    const state = (id: string) => {
      const row = Array.from(page.querySelectorAll('tbody tr'))
        .find(candidate => candidate.querySelector('.record-id')?.textContent === id)!;
      return ['.stored-lifecycle', '.schedule-window'].map(selector => row.querySelector(selector)?.textContent);
    };
    expect(state('CMP-201')).toEqual(['Published', 'Current window']);
    expect(state('CMP-206')).toEqual(['Published', 'Elapsed window']);
    expect(state('CMP-207')).toEqual(['Paused', 'Current window']);
    expect(state('CMP-208')).toEqual(['Archived', 'Elapsed window']);
    change(status, 'Paused');
    change(dates, 'Current window');
    expect(ids()).toEqual(['CMP-207']);
    expect(Array.from(page.querySelectorAll('.performance dd'), metric => metric.textContent))
      .toEqual(['0', '0', 'Unavailable']);
    expect(page.textContent).toContain('Matching sample campaigns have zero impressions.');
    change(status, 'Archived');
    change(dates, 'Elapsed window');
    expect(ids()).toEqual(['CMP-208']);
  });

  it('includes CMP-206 in the elapsed window and excludes it from Active without changing its lifecycle', async () => {
    const { page, ids, change } = await openPage();
    const [status, , dates] = page.querySelectorAll<HTMLSelectElement>('.filters select');
    change(dates, 'Elapsed window');
    expect(ids()).toContain('CMP-206');
    change(status, 'Active');
    expect(status.value).toBe('Active');
    expect(ids()).not.toContain('CMP-206');
    change(dates, '');
    expect(ids()).toContain('CMP-201');
    expect(ids()).not.toContain('CMP-206');
    change(status, 'Ended');
    change(dates, 'Elapsed window');
    expect(ids()).toEqual(['CMP-206']);
    const row = page.querySelector('tbody tr')!;
    expect(row.querySelector('.stored-lifecycle')?.textContent).toBe('Published');
    expect(row.querySelector('.schedule-window')?.textContent).toBe('Elapsed window');
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

  it('prefills the editor and keeps saved demo drafts isolated from inventory and other records', async () => {
    const { harness, page, button, change, click } = await openPage();
    const field = (name: string) => page.querySelector<HTMLInputElement | HTMLSelectElement>(
      '[formControlName="' + name + '"]',
    )!;
    const preview = () => page.querySelector('.preview')?.textContent;
    button('View details for CMP-201').click();
    harness.detectChanges();
    click('Edit demo campaign');
    expect(document.activeElement?.id).toBe('campaign-editor-title');
    expect(field('title').value).toBe('Ridge Trail Spotlight');
    expect(field('contentId').value).toBe('CMP-201');
    expect(field('budgetCoins').value).toBe('5000');
    change(field('title'), 'Demo draft title');
    change(field('sponsor'), 'Demo Coast Collective');
    change(field('category'), 'District pass');
    expect(field('contentId').value).toBe('');
    change(field('contentId'), 'CMP-202');
    change(field('start'), '2026-12-01');
    change(field('end'), '2026-12-25');
    change(field('audience'), 'Travelers exploring Galle');
    change(field('district'), '');
    change(field('budgetCoins'), '0');
    for (const text of ['Demo draft title', 'Coastal Discovery Pass', '1 Dec 2026', '25 Dec 2026',
      'Travelers exploring Galle', 'All districts', '0 Coins', 'Sponsored by Demo Coast Collective']) {
      expect(preview()).toContain(text);
    }
    click('Save demo draft');
    expect(page.querySelector('#campaign-editor')).toBeNull();
    expect(document.activeElement?.textContent).toBe('Edit demo campaign');
    expect(preview()).toContain('Demo draft title');
    expect(page.querySelector('table')?.textContent).toContain('Ridge Trail Spotlight');
    button('View details for CMP-202').click();
    harness.detectChanges();
    expect(preview()).not.toContain('Demo draft title');
    button('View details for CMP-201').click();
    harness.detectChanges();
    click('Edit demo campaign');
    expect(field('title').value).toBe('Demo draft title');
    change(field('title'), 'Discarded title');
    click('Discard changes');
    expect(preview()).toContain('Demo draft title');
    await harness.navigateByUrl('/preview/dashboard');
    await harness.navigateByUrl('/preview/campaigns');
    await harness.fixture.whenStable();
    harness.detectChanges();
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('button[aria-label="View details for CMP-201"]')!.click();
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('.preview')?.textContent).not.toContain('Demo draft title');
  });

  it('rejects missing fields, invalid date windows and invalid Coins budgets', async () => {
    const { harness, page, button, change } = await openPage();
    button('View details for CMP-201').click();
    harness.detectChanges();
    Array.from(page.querySelectorAll('button')).find(element => element.textContent?.trim() === 'Edit demo campaign')!.click();
    harness.detectChanges();
    const field = (name: string) => page.querySelector<HTMLInputElement>('[formControlName="' + name + '"]')!;
    const submit = () => {
      page.querySelector<HTMLButtonElement>('#campaign-editor button[type="submit"]')!.click();
      harness.detectChanges();
    };
    change(field('title'), '   ');
    change(field('start'), '');
    change(field('end'), '');
    change(field('budgetCoins'), '');
    submit();
    for (const name of ['title', 'start', 'end', 'budgetCoins']) {
      expect(field(name).getAttribute('aria-invalid')).toBe('true');
    }
    change(field('title'), 'Valid title');
    change(field('start'), '2026-12-01');
    for (const date of ['2026-11-30', '2026-12-01']) {
      change(field('end'), date);
      expect(page.querySelector('#campaign-end-error')?.textContent).toContain('after the start date');
    }
    change(field('end'), '2026-12-02');
    for (const budget of ['-1', '1.5', '9007199254740992']) {
      change(field('budgetCoins'), budget);
      submit();
      expect(field('budgetCoins').getAttribute('aria-invalid')).toBe('true');
    }
    change(field('budgetCoins'), '1');
    expect(page.querySelector('#campaign-editor [role="alert"]')).toBeNull();
  });

  it('preserves the saved preview through invalid Coins submissions and saves a corrected budget only to that preview', async () => {
    const { harness, page, ids, button, change, click } = await openPage();
    const inventory = () => ({
      ids: ids(),
      table: page.querySelector('table')?.textContent,
      counts: Array.from(page.querySelectorAll('.metric-value'), metric => metric.textContent),
    });
    const originalInventory = inventory();
    const preview = () => page.querySelector('#campaign-details .preview')?.textContent;
    const budget = () => page.querySelector<HTMLInputElement>('#campaign-editor [formControlName="budgetCoins"]')!;
    const showDetails = (id: string) => {
      button('View details for ' + id).click();
      harness.detectChanges();
    };
    showDetails('CMP-202');
    const otherPreview = preview();
    expect(otherPreview).toContain('3,000 Coins');
    showDetails('CMP-201');
    click('Edit demo campaign');
    change(budget(), '5500');
    click('Save demo draft');
    const savedPreview = preview();
    expect(savedPreview).toContain('5,500 Coins');

    click('Edit demo campaign');
    for (const invalid of ['-1', '1.5', '9007199254740992']) {
      change(budget(), invalid);
      click('Save demo draft');
      expect(page.querySelector('#campaign-editor')).not.toBeNull();
      expect(budget().getAttribute('aria-invalid')).toBe('true');
      expect(page.querySelector('#campaign-budget-error')).not.toBeNull();
    }
    click('Discard changes');
    expect(page.querySelector('#campaign-editor')).toBeNull();
    expect(preview()).toBe(savedPreview);

    click('Edit demo campaign');
    expect(budget().value).toBe('5500');
    change(budget(), '-1');
    click('Save demo draft');
    change(budget(), '0');
    expect(page.querySelector('#campaign-budget-error')).toBeNull();
    click('Save demo draft');
    expect(page.querySelector('#campaign-editor')).toBeNull();
    expect(preview()).toContain('0 Coins');
    expect(preview()).not.toContain('5,500 Coins');
    expect(inventory()).toEqual(originalInventory);
    showDetails('CMP-202');
    expect(preview()).toBe(otherPreview);
    showDetails('CMP-201');
    expect(preview()).toContain('0 Coins');
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
    expect(page.querySelector('.performance')).toBeNull();
    expect(page.textContent).toContain('No matching campaigns to summarize.');
  });
});
