import { Component } from '@angular/core';

const directoryMessages = {
  unavailable: 'Group trip listing unavailable. Search and filtering require authorized Admin access and a verified directory service.',
  loading: 'Loading group trips…',
  empty: 'The group trip directory contains no trips.',
  error: 'The group trip directory could not be loaded.',
  'no-results': 'No group trips match the current filters.',
} as const;

@Component({
  standalone: true,
  selector: 'wayhunter-group-trips-page',
  templateUrl: './group-trips.page.html',
  styleUrl: './group-trips.page.scss',
})
export class GroupTripsPage {
  protected readonly overviewAreas = ['Group Trips', 'Membership', 'Safety Sessions'];
  protected readonly safetySummaryFields = [
    'Trip status', 'Safety session status', 'Aggregate participant information',
    'Hazard summary', 'Separation summary', 'Check-in summary',
  ];
  protected readonly directoryState: keyof typeof directoryMessages = 'unavailable';
  protected readonly directoryMessages = directoryMessages;
}
