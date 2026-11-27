import { DatePipe } from '@angular/common';
import { Component, DestroyRef, Injector, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { AdminReadBlockedError } from '../../core/http/api-client.service';
import { ApiError } from '../../core/http/api-error';
import { AdminHunterApiService, HunterSubmissionDto } from './admin-hunter-api.service';

const queueMessages = {
  loading: 'Loading verification applications…',
  empty: 'No applications have been submitted.',
  unavailable: 'Verification queue unavailable. Protected Admin access and Hunter Verification APIs are required.',
  error: 'Verification applications could not be loaded.',
  unauthorized: 'Your session does not have access to verification applications.',
  ready: 'Pending applications loaded.',
  'no-results': 'No applications match the current filters.',
} as const;

@Component({
  standalone: true,
  selector: 'wayhunter-hunter-verification-page',
  imports: [DatePipe],
  templateUrl: './hunter-verification.page.html',
  styleUrl: './hunter-verification.page.scss',
})
export class HunterVerificationPage {
  protected readonly stages = ['Pending review', 'Under review', 'Approved', 'Rejected'];
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly live = this.route?.parent?.routeConfig?.path === 'admin';
  protected readonly queueState = signal<keyof typeof queueMessages>('unavailable');
  protected readonly queueMessages = queueMessages;
  protected readonly statuses = ['Draft', 'Pending review', 'Held', 'Approved', 'Rejected'];
  protected readonly pageSize = 20;
  protected readonly page = signal(0);
  protected readonly query = signal('');
  private readonly rows = signal<readonly HunterSubmissionDto[]>([]);
  protected readonly filtered = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.rows().filter(row =>
      [row.placeName, row.district, row.submissionId].some(value => value.toLowerCase().includes(query)),
    );
  });
  protected readonly visible = computed(() =>
    this.filtered().slice(this.page() * this.pageSize, (this.page() + 1) * this.pageSize),
  );

  ngOnInit(): void {
    if (!this.live) return;
    this.queueState.set('loading');
    this.injector.get(AdminHunterApiService).listPending().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: rows => {
        this.rows.set(rows);
        this.queueState.set(rows.length ? 'ready' : 'empty');
      },
      error: (error: unknown) => {
        if (error instanceof AdminReadBlockedError ||
            (error instanceof ApiError && [401, 403].includes(error.status))) {
          this.queueState.set('unauthorized');
        } else {
          this.queueState.set(error instanceof ApiError && error.status === 503 ? 'unavailable' : 'error');
        }
      },
    });
  }

  protected search(value: string): void {
    this.page.set(0);
    this.query.set(value);
  }
}
