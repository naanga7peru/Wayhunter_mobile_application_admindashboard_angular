import { ChangeDetectionStrategy, Component } from '@angular/core';

type NotificationViewState = 'unavailable' | 'loading' | 'empty' | 'error' | 'no-results';

const stateMessages: Record<NotificationViewState, string> = {
  unavailable: 'Notification data is unavailable until trusted Admin access and operational notification services are ready.',
  loading: 'Notification data is loading.',
  empty: 'An authorized schedule listing returned no records.',
  error: 'Notification data could not be loaded. No notification operation was completed.',
  'no-results': 'No schedules match the selected filters.',
};

@Component({
  standalone: true,
  selector: 'wayhunter-notifications-page',
  templateUrl: './notifications.page.html',
  styleUrl: './notifications.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPage {
  protected readonly viewState: NotificationViewState = 'unavailable';
  protected readonly stateMessages = stateMessages;
  protected readonly scheduleHistoryState: NotificationViewState = 'unavailable';
}
