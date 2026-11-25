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

  function button(label: string): HTMLButtonElement {
    return Array.from(page.querySelectorAll('button')).find(control => control.textContent?.trim() === label)!;
  }

  function click(control: HTMLButtonElement): void {
    control.click();
    fixture.detectChanges();
  }

  function enterReason(value: string): HTMLTextAreaElement {
    const field = page.querySelector<HTMLTextAreaElement>('textarea')!;
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    return field;
  }

  it('shows an approval confirmation for the selected game and disables submission', async () => {
    await render();
    click(button('Harbour Riddle'));
    click(button('Preview approval'));
    const preview = page.querySelector('#creation-decision-preview')!;
    expect(preview.textContent).toContain('Approval confirmation');
    expect(preview.textContent).toContain('Harbour Riddle by Ravi Sample');
    expect(preview.textContent).toContain('Submission is unavailable');
    expect(button('Approve creation').disabled).toBe(true);
    click(button('Approve creation'));
    expect(page.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(Array.from(page.querySelectorAll('tbody wh-status-badge'), badge => badge.textContent?.trim()))
      .toEqual(Array(3).fill('Pending review'));
  });

  it.each([
    ['empty', '', 'Enter a rejection reason.', true],
    ['whitespace only', ' \t\n\u0085', 'Enter a rejection reason.', true],
    ['one character after trimming', '  x  ', 'Reason meets the preview requirements.', false],
    ['valid', '  Needs clearer clues.  ', 'Reason meets the preview requirements.', false],
    ['1,000 characters after trimming', '  ' + 'a'.repeat(1000) + '  ', 'Reason meets the preview requirements.', false],
    ['over 1,000 characters', 'a'.repeat(1001), 'Use 1,000 characters or fewer after trimming.', true],
  ])('checks a rejection reason that is %s', async (_, value, message, invalid) => {
    await render();
    click(button('Lantern Trail'));
    click(button('Preview rejection'));
    expect(page.querySelector('form')?.textContent).toContain('Rejection reason preview');
    const field = enterReason(value);
    expect(field.required).toBe(true);
    click(button('Check reason'));
    expect(page.querySelector('#creation-reason-feedback')?.textContent).toContain(message);
    expect(field.getAttribute('aria-invalid')).toBe(invalid ? 'true' : null);
    if (invalid) expect(document.activeElement).toBe(field);
    expect(button('Reject creation').disabled).toBe(true);
    click(button('Reject creation'));
    expect(page.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(page.querySelector('tbody tr.active wh-status-badge')?.textContent).toContain('Pending review');
    expect(source).toHaveBeenCalledTimes(1);
  });

  it('restores focus on Cancel and Escape and clears the draft when details close', async () => {
    await render();
    const game = button('Lantern Trail');
    click(game);
    const reject = button('Preview rejection');
    expect(reject.tabIndex).toBe(0);
    click(reject);
    expect(document.activeElement?.id).toBe('creation-decision-title');
    expect(reject.getAttribute('aria-expanded')).toBe('true');
    const field = enterReason('Discard this draft');
    expect(field.tabIndex).toBe(0);
    field.focus();
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(reject);
    expect(reject.getAttribute('aria-expanded')).toBe('false');
    expect(page.querySelector('textarea')).toBeNull();
    click(reject);
    expect(page.querySelector('textarea')?.value).toBe('');
    click(button('Cancel preview'));
    expect(document.activeElement).toBe(reject);
    click(reject);
    click(button('Close details'));
    expect(document.activeElement).toBe(game);
    expect(game.getAttribute('aria-expanded')).toBe('false');
  });

  it('discards the decision draft when search hides the selected game', async () => {
    await render();
    click(button('Lantern Trail'));
    click(button('Preview rejection'));
    enterReason('Draft for Lantern Trail');
    search('Canopy');
    expect(page.querySelector('#creation-decision-preview')).toBeNull();
    click(button('Canopy Quest'));
    click(button('Preview rejection'));
    expect(page.querySelector('textarea')?.value).toBe('');
  });
});
