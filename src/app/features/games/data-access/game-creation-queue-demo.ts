import type { GameAdminQueueItemDto } from '../game-creation-queue';

export const DEMO_GAME_CREATION_QUEUE = [
  {
    gameId: '00000000-0000-4000-8000-000000000001',
    creatorUserId: 'demo-creator-101',
    creatorNameSnapshot: 'Asha Example',
    gameTitle: 'Lantern Trail',
    submittedAtUtc: '2026-11-23T14:30:00Z',
  },
  {
    gameId: '00000000-0000-4000-8000-000000000002',
    creatorUserId: 'demo-creator-102',
    creatorNameSnapshot: 'Ravi Sample',
    gameTitle: 'Harbour Riddle',
    submittedAtUtc: '2026-11-23T12:15:00Z',
  },
  {
    gameId: '00000000-0000-4000-8000-000000000003',
    creatorUserId: 'demo-creator-103',
    creatorNameSnapshot: 'Mira Demo',
    gameTitle: 'Canopy Quest',
    submittedAtUtc: '2026-11-22T09:45:00Z',
  },
] as const satisfies readonly GameAdminQueueItemDto[];
