import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../core/http/api-client.service';

export interface HunterSubmissionDto {
  readonly submissionId: string;
  readonly placeName: string;
  readonly district: string;
  readonly status: number;
  readonly createdAtUtc: string;
  readonly submittedAtUtc: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminHunterApiService {
  private readonly api = inject(ApiClientService);

  listPending(): Observable<readonly HunterSubmissionDto[]> {
    return this.api.getAdminRead('/api/admin/hunter/submissions');
  }
}
