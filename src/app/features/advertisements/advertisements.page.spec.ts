import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';
import { routes } from '../../app.routes';
import { AdvertisementsDemoSource } from './data-access/advertisements-demo';
import { AdvertisementsSnapshot, clickThroughRate } from './models/advertisements-view';

describe('ADM-05 Advertisements Management', () => {
  async function openPage(source?: Pick<AdvertisementsDemoSource, 'load'>) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes), provideHttpClient(), provideHttpClientTesting(),
        ...(source ? [{ provide: AdvertisementsDemoSource, useValue: source }] : []),
      ],
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

  it('links announced errors to labels and focuses the first invalid field', async () => {
    const { harness, page } = await openPage();
    const click = (label: string) => {
      Array.from(page.querySelectorAll('button')).find(button => button.textContent?.trim() === label)!.click();
      harness.detectChanges();
    };
    click('Create sample advertisement');
    await harness.fixture.whenStable();
    expect(document.activeElement?.textContent).toBe('Create sample advertisement');
    click('Preview draft');
    for (const key of ['title', 'imageUrl', 'startAtUtc', 'endAtUtc', 'placement']) {
      const id = 'ad-editor-' + key;
      const field = page.querySelector('#' + id);
      expect(field?.getAttribute('aria-invalid')).toBe('true');
      expect(field?.getAttribute('aria-describedby')?.split(' ')).toContain(id + '-error');
      expect(page.querySelector('#' + id + '-error')?.getAttribute('role')).toBe('alert');
      expect(page.querySelector('label[for="' + id + '"]')).not.toBeNull();
    }
    expect(document.activeElement?.id).toBe('ad-editor-title');
    expect(page.querySelector('[aria-label="Local draft preview"]')).toBeNull();
    TestBed.inject(HttpTestingController).verify();
  });

  it('previews create and edit without an HTTP request or an inventory change', async () => {
    const { harness, page, change, ids } = await openPage();
    const initialRows = ids();
    const click = (label: string) => {
      Array.from(page.querySelectorAll('button')).find(button => button.textContent?.trim() === label)!.click();
      harness.detectChanges();
    };
    const field = (key: string) => page.querySelector<HTMLInputElement | HTMLSelectElement>('#ad-editor-' + key)!;
    const preview = () => page.querySelector('[aria-label="Local draft preview"]');
    click('Create sample advertisement');
    change(field('title'), '  Local banner  ');
    change(field('imageUrl'), 'https://example.com/banner.webp');
    change(field('startAtUtc'), '2026-12-01T09:30:00Z');
    change(field('endAtUtc'), '2026-12-02T09:30:00Z');
    change(field('placement'), 'HomeBanner');
    click('Preview draft');
    expect(preview()?.querySelector('dd')?.textContent).toBe('Local banner');
    expect(preview()?.querySelector('img, a')).toBeNull();

    click('View details');
    click('Edit sample advertisement');
    expect(preview()).toBeNull();
    expect(field('title').value).toBe(page.querySelector('#details-title')?.textContent);
    expect(field('imageUrl').value).toBe('');
    change(field('title'), 'Edited local title');
    change(field('imageUrl'), 'https://example.com/updated.webp');
    change(field('destinationUrl'), 'https://example.com/travel');
    change(field('placement'), 'SponsoredPoi');
    click('Preview draft');
    expect(preview()?.textContent).toContain('Edited local title');
    expect(preview()?.textContent).toContain('SponsoredPoi');
    expect(ids()).toEqual(initialRows);
    expect(page.querySelector('.table-scroll')?.textContent).not.toContain('Edited local title');
    TestBed.inject(HttpTestingController).expectNone(() => true);
    TestBed.inject(HttpTestingController).verify();
  });

  function chooseFile(harness: RouterTestingHarness, picker: HTMLInputElement, file: File) {
    Object.defineProperty(picker, 'files', { configurable: true, value: [file] });
    picker.dispatchEvent(new Event('change'));
    harness.detectChanges();
  }

  it('renders an empty inventory without preview cards or pending reviews', async () => {
    const { asOf } = await new AdvertisementsDemoSource().load();
    const { page } = await openPage({ load: async () => ({ asOf, ads: [], history: [] }) });

    expect(page.querySelector('.results')?.textContent).toContain('0 of 0');
    expect(page.querySelector('wh-empty-state [role="status"]')?.textContent).toContain('No sample advertisements');
    expect(page.querySelector('.queue [role="status"]')?.textContent).toContain('No sample advertisements are pending review');
    expect(page.querySelector('figure.preview, .table-scroll, wh-error-state')).toBeNull();
    expect(Array.from(page.querySelectorAll('.performance dd'), metric => metric.textContent)).toEqual(['0', '0', '0.0%', '0']);
  });

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
    expect(Array.from(page.querySelectorAll('figure.preview'), preview => ({
      title: preview.querySelector('.creative-art strong')?.textContent,
      sponsor: preview.querySelector('.phone-sponsor')?.textContent,
      placement: preview.querySelector('.phone-header span')?.textContent,
      creative: preview.querySelector('figcaption')?.textContent,
    }))).toEqual([
      { title: 'Ridge Weekend', sponsor: 'Demo Ridge Outfitters', placement: 'Home banner', creative: 'Banner' },
      { title: 'Coastal Walks', sponsor: 'Demo Coast Collective', placement: 'Traveler', creative: 'Square image' },
      { title: 'Forest Loop Challenge', sponsor: 'Demo Forest Lab', placement: 'Game', creative: 'Promotional card' },
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

  it('switches details and restores focus to the results when the latest trigger is filtered out', async () => {
    const { harness, page, search, change } = await openPage();
    const first = page.querySelector<HTMLButtonElement>('button[aria-label="View details for AD-101"]')!;
    const second = page.querySelector<HTMLButtonElement>('button[aria-label="View details for AD-102"]')!;
    first.click();
    harness.detectChanges();
    second.click();
    harness.detectChanges();

    const heading = page.querySelector<HTMLElement>('#details-title')!;
    expect(heading.textContent).toBe('Coastal Walks');
    expect(document.activeElement).toBe(heading);
    expect(first.getAttribute('aria-expanded')).toBe('false');
    expect(first.hasAttribute('aria-controls')).toBe(false);
    expect(second.getAttribute('aria-expanded')).toBe('true');
    expect(second.getAttribute('aria-controls')).toBe('advertisement-details');

    change(search!, 'AD-101');
    expect(second.isConnected).toBe(false);
    heading.focus();
    heading.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    harness.detectChanges();
    expect(page.querySelector('#advertisement-details')).toBeNull();
    expect(document.activeElement).toBe(page.querySelector('.results'));
  });

  it('rejects invalid files and shows and clears metadata for a supported local image', async () => {
    const { harness, page } = await openPage();
    const picker = page.querySelector<HTMLInputElement>('input[type="file"]')!;
    const choose = (file: File) => chooseFile(harness, picker, file);
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

  it('announces an image load failure and restores the preview for the next file', async () => {
    const { harness, page } = await openPage();
    const picker = page.querySelector<HTMLInputElement>('input[type="file"]')!;
    vi.stubGlobal('URL', class extends URL {
      static override createObjectURL = vi.fn()
        .mockReturnValueOnce('blob:first-creative')
        .mockReturnValueOnce('blob:replacement-creative');
      static override revokeObjectURL = vi.fn();
    });
    try {
      chooseFile(harness, picker, new File(['invalid image bytes'], 'broken.png', { type: 'image/png' }));
      const preview = page.querySelector<HTMLImageElement>('.intake img')!;
      expect(preview.alt).toBe('Selected local creative preview');
      preview.dispatchEvent(new Event('error'));
      harness.detectChanges();

      expect(page.querySelector('.intake img')).toBeNull();
      expect(page.querySelector('.intake [role="status"].muted')?.textContent).toContain('could not display the selected image');
      expect(page.querySelector('.file-meta')?.textContent).toContain('broken.png');

      chooseFile(harness, picker, new File(['replacement bytes'], 'replacement.webp', { type: 'image/webp' }));
      expect(page.querySelector('.intake img')?.getAttribute('src')).toBe('blob:replacement-creative');
      expect(page.querySelector('.intake [role="status"].muted')).toBeNull();
    } finally {
      harness.fixture.destroy();
      vi.unstubAllGlobals();
    }
  });

  it('revokes each object URL once when replaced, cleared or destroyed', async () => {
    const { harness, page } = await openPage();
    const picker = page.querySelector<HTMLInputElement>('input[type="file"]')!;
    const revoke = vi.fn();
    vi.stubGlobal('URL', class extends URL {
      static override createObjectURL = vi.fn((blob: Blob) => 'blob:' + (blob as File).name);
      static override revokeObjectURL = revoke;
    });
    try {
      chooseFile(harness, picker, new File(['first'], 'first.png', { type: 'image/png' }));
      expect(revoke).not.toHaveBeenCalled();
      chooseFile(harness, picker, new File(['second'], 'second.png', { type: 'image/png' }));
      expect(revoke.mock.calls).toEqual([['blob:first.png']]);
      page.querySelector<HTMLButtonElement>('.intake button')!.click();
      harness.detectChanges();
      expect(revoke.mock.calls).toEqual([['blob:first.png'], ['blob:second.png']]);

      chooseFile(harness, picker, new File(['third'], 'third.png', { type: 'image/png' }));
      harness.fixture.destroy();
      expect(revoke.mock.calls).toEqual([['blob:first.png'], ['blob:second.png'], ['blob:third.png']]);
    } finally {
      harness.fixture.destroy();
      vi.unstubAllGlobals();
    }
  });

  it('shows a source error and restores inventory and metrics after Retry', async () => {
    const sample = await new AdvertisementsDemoSource().load();
    let rejectInitial!: (reason: Error) => void;
    const initial = new Promise<AdvertisementsSnapshot>((_, reject) => { rejectInitial = reject; });
    let resolveRetry!: (snapshot: AdvertisementsSnapshot) => void;
    const recovery = new Promise<AdvertisementsSnapshot>(resolve => { resolveRetry = resolve; });
    const load = vi.fn<AdvertisementsDemoSource['load']>()
      .mockReturnValueOnce(initial)
      .mockReturnValueOnce(recovery);
    const { harness, page, ids, change } = await openPage({ load });
    const loadingMessage = () => page.querySelector('wh-loading-state [role="status"]')?.textContent?.trim();
    expect(load).toHaveBeenCalledTimes(1);
    expect(loadingMessage()).toBe('Loading sample advertisements…');

    rejectInitial(new Error('Sample unavailable'));
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(page.querySelector('wh-error-state [role="alert"]')?.textContent).toContain('Sample advertisements could not be loaded.');
    expect(page.querySelector('wh-empty-state, .table-scroll, .performance, .metric-value')).toBeNull();
    expect(page.textContent).not.toMatch(/No (?:sample )?advertisements/i);
    const retry = page.querySelector<HTMLButtonElement>('wh-error-state button')!;
    expect(retry.textContent?.trim()).toBe('Retry loading samples');
    expect(retry.disabled).toBe(false);

    retry.click();
    harness.detectChanges();
    expect(load).toHaveBeenCalledTimes(2);
    expect(loadingMessage()).toBe('Loading sample advertisements…');

    resolveRetry(sample);
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(page.querySelector('wh-error-state, wh-loading-state')).toBeNull();
    expect(ids()).toEqual(sample.ads.map(ad => ad.id));
    expect(Array.from(page.querySelectorAll('.metric-value'), metric => metric.textContent)).toEqual(['10', '2', '2', '1', '1']);
    expect(Array.from(page.querySelectorAll('.performance dd'), metric => metric.textContent)).toEqual(['8,000', '320', '4.0%', '2']);

    const search = page.querySelector<HTMLInputElement>('input[type="search"]')!;
    change(search, 'coastal walks');
    expect(ids()).toEqual(['AD-102']);
    page.querySelector<HTMLButtonElement>('button[aria-label="View details for AD-102"]')!.click();
    harness.detectChanges();
    expect(page.querySelector('#details-title')?.textContent).toBe('Coastal Walks');
    expect(page.querySelector('#advertisement-details')?.textContent).toContain('Demo Coast Collective');
  });
});
