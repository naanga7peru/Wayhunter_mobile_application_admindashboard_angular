# ADM-10 Games Management integration

## Baseline

Angular branch `feature/m7-adm10-management-foundation` started at `f98734fa458acfc9769dabae8a004931f46c00b6`. GitHub's `devlop` was `1e0ae850a4e4c16b0b146670d32521a1eb340424`, the merge of PR #47. Taking that baseline would incorporate the explicitly excluded PR. The foundation stays on the original commit and adds files only. The fetch also reported a bad object on the separate local ref `fix/m7-dashboard-postmerge-qa`.

## Backend source audit

`CODE_VERIFIED` refers to Backend source at `develop` commit `1db99995c1049fe136c245d3e73c64d258ad1929`, which matched the remote tip at audit time. Deployment and runtime availability were outside this audit.

| Feature | Classification and evidence | Required before integration |
| --- | --- | --- |
| Creation queue and creation decisions | **Verified Admin HTTP endpoints.** `GameReviewController` exposes `GET /api/admin/games/reviews/pending` and `POST /api/admin/games/reviews/{gameId}/approve` and `/reject`. `SqlGameAdminReviewStore` projects the pending queue to `GameAdminQueueItemDto`. Rejection accepts `GameReviewRejectionRequest` with a reason. `Program.cs` registers the controller only when shared authentication and Games SQL persistence are enabled. | M1 confirms trusted Admin session and deployed policy. M5 confirms production DTOs, error handling and retry semantics before wiring writes. Creation decisions are outside this foundation. |
| Game inventory and details | **Missing Admin HTTP contract.** The creation queue is limited to pending submissions. Game entities, repositories and public DTOs provide domain and application support. | M5 approves Admin inventory and detail contracts, including archived-state visibility. M1 approves read access. |
| Stage proof review | **Application/domain code only.** `GetPendingGameStageProofsService`, `GamePendingStageProofDto`, `GameStageProofDecisionCommand` and the decision authorizer interface exist. Admin HTTP for listing, protected evidence access and decisions is missing. | M5 approves queue, evidence and decision contracts. M1 approves reviewer and evidence access. |
| Final completion and winner review | **Application/domain code only.** `GameCompletionResult` models completion and `GrantApprovedGameWinnerCoinsHandler` handles approved winner reward input. Admin HTTP for eligible completions, protected evidence and winner decisions is missing. | M5 approves the decision and audit contract, verifies eligibility, expiry and single-winner enforcement. M1 approves reviewer access. M6 approves the idempotent reward handoff and server-confirmed reward state. |
| Anti-cheat review | **Missing Admin HTTP contract.** Proof validation and the separate `GameModerationService` provide application/domain behavior. The creation reject action is scoped to creation review. | M5 approves reviewable evidence, signals, actions and audit semantics. M1 approves read and action permissions. |
| Game leaderboards | **Missing Admin HTTP contract.** The identity navigation contract identifies a Game leaderboard destination, but the audited API has no Admin Game ranking action. | M5 and M6 approve ranking eligibility, authoritative reward inputs, tie ordering, response fields and refresh behavior. M1 confirms permitted fields and access. |

The creation controller uses the `M3AdminSafetyMonitoring` policy. It requires an authenticated shared-session principal, a trusted user identity and a server-resolved Admin role from a bearer token. An Angular route guard alone cannot authorize Backend operations.

## Business rules and Angular handoff

- **SOURCE.** Draft Master BRD v2.1 sections 06, 07 and 11 cover Games, leaderboards and ADM-10. The active owner rules and central Games rules keep creation review separate from player review. A game is archived 30 days after creation approval, preserving its record and creator history. Expired games cannot yield a new winning approval. The creator is ineligible to win, and only one verified winner may earn the winner reward once. Game rankings use eligible approved Game-earned Coins.
- **PROPOSED.** After the team approves an Angular baseline containing the creation preview, import `GamesManagementFoundation` into the existing guarded Games page alongside the creation queue. Keep the heading hierarchy and unique section IDs. Verify the combined page at narrow widths and with keyboard navigation.
- **DECISION_REQUIRED.** Obtain M1 authorization and M5/M6 contract approvals listed above before exposing data or actions. Use the existing Admin API client boundary for future approved calls, with authorization, denial and privacy tests. Confirm production route activation separately.

## Verification

- Focused foundation tests passed, 5 of 5.
- Admin workspace integration tests passed, 28 of 28.
- Combined Games and guards tests passed, 50 of 50.
- Full Angular suite passed, 299 tests across 29 files.
- Production build passed with a 299.61 kB initial bundle. The standalone foundation is exercised through tests and is not routed in production.
