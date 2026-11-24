import { Component } from '@angular/core';

const directoryMessages = {
  unavailable: 'Admin user directory unavailable. Authorized access and a verified directory service are required.',
  loading: 'Loading the user directory…',
  empty: 'The user directory contains no accounts.',
  error: 'The user directory could not be loaded.',
  'no-results': 'No accounts match the current search and filters.',
} as const;

@Component({
  standalone: true,
  selector: 'wayhunter-users-page',
  templateUrl: './users.page.html',
  styleUrl: './users.page.scss',
})
export class UsersPage {
  protected readonly accountStatuses = ['Active', 'Suspended'];
  protected readonly directoryState: keyof typeof directoryMessages = 'unavailable';
  protected readonly directoryMessages = directoryMessages;
}
