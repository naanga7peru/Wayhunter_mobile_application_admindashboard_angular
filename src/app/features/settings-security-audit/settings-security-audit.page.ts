import { ChangeDetectionStrategy, Component } from '@angular/core';

type ResourceState = 'unavailable' | 'loading' | 'empty' | 'error' | 'no-results';

const resourceMessages: Record<ResourceState, string> = {
  unavailable: 'This information is unavailable until a protected Admin contract and trusted authorization are provided.',
  loading: 'The requested information is loading.',
  empty: 'The authorized request returned no records.',
  error: 'The request failed. No settings or security operation was completed.',
  'no-results': 'No records match the selected filters.',
};

@Component({
  standalone: true,
  selector: 'wayhunter-settings-security-audit-page',
  templateUrl: './settings-security-audit.page.html',
  styleUrl: './settings-security-audit.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAuditPage {
  protected readonly resourceMessages = resourceMessages;
  protected readonly settingsState: ResourceState = 'unavailable';
  protected readonly sessionsState: ResourceState = 'unavailable';
  protected readonly auditState: ResourceState = 'unavailable';
}
