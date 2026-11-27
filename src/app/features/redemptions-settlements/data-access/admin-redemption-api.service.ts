import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/http/api-client.service';

export interface RedemptionQueueItem {
  readonly requestId: string;
  readonly offerId: string;
  readonly ownerUserId: string;
  readonly ownerName: string;
  readonly costCoins: number;
  readonly requestedAtUtc: string;
  readonly availableStock: number;
}

export interface RedemptionQueuePage {
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly items: readonly RedemptionQueueItem[];
}

@Injectable({ providedIn: 'root' })
export class AdminRedemptionApiService {
  private readonly api = inject(ApiClientService);

  listPending(page: number): Observable<RedemptionQueuePage> {
    return this.api.getAdminRead(`/api/admin/coins-wallet/vouchers/requests?page=${page}&pageSize=20`);
  }
}
