import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PlacesPage } from './places.page';

describe('Places Management', () => {
  let page: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(PlacesPage);
    fixture.detectChanges();
    page = fixture.nativeElement;
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('announces the unavailable catalog and shows overview labels without counts', () => {
    expect(page.querySelector('h2')?.textContent).toBe('Places Management');
    expect(page.querySelector('header p')?.textContent).toContain('inspect publication history');
    expect(page.querySelector('#places-list-status[role="status"]')?.textContent)
      .toContain('Admin Places catalog unavailable');
    expect(Array.from(page.querySelectorAll('li'), (item) => item.textContent?.trim())).toEqual([
      'Published places', 'Pending review', 'Hidden places',
    ]);
  });

  it('provides labeled filters while preventing search submission', () => {
    const form = page.querySelector('form')!;
    expect(form.getAttribute('aria-describedby')).toBe('places-list-status');
    for (const [id, label] of [
      ['places-query', 'Place name or reference'],
      ['places-category', 'Category'],
      ['places-status', 'Publication status'],
    ]) {
      expect(form.querySelector(`label[for="${id}"]`)?.textContent).toBe(label);
      expect(form.querySelector(`#${id}:disabled`)).not.toBeNull();
    }
    expect(form.querySelector('button:disabled')).not.toBeNull();
    expect(form.dispatchEvent(new Event('submit', { cancelable: true }))).toBe(false);
  });

  it('presents the catalog and details as separate panels with a keyboard-scrollable table', () => {
    const panels = page.querySelectorAll('.review-grid > section');
    expect(Array.from(panels, (panel) => panel.getAttribute('aria-labelledby'))).toEqual([
      'places-list-title', 'places-details-title',
    ]);
    const table = panels[0].querySelector('[role="region"][aria-label="Places catalog table"][tabindex="0"] table')!;
    expect(table.getAttribute('aria-describedby')).toBe('places-list-status');
    expect(Array.from(table.querySelectorAll('th[scope="col"]'), (cell) => cell.textContent)).toEqual([
      'Place name or reference', 'Category', 'District or region', 'Publication status', 'Last updated', 'Details',
    ]);
    expect(table.querySelectorAll('tbody tr')).toHaveLength(0);
  });

  it('keeps Edit, Merge and Hide disabled and sends no requests on render or interaction', () => {
    expect(page.querySelector('img, video')).toBeNull();
    expect(page.querySelectorAll('input:enabled, select:enabled, button:enabled')).toHaveLength(0);
    const group = page.querySelector('[role="group"][aria-describedby="places-moderation-status"]')!;
    const actions = Array.from(group.querySelectorAll('button'));
    expect(actions.map((button) => button.textContent?.trim())).toEqual([
      'Edit place', 'Merge duplicates', 'Hide place',
    ]);
    for (const action of actions) {
      expect(action.disabled).toBe(true);
      action.click();
    }
    TestBed.inject(HttpTestingController).expectNone(() => true);
  });
});
