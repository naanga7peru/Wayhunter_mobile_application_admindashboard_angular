import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiClientService } from '../../../core/http/api-client.service';
import type { GameAdminQueueItemDto } from '../game-creation-queue';

@Injectable({ providedIn: 'root' })
export class AdminGamesQueueApiService {
  private readonly api = inject(ApiClientService);

  list(): Observable<readonly GameAdminQueueItemDto[]> {
    return this.api
      .getAdminRead<readonly GameAdminQueueItemDto[]>('/api/admin/games/reviews/pending')
      .pipe(map((rows) => rows.map(mapQueueItem)));
  }
}

function mapQueueItem({
  gameId,
  creatorUserId,
  creatorNameSnapshot,
  gameTitle,
  submittedAtUtc,
}: GameAdminQueueItemDto): GameAdminQueueItemDto {
  return { gameId, creatorUserId, creatorNameSnapshot, gameTitle, submittedAtUtc };
}
