import { InjectionToken } from '@angular/core';

export interface GameAdminQueueItemDto {
  readonly gameId: string;
  readonly creatorUserId: string;
  readonly creatorNameSnapshot: string;
  readonly gameTitle: string;
  readonly submittedAtUtc: string;
}

export const GAME_CREATION_QUEUE_SOURCE = new InjectionToken<() => Promise<readonly GameAdminQueueItemDto[]>>(
  'Game creation queue source',
  {
    factory: () => async () => (await import('./data-access/game-creation-queue-demo')).DEMO_GAME_CREATION_QUEUE,
  },
);
