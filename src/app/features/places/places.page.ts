import { Component } from '@angular/core';

const catalogMessages = {
  unavailable: 'Admin Places catalog unavailable. Authorized access and a verified catalog service are required.',
  loading: 'Loading the Places catalog…',
  empty: 'No places are available in the catalog.',
  error: 'The Places catalog could not be loaded.',
  'no-results': 'No places match the current filters.',
} as const;

@Component({
  standalone: true,
  selector: 'wayhunter-places-page',
  templateUrl: './places.page.html',
  styleUrl: './places.page.scss',
})
export class PlacesPage {
  protected readonly catalogSections = ['Published places', 'Pending review', 'Hidden places'];
  protected readonly catalogState: keyof typeof catalogMessages = 'unavailable';
  protected readonly catalogMessages = catalogMessages;
}
