import { Component } from '@angular/core';

const queueMessages = {
  loading: 'Loading verification applications…',
  empty: 'No applications have been submitted.',
  unavailable: 'Verification queue unavailable. Protected Admin access and Hunter Verification APIs are required.',
  error: 'Verification applications could not be loaded.',
  'no-results': 'No applications match the current filters.',
} as const;

@Component({
  standalone: true,
  selector: 'wayhunter-hunter-verification-page',
  templateUrl: './hunter-verification.page.html',
  styleUrl: './hunter-verification.page.scss',
})
export class HunterVerificationPage {
  protected readonly stages = ['Pending review', 'Under review', 'Approved', 'Rejected'];
  protected readonly queueState: keyof typeof queueMessages = 'unavailable';
  protected readonly queueMessages = queueMessages;
}
