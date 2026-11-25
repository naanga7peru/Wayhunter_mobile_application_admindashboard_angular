import { inject, Injectable } from '@angular/core';
import { map, Observable, throwError } from 'rxjs';
import { ApiClientService } from '../../../core/http/api-client.service';
import { isApiGuid } from '../../../core/http/is-api-guid';

export interface AdvertisementDto {
  readonly id: string;
  readonly title: string;
  readonly imageUrl: string;
  readonly destinationUrl: string | null;
  readonly startAtUtc: string;
  readonly endAtUtc: string;
  readonly isEnabled: boolean;
  readonly placement: 0 | 1 | 2;
  readonly status: 0 | 1 | 2 | 3;
}

const advertisementsPath = '/api/admin/advertisements';

@Injectable({ providedIn: 'root' })
export class AdminAdvertisementsApiService {
  private readonly api = inject(ApiClientService);

  list(): Observable<readonly AdvertisementDto[]> {
    return this.api
      .getAdminRead<readonly AdvertisementDto[]>(advertisementsPath)
      .pipe(map((rows) => rows.map(mapAdvertisement)));
  }

  getById(advertisementId: string): Observable<AdvertisementDto> {
    if (!isApiGuid(advertisementId)) {
      return throwError(() => new TypeError('Advertisement ID must be a non-empty GUID.'));
    }

    return this.api
      .getAdminRead<AdvertisementDto>(`${advertisementsPath}/${advertisementId}`)
      .pipe(map(mapAdvertisement));
  }
}

function mapAdvertisement({
  id,
  title,
  imageUrl,
  destinationUrl,
  startAtUtc,
  endAtUtc,
  isEnabled,
  placement,
  status,
}: AdvertisementDto): AdvertisementDto {
  return {
    id,
    title,
    imageUrl,
    destinationUrl,
    startAtUtc,
    endAtUtc,
    isEnabled,
    placement,
    status,
  };
}
