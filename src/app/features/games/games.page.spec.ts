import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { vi } from 'vitest';
import { DEMO_GAME_CREATION_QUEUE } from './data-access/game-creation-queue-demo';
import { GAME_CREATION_QUEUE_SOURCE, GameAdminQueueItemDto } from './game-creation-queue';
import { GamesPage } from './games.page';

describe('Game creation queue', () => {
  let fixture: ComponentFixture<GamesPage>;
  let page: HTMLElement;
  const source = vi.fn<() => Promise<readonly GameAdminQueueItemDto[]>>();

  beforeEach(() => {
    source.mockReset().mockResolvedValue(DEMO_GAME_CREATION_QUEUE);
    TestBed.configureTestingModule({
      imports: [GamesPage],
      providers: [
        { provide: ActivatedRoute, useValue: { parent: { routeConfig: { path: 'preview' } } } },
        { provide: GAME_CREATION_QUEUE_SOURCE, useValue: source },
      ],
    });
    fixture = TestBed.createComponent(GamesPage);
    page = fixture.nativeElement;
  });

  async function render(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function search(value: string): void {
    const input = page.querySelector<HTMLInputElement>('input[type="search"]')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('renders the pending queue, demo disclosure, count and presentation status', async () => {
    await render();
    expect(page.textContent).toContain('Pending Game Creation Queue');
    expect(page.textContent).toContain('Demo data');
    expect(page.querySelector('.pending-total')?.textContent).toContain('3 Pending submissions');
    expect(page.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(Array.from(page.querySelectorAll('tbody wh-status-badge'), badge => badge.textContent?.trim()))
      .toEqual(Array(3).fill('Pending review'));
  });

  it('shows the creator name snapshot and matching ID on the same row', async () => {
    await render();
    const cells = page.querySelectorAll('tbody tr:first-child td');
    expect(cells[0].textContent).toBe('Asha Example');
    expect(cells[1].textContent).toBe('demo-creator-101');
  });

  it('converts an offset timestamp to UTC and preserves the machine-readable datetime', async () => {
    source.mockResolvedValue([{ ...DEMO_GAME_CREATION_QUEUE[0], submittedAtUtc: '2026-11-23T20:00:00+05:30' }]);
    await render();
    const time = page.querySelector('tbody time');
    expect(time?.textContent).toBe('23 Nov 2026, 14:30:00 UTC');
    expect(time?.getAttribute('datetime')).toBe('2026-11-23T20:00:00+05:30');
  });

  it.each([
    ['title', '  LANTERN  ', 'Lantern Trail'],
    ['creator name', 'ravi sample', 'Harbour Riddle'],
    ['creator ID', 'demo-creator-103', 'Canopy Quest'],
  ])('searches by %s', async (_, query, title) => {
    await render();
    search(query);
    expect(Array.from(page.querySelectorAll('tbody th'), cell => cell.textContent?.trim())).toEqual([title]);
    expect(page.querySelector('.pending-total')?.textContent).toContain('3 Pending submissions');
  });

  it('opens read-only submission details and clears an excluded selection', async () => {
    await render();
    const button = page.querySelector<HTMLButtonElement>('tbody button')!;
    button.click();
    fixture.detectChanges();
    const details = page.querySelector('#game-creation-details')!;
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(details.textContent).toContain(DEMO_GAME_CREATION_QUEUE[0].gameId);
    expect(details.textContent).toContain('Asha Example');
    expect(details.textContent).toContain('demo-creator-101');
    expect(details.querySelector('input, select, textarea, [contenteditable]')).toBeNull();
    search('Canopy');
    search('');
    expect(details.querySelector('dl')).toBeNull();
  });

  it('uses a native keyboard trigger and returns focus on Escape', async () => {
    await render();
    const button = page.querySelector<HTMLButtonElement>('tbody button')!;
    button.focus();
    expect(document.activeElement).toBe(button);
    expect(button.tabIndex).toBe(0);
    // jsdom does not synthesize native Enter/Space activation.
    button.click();
    fixture.detectChanges();
    const heading = page.querySelector('#game-creation-details-title')!;
    expect(document.activeElement).toBe(heading);
    heading.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(button);
  });

  it('announces loading before the source resolves', async () => {
    let resolve!: (items: readonly GameAdminQueueItemDto[]) => void;
    source.mockReturnValue(new Promise(complete => { resolve = complete; }));
    fixture.detectChanges();
    expect(page.querySelector('wh-loading-state [role="status"]')?.textContent).toContain('Loading sample submissions');
    expect(page.querySelector('table')).toBeNull();
    resolve(DEMO_GAME_CREATION_QUEUE);
    await render();
    expect(page.querySelector('table')).toBeTruthy();
  });

  it('shows zero pending submissions for an empty source', async () => {
    source.mockResolvedValue([]);
    await render();
    expect(page.querySelector('.pending-total')?.textContent).toContain('0 Pending submissions');
    expect(page.querySelector('wh-empty-state')?.textContent).toContain('no pending sample submissions');
  });

  it('distinguishes no matches from an empty queue', async () => {
    await render();
    search('missing');
    expect(page.querySelector('wh-empty-state')?.textContent).toContain('No sample submissions match your search');
    expect(page.querySelector('table')).toBeNull();
  });

  it('shows a source error and reloads when Retry is clicked', async () => {
    source.mockRejectedValueOnce(new Error('Fixture failed'));
    await render();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('could not be loaded');
    page.querySelector<HTMLButtonElement>('wh-error-state button')!.click();
    await render();
    expect(source).toHaveBeenCalledTimes(2);
    expect(page.querySelector('tbody tr')).toBeTruthy();
    expect(page.querySelector('[role="alert"]')).toBeNull();
  });

  it('exposes only details controls when sample submissions are loaded', async () => {
    await render();
    page.querySelector<HTMLButtonElement>('tbody button')!.click();
    fixture.detectChanges();
    expect(Array.from(page.querySelectorAll('button'), button => button.textContent?.trim()))
      .toEqual(['Lantern Trail', 'Harbour Riddle', 'Canopy Quest', 'Close details']);
    expect(page.querySelector('form')).toBeNull();
  });
});
