import { Component } from '@angular/core';

const activityMessages = {
  unavailable: 'Trip listing unavailable. Searching and filtering trips requires an authorized Admin trip catalog.',
  loading: 'Loading trip activity…',
  empty: 'The trip catalog contains no trips.',
  error: 'Trip activity could not be loaded.',
  'no-results': 'No trips match the current search and filters.',
} as const;

@Component({
  standalone: true,
  selector: 'wayhunter-trips-historical-routes-page',
  templateUrl: './trips-historical-routes.page.html',
  styleUrl: './trips-historical-routes.page.scss',
})
export class TripsRoutesPage {
  protected readonly tripStatuses = ['Active Trips', 'Completed Trips'];
  protected readonly activityState: keyof typeof activityMessages = 'unavailable';
  protected readonly activityMessages = activityMessages;
}
