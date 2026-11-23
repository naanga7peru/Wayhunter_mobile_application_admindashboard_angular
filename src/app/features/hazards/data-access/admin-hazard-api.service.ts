import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { ApiClientService } from '../../../core/http/api-client.service';
import { HazardWarningDto, ResolveTripHazardRequest } from '../models/hazard-actions';

@Injectable({ providedIn: 'root' })
export class AdminHazardApiService {
  private readonly api = inject(ApiClientService);

  verify(hazardId: string): Observable<HazardWarningDto> {
    return this.api.postAdminHazardAction<HazardWarningDto>(hazardId, 'verify', null);
  }

  resolve(hazardId: string, request: ResolveTripHazardRequest): Observable<HazardWarningDto> {
    const reason = request?.reason;
    if (typeof reason !== 'string' || !reason.trim()) {
      return throwError(() => new TypeError('A resolution reason is required.'));
    }

    return this.api.postAdminHazardAction<HazardWarningDto>(hazardId, 'resolve', { reason });
  }
}
