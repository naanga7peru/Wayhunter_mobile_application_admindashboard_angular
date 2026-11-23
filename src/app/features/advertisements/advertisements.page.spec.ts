import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { AdvertisementsDemoSource } from './data-access/advertisements-demo';
import { AdvertisementsSnapshot, clickThroughRate } from './models/advertisements-view';

describe('ADM-05 Advertisements Management', () => {
  async function openPage(source?: Pick<AdvertisementsDemoSource, 'load'>) {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), ...(source ? [{ provide: AdvertisementsDemoSource, useValue: source }] : [])],
    });
    const harness = await RouterTestingHarness.create('/preview/advertisements');
    await harness.fixture.whenStable();
    harness.detectChanges();
    const page = harness.routeNativeElement!.querySelector('wayhunter-advertisements-page')!;
    const ids = () => Array.from(page.querySelectorAll('.table-scroll tbody th'), cell => cell.textContent);
    const search = page.querySelector<HTMLInputElement>('input[type="search"]');
    function change(field: HTMLInputElement | HTMLSelectElement, value: string) {
      field.value = value;
      field.dispatchEvent(new Event(field instanceof HTMLSelectElement ? 'change' : 'input'));
      harness.detectChanges();
    }
    return { harness, page, ids, search, change };
  }

  it('shows fixture metrics and a safe aggregate CTR', async () => {
    const { page, ids } = await openPage();
    expect(page.querySelector('.intro')?.textContent).toContain('Demo data');
    expect(Array.from(page.querySelectorAll('.metric-value'), metric => metric.textContent)).toEqual(['10', '2', '2', '1', '1']);
    expect(ids()).toHaveLength(10);
    expect(Array.from(page.querySelectorAll('.performance dd'), metric => metric.textContent)).toEqual(['8,000', '320', '4.0%', '2']);
    expect(clickThroughRate(0, 0)).toBe(0);
    expect(clickThroughRate(1, 8)).toBe(12.5);
  });

  it('searches by ID, title and advertiser and reports an empty state', async () => {
    const { page, ids, search, change } = await openPage();
    expect(search?.labels?.[0].textContent).toContain('Search advertisements');
    change(search!, ' ad-109 ');
    expect(ids()).toEqual(['AD-109']);
    change(search!, 'coastal walks');
    expect(ids()).toEqual(['AD-102']);
    change(search!, 'demo coast collective');
    expect(ids()).toEqual(['AD-102', 'AD-106']);
    change(search!, 'no match');
    expect(ids()).toEqual([]);
    expect(page.querySelector('.results')?.textContent).toContain('0 of 10');
    expect(page.querySelector('wh-empty-state [role="status"]')?.textContent).toContain('No sample advertisements');
  });

  it('filters each field independently, combines filters, and resets the controls', async () => {
    const { harness, page, ids, search, change } = await openPage();
    const [status, creative, placement, date] = page.querySelectorAll('select');
    change(status, 'Active');
    expect(ids()).toEqual(['AD-101', 'AD-102']);
    change(status, '');
    change(creative, 'Square image');
    expect(ids()).toEqual(['AD-102', 'AD-104', 'AD-108']);
    change(creative, '');
    change(placement, 'Home banner');
    expect(ids()).toEqual(['AD-101', 'AD-105', 'AD-110']);
    change(date, '7');
    expect(ids()).toEqual(['AD-105']);
    change(creative, 'Banner');
    change(status, 'Scheduled');
    change(search!, 'highland');
    expect(ids()).toEqual(['AD-105']);
    page.querySelector<HTMLButtonElement>('.filters button')!.click();
    harness.detectChanges();
    expect([search!.value, status.value, creative.value, placement.value, date.value]).toEqual(['', '', '', '', '']);
    expect(ids()).toHaveLength(10);
  });

  it('shows full details and restores keyboard focus on close', async () => {
    const { harness, page } = await openPage();
    const trigger = page.querySelector<HTMLButtonElement>('button[aria-label="View details for AD-101"]')!;
    trigger.click();
    harness.detectChanges();
    const details = page.querySelector('#advertisement-details')!;
    expect(details.textContent).toContain('Ridge Weekend');
    expect(details.textContent).toContain('Demo Ridge Outfitters');
    expect(details.textContent).toContain('10 Nov 2026');
    expect(details.textContent).toContain('4.0% CTR');
    expect(details.textContent).toContain('Review notes');
    expect(document.activeElement?.id).toBe('details-title');
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    harness.detectChanges();
    expect(page.querySelector('#advertisement-details')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('shows the read-only review queue, three previews and sample audit events', async () => {
    const { harness, page } = await openPage();
    expect(page.querySelectorAll('.queue li')).toHaveLength(2);
    expect(page.querySelector('.queue')?.textContent).toContain('Demo Forest Lab');
    expect(page.querySelector('.queue')?.textContent).toContain('Submitted');
    expect(Array.from(page.querySelectorAll('.preview figcaption'), caption => caption.textContent)).toEqual([
      'Banner', 'Square image', 'Promotional card',
    ]);
    expect(page.textContent).toContain('Demo Creative Preview — Not Published');
    expect(page.querySelector('.policy')?.textContent).toContain('DECISION_REQUIRED');
    expect(page.querySelector('wh-data-table')?.textContent).toContain('Delivery paused');

    page.querySelector<HTMLButtonElement>('button[aria-label="Review details for AD-103"]')!.click();
    harness.detectChanges();
    expect(page.querySelector('#advertisement-details')?.textContent).toContain('Pending Review');
    expect(page.querySelector('.request-success, [role="alert"]')).toBeNull();
    expect(Array.from(page.querySelectorAll('button')).some(button => /^(approve|reject|publish|upload)$/i.test(button.textContent!.trim()))).toBe(false);
  });

  it('rejects invalid files and shows and clears metadata for a supported local image', async () => {
    const { harness, page } = await openPage();
    const picker = page.querySelector<HTMLInputElement>('input[type="file"]')!;
    function choose(file: File) {
      Object.defineProperty(picker, 'files', { configurable: true, value: [file] });
      picker.dispatchEvent(new Event('change'));
      harness.detectChanges();
    }
    choose(new File(['example'], 'example.png', { type: 'text/plain' }));
    expect(picker.getAttribute('aria-invalid')).toBe('true');
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('Choose a PNG');
    choose(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.webp', { type: 'image/webp' }));
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('5 MiB');

    choose(new File([new Uint8Array(1024)], 'creative.jpeg', { type: 'image/jpeg' }));
    expect(page.querySelector('.file-meta')?.textContent).toContain('creative.jpeg · image/jpeg · 1.00 KiB');
    expect(page.querySelector('[role="alert"]')).toBeNull();
    page.querySelector<HTMLButtonElement>('.intake button')!.click();
    harness.detectChanges();
    expect(page.querySelector('.file-meta')).toBeNull();
    expect(document.activeElement).toBe(picker);
  });

  it('announces loading and a retryable error deterministically', async () => {
    const sample = await new AdvertisementsDemoSource().load();
    let rejectLoad!: (reason: Error) => void;
    const pending = new Promise<AdvertisementsSnapshot>((_, reject) => { rejectLoad = reject; });
    let attempts = 0;
    const { harness, page, ids } = await openPage({ load: () => ++attempts === 1 ? pending : Promise.resolve(sample) });
    expect(page.querySelector('wh-loading-state [role="status"]')?.textContent).toContain('Loading');
    rejectLoad(new Error('Sample unavailable'));
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('could not be loaded');
    page.querySelector<HTMLButtonElement>('wh-error-state button')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(attempts).toBe(2);
    expect(ids()).toHaveLength(10);
  });
});
