import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GamesManagementFoundation } from './games-management-foundation';

describe('ADM-10 Games Management foundation', () => {
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GamesManagementFoundation],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(GamesManagementFoundation);
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('renders a workspace heading and distinct review sections with named regions', () => {
    expect(element.querySelector('h2')?.textContent).toBe('Games Management');
    const regions = Array.from(element.querySelectorAll('.review-grid > section'));
    expect(regions.map((region) => region.querySelector('h3')?.textContent)).toEqual([
      'Game Inventory & Details',
      'Stage Proof Review',
      'Final Completion & Winner Review',
      'Anti-Cheat Review',
      'Leaderboards',
    ]);
    for (const region of regions) {
      expect(region.getAttribute('aria-labelledby')).toBe(region.querySelector('h3')?.id);
    }
  });

  it('identifies each unavailable Admin contract without implying zero results', () => {
    expect(element.querySelector('wh-status-badge')?.textContent).toContain('Backend integration pending');
    const states = Array.from(element.querySelectorAll('[role="status"]'), (state) => state.textContent);
    expect(states).toEqual([
      expect.stringMatching(/^Unavailable.*inventory and detail APIs/),
      expect.stringMatching(/^Unavailable.*protected evidence access.*stage decisions/),
      expect.stringMatching(/^Unavailable.*protected evidence access.*winner decisions/),
      expect.stringMatching(/^Unavailable.*authorized anti-cheat review contract/),
      expect.stringMatching(/^Unavailable.*Admin Game leaderboard API/),
    ]);
  });

  it('moves focus to the linked heading without leaving the workspace or requesting data', () => {
    const links = Array.from(element.querySelectorAll<HTMLAnchorElement>('nav[aria-label="Games management sections"] a'));
    const headings = Array.from(element.querySelectorAll<HTMLHeadingElement>('h3'));
    expect(links).toHaveLength(headings.length);
    for (const [index, heading] of headings.entries()) {
      const link = links[index];
      expect(link.hash).toBe(`#${heading.id}`);
      expect(link.pathname).toBe(document.location.pathname);
      expect(link.textContent?.trim()).toBe(heading.textContent);
      heading.scrollIntoView = vi.fn();
      link.click();
      expect(document.activeElement).toBe(heading);
      expect(heading.scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    }
    TestBed.inject(HttpTestingController).expectNone(() => true);
  });

  it('renders no data rows, reward balances, private media, or decision controls', () => {
    expect(element.querySelector('table, img, video, audio, iframe, form, button, input, [role="button"]')).toBeNull();
    expect(element.textContent).not.toMatch(/\b\d+\b|\bCoins\b|balance|risk score/i);
    expect(element.querySelectorAll('a')).toHaveLength(5);
    TestBed.inject(HttpTestingController).expectNone(() => true);
  });

  it('uses a wrapping navigation and a grid that can shrink to a single column', () => {
    const navigation = element.querySelector('nav ul')!;
    const grid = element.querySelector('.review-grid')!;
    expect(getComputedStyle(navigation).flexWrap).toBe('wrap');
    expect(getComputedStyle(grid).display).toBe('grid');
    expect(getComputedStyle(grid).gridTemplateColumns).toBe('repeat(auto-fit, minmax(min(100%, 23rem), 1fr))');
  });
});
