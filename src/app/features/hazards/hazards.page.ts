import { Component } from '@angular/core';

const reportMessages = {
  unavailable: 'Hazard reports unavailable. Searching and filtering reports requires an authorized Admin hazard catalog.',
  loading: 'Loading hazard reports…',
  empty: 'The hazard catalog contains no reports.',
  error: 'Hazard reports could not be loaded.',
  'no-results': 'No hazard reports match the current filters.',
} as const;

@Component({
  standalone: true,
  selector: 'wayhunter-hazards-page',
  templateUrl: './hazards.page.html',
  styleUrl: './hazards.page.scss',
})
export class HazardsPage {
  protected readonly reviewStages = ['Pending Verification', 'Verified', 'Resolved'];
  protected readonly reportState: keyof typeof reportMessages = 'unavailable';
  protected readonly reportMessages = reportMessages;
}
