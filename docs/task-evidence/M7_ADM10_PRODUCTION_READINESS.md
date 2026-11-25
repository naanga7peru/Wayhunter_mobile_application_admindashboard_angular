# ADM-10 production integration readiness

Audit date 2026-11-25 · Angular implementation Thasvini (M7) · Backend Games M5 · Admin authentication M1 · Coins and leaderboard M6, with M5 supplying Games eligibility and source events.

## 1. Completion status and audit baseline

**Release blocked.** ADM-10 has a development-only creation queue and decision preview, a standalone management foundation, and an unwired read adapter. Backend source contains the three creation-review actions. The browser Admin session, safe write integration, and remaining Admin Games contracts are outstanding. Runtime and deployment behavior remain unverified.

- **CODE_VERIFIED — Angular.** The starting tree was clean. Branch `feature/m7-adm10-production-readiness`, local `origin/devlop`, and GitHub `refs/heads/devlop` all resolved to `615f0234c89da8b827ae17c64d81601cce55da4d`. Remote tips were checked via read-only `git ls-remote`. Git reported the existing broken `refs/heads/fix/m7-dashboard-postmerge-qa`.
- **CODE_VERIFIED — Backend.** Inspected Git objects at `1db99995c1049fe136c245d3e73c64d258ad1929`. Local `origin/develop` matched the GitHub `refs/heads/develop` tip. The sibling checkout's local `develop` was older (`416c261fffa054acd0b9652d880f9974d6163669`) and lacked the creation-review controller.
- **CODE_VERIFIED — pending workspace.** The separate full-page worktree at `b21e35a` imports the foundation into the Games page. The audit baseline has neither that import nor its template placement. PR #49 remains a review dependency for the combined workspace. [PR #49](https://github.com/naanga7peru/Wayhunter_mobile_application_admindashboard_angular/pull/49)
- **SOURCE.** Draft Master BRD v2.1 §§06, 07, 11 (GA-001–009, LB-002/003, ADM-10), Admin 17 Modules Working Process v1.1 module 10, and the central M5 winner/expiry, camera proof, and milestones notes inform this audit. Active owner rules resolve the older winner and expiry ambiguities. Creation and player review are separate. Publication follows creation approval. At 30 days from approval, archive the game, remove it from discovery/play and retain its record and creator history. Block new starts, resumes, completions and winner approvals at expiry even before archival runs. The creator is ineligible and at most one Admin-verified winner earns the winner reward. The scope files reflect the standing module allocation. This handoff uses the requested M7 Angular assignment for this task. [Active rules](../second-brain/ACTIVE_RULES.md) · [Context](../second-brain/CONTEXT.md) · [M5 scope](../members/M5_SCOPE.md) · [M7 scope](../members/M7_SCOPE.md) · [Second Brain source index](../SECOND_BRAIN_SOURCE.md)

Here `CODE_VERIFIED` identifies checked-in behavior at the pinned revisions, `SOURCE` identifies documented requirements, `PROPOSED` identifies owner deliverables for review, and `DECISION_REQUIRED` identifies unresolved agreements.

## 2. Verified Admin Games endpoint inventory

The complete Admin Games HTTP surface found in the pinned Backend source is below. All three actions use `M3AdminSafetyMonitoring`. DTO member names in the table follow C# unless shown as JSON. [GameReviewController](https://github.com/naanga7peru/Wayhunter_mobile_application_Backend/blob/1db99995c1049fe136c245d3e73c64d258ad1929/src/Wayhunter.Api/Controllers/Admin/Games/GameReviewController.cs)

| Method and path | Request | Successful response and behavior |
| --- | --- | --- |
| `GET /api/admin/games/reviews/pending` | No body or query parameters declared. | 200 array of `GameAdminQueueItemDto` with `GameId` (GUID), `CreatorUserId`, `CreatorNameSnapshot`, `GameTitle` (strings) and `SubmittedAtUtc` (DateTimeOffset). SQL selects pending games with a submission timestamp, joins the user display name at read time, and orders by submission time then Game ID. No paging or server search. Confirm creator account eligibility and snapshot semantics with M5. |
| `POST /api/admin/games/reviews/{gameId}/approve` | GUID path parameter. No body parameter. The server resolves the actor and generates decision, event and correlation identifiers. | 200 with `gameId`, `status` (literal `Published`), `approvedAtUtc`, `expiresAtUtc` (approval time plus 30 days) and `creatorRewardEventId`. SQL commits the publication and approval record. The event ID identifies the reward source and does not confirm a credited ledger entry. |
| `POST /api/admin/games/reviews/{gameId}/reject` | GUID path parameter and `GameReviewRejectionRequest(Reason)`, sent as JSON `reason`. Server trims and requires 1–1,000 UTF-16 code units after trimming. | 200 `GameModerationAuditRecord` with `DecisionId`, `GameId`, `AdminUserId`, `Action`, `Reason`, `OccurredAtUtc`, `ResultingStatus`, `CorrelationId`. Audit action/status are C# enums. Pin their wire encoding in a contract test. |

The POST handlers map unknown Games to 404, argument failures to 400 with `{ error }`, and invalid state to 409 with `{ error }`. Route matching and model binding can reject requests before the handlers. In this configuration `Program.cs` also installs an invalid-model-state factory carrying `GAME_DRAFT_INVALID`; M5 should confirm the exact rejection validation response in HTTP tests. Approval and rejection enforce pending state in the store. Each HTTP submission generates fresh IDs, so the internal replay checks do not give a browser a stable replay key. A repeat after commit can return 409. A timed-out write needs authoritative reconciliation before another submission. [SQL review store](https://github.com/naanga7peru/Wayhunter_mobile_application_Backend/blob/1db99995c1049fe136c245d3e73c64d258ad1929/src/Wayhunter.Infrastructure/Persistence/Repositories/Games/SqlGameAdminReviewStore.cs)

**Source activation.** Controller discovery requires both `Identity:EnableSharedAuthentication` and `Games:EnableSqlPersistence`. `Games:EnableDevelopmentDraftHttpApi` is a separate development draft option. The attempt SQL writer has a separate Development-only gate, and `Games:EnableExpiryWorker` is a separate opt-in under Games SQL. SQL readiness requires the shared database and applicable migrations. The Coins writer and worker gates are listed below. No deployment settings or HTTP traffic were inspected. [Backend Program.cs](https://github.com/naanga7peru/Wayhunter_mobile_application_Backend/blob/1db99995c1049fe136c245d3e73c64d258ad1929/src/Wayhunter.Api/Program.cs) · [Games registration](https://github.com/naanga7peru/Wayhunter_mobile_application_Backend/blob/1db99995c1049fe136c245d3e73c64d258ad1929/src/Wayhunter.Api/Extensions/GamesServiceCollectionExtensions.cs)

## 3. Angular-to-Backend integration matrix

| Area | Audited Angular behavior | Backend status and owner gate |
| --- | --- | --- |
| Creation queue and summary | `GamesPage` loads synthetic fixture rows only in development `/preview/games`. Includes loading, failure/retry, empty/no-match states, search by title or creator name/ID, and an inline row summary. | Pending GET is source-verified. Five fields match the adapter. M1 secure access and M5 review detail are needed for actual review. |
| Queue adapter | `AdminGamesQueueApiService.list()` calls `getAdminRead` and projects the five queue fields. The page injects the fixture source and has no production load path. | M7 can wire the verified read after M1 acceptance and M5 contract confirmation. |
| Approve and reject | Local approval confirmation and trimmed rejection reason checking. Final controls are disabled. No write, state change or reward. | Two creation POSTs are source-verified. M1 protected write authorization and M5 stale-state/retry/error contract gate M7 wiring. |
| Inventory and detail | Standalone foundation has section navigation and availability messaging. | M5 Admin list/detail and review detail missing. |
| Stage proof, final winner, anti-cheat | Foundation availability sections. | M5 Admin HTTP contracts missing. M1 evidence access and M6 winner reward acceptance required. |
| Leaderboard | Foundation availability section. | Admin ranking contract missing. M6 ranking ledger inputs and M5 eligibility, with M1 access review. |
| Shared client and route boundary | `ApiClientService.getAdminRead` checks access at subscription and builds the request from the configured base URL. The action helper is Hazard-specific. `AdminAccessService` always denies. `authRequiredGuard` sends blocked `/admin/games` navigation to login and `devPreviewGuard` blocks preview in production. | M1 owns approved session and credential wiring. M7 needs a scoped Games action path after M1/M5 approval. |

[Games page](../../src/app/features/games/games.page.ts) · [Read adapter](../../src/app/features/games/data-access/admin-games-queue-api.service.ts) · [Foundation](../../src/app/features/games/management/games-management-foundation.ts) · [Shared client](../../src/app/core/http/api-client.service.ts) · [Admin access](../../src/app/core/permissions/admin-access.service.ts) · [Guards](../../src/app/core/guards/dev-preview.guard.ts)

## 4. M1 authentication and protected writes

- **CODE_VERIFIED.** The Games controller uses the existing safety-monitoring policy. The policy requires an authenticated `SessionBearer` principal with a trusted user ID and a single Bearer header. It resolves an active Admin role server-side through `TrustedAdministratorRoleResolutionService`. The pinned Backend registers the resolver and SQL role reader with shared auth enabled. That is newer evidence than the earlier Angular auth audit. Actions derive the actor from the principal. The controller declares one policy for read and both writes. [Policy source](https://github.com/naanga7peru/Wayhunter_mobile_application_Backend/blob/1db99995c1049fe136c245d3e73c64d258ad1929/src/Wayhunter.Api/Extensions/AdminSafetyServiceCollectionExtensions.cs) · [Earlier auth audit](M1_ADMIN_AUTH_CONTRACT_VERIFICATION.md)
- **DECISION_REQUIRED — M1.** Deliver the approved browser Admin sign-in/session validation, expiry, logout/revocation, refresh or reauthentication and grant-discovery contracts. Confirm credential transport, approved HTTPS origins/CORS, mobile versus browser credential boundaries, and CSRF controls if cookies are selected. The reviewed identity HTTP surface contains mobile authentication, which does not establish the approved browser flow.
- **DECISION_REQUIRED — M1 with M5.** Confirm server-side permissions and scopes for queue, inventory, protected evidence, creation decisions, stage decisions, winner decisions and anti-cheat actions. Verify denial under missing/revoked permissions or unavailable role data. Publish how browser access and credentials attach to approved calls. Establish authenticated actor, target and audit correlation on every write.

## 5. M5 missing HTTP and DTO requests

The items below are **PROPOSED deliverables**. M5 should publish approved controller/OpenAPI, examples, validation, error mapping and permission references before Angular consumes them.

| Contract request | Source evidence and handoff requirements |
| --- | --- |
| Admin inventory and detail | Existing mobile public and creator reads serve different audiences. Provide an Admin list with agreed status/filter/paging and stable sort, and detail with creator identity, stages/clues, timer/safety, timestamps, visibility, moderation and archived status. Include pending creation-review detail so reviewers have the required evidence before deciding. Confirm which data is redacted per role. |
| Stage-proof queue, protected evidence and decisions | `GetPendingGameStageProofsService`, `GamePendingStageProofDto`, decision command/result and `SqlGameProofReviewRepository` exist. The SQL reviewer checks authorization and game/attempt/stage binding and deliberately blocks final-stage approval in this path. Expose separate authorized list, evidence access and decision behavior. Define evidence availability, live-capture provenance, rejection reason rules, stale/duplicate outcomes, replay identity, single advancement and audit. |
| Final completion and winner decisions | Domain completion results and reward source readers exist. Provide the eligible completion queue, linked protected evidence, decision outcomes and durable audit. Define how final stage hands off to completion, and prove atomic single-winner enforcement under concurrency, creator exclusion and clock-based expiry. Give M6 a durable confirmed result for payout. |
| Anti-cheat | `GameModerationService` and SQL store have flag/disable behavior. Creation reject is the action exposed by this controller. Define authorized flagged game/attempt triage, evidence, bounded signals (duplicate media, implausible timing, repeated patterns, self-reward), reasoned decisions, current availability effects and audit. Confirm reviewer scope and controlled action semantics. |
| Creation write hardening | Confirm wire types/statuses, reason validation, actor/target audit, concurrency, read-after-write and recovery after an unknown outcome. Decide durable browser replay semantics or specify an authoritative way to reconcile a prior decision. The pending list alone cannot distinguish approval from rejection or absence. |

## 6. M6 Coins and leaderboard

- **SOURCE.** Each qualifying creator approval and the single verified winner can earn +100 Coins once. Draft, pending, failed and rejected outcomes earn zero. Angular displays authoritative state from Backend.
- **CODE_VERIFIED.** Creator approval persists identifiers and timestamps. `SqlCommittedCoinRewardSource` discovers creator approval records and eligible winner records for reward recovery. The SQL reward writer is gated by `CoinsWallet:EnableSqlRewardWriter` under shared authentication. The hosted worker additionally requires `CoinsWallet:EnableSqlRewardOutboxStore` and `CoinsWallet:EnableRewardOutboxWorker`. Verify end-to-end ledger posting with M6 in an approved environment.
- **PROPOSED — M5/M6.** Agree event identity and provenance, approval record, beneficiary and Game ID, separate creator/winner reward types, and deduplication by beneficiary/reward type/source record. Verify retry and replay across the game decision, committed-source recovery, outbox and ledger, including worker restart and duplicate delivery. Define how pending delivery, credited and corrected states are reconciled and displayed.
- **DECISION_REQUIRED — M6 with M5.** Publish the Admin Game ranking contract and authorized projection. Rank from eligible approved Game-earned Coins, excluding pending, rejected, reversed, welcome and Hunter credits. Confirm creator/play inputs, correction handling, ranking period, stable ties, paging and refresh. Draft BRD LB-003 proposes earliest qualifying verified achievement then UserId. Agree eligible display data and scope with M1. Backend C# references found for leaderboard navigation do not establish a ranking query or HTTP contract.

## 7. Error and permission checklist

- [ ] Missing/expired/revoked credentials produce the approved authentication UX. Forbidden grants show an access-denied state. Route and client checks fail closed while the server independently checks every action.
- [ ] Distinguish 400 validation, 401 authentication, 403 permission, 404 missing resource or route, 409 stale/duplicate decision, and network/5xx failures. Keep empty results distinct from error and access-denied states.
- [ ] Normalize action errors using the approved envelope. The current client preserves code and correlation ID only for a matching structured envelope and otherwise preserves status. Avoid showing raw Backend exception text, actor credentials or private evidence. [Error normalization](../../src/app/core/http/api-error.ts)
- [ ] Disable duplicate submissions while pending. Refresh after confirmed success. For conflict or ambiguous network failure, reconcile with authoritative state before retrying. Never optimistically publish, advance proof or credit Coins.
- [ ] Verify evidence access on each request, with authorized scope and agreed expiry. Redact audit/test evidence and use server actor identity and timestamps.

## 8. Production acceptance tests

Use synthetic records against an approved test deployment. Record Angular and Backend revisions, effective flags/migrations, test outcome, HTTP status, and redacted database/ledger/audit evidence as applicable.

| Owner | Acceptance |
| --- | --- |
| M1 / M7 | Development preview remains fixture-only and production preview redirects. Test authenticated Admin browser flow, ordinary user, tampered/expired/revoked credentials, revoked role, missing action grant and cross-resource evidence denial. Confirm denied UI dispatch and independent server denial. |
| M5 / M7 | Pending GET maps the five fields and correctly handles empty, delayed and failed reads. Approved details support evidence-based review. Exercise missing IDs, invalid payloads, blank and 1,000/1,001-unit trimmed rejection reasons. Verify server timestamps, publication, rejection audit, conflicting decisions from two reviewers and recovery after lost response. |
| M5 | Verify proof ownership and replay controls, rejected proof without progression, accepted non-final proof advancing once, and protected evidence permissions. Exercise final-stage handoff, creator exclusion, racing winner decisions, stale decisions, expiry at the boundary before the worker runs, repeat archival, preserved creator history and public/play removal. |
| M5 / M6 | Verify separate +100 creator and winner ledger entries, zero on ineligible states, no duplicate rewards under retry or concurrent delivery, and recovery after worker interruption between decision and credit. Test correction and ledger/ranking reconciliation. |
| M5 / M6 / M7 | Verify anti-cheat triage, reasoned actions, audit and availability after an authorized control. Verify Game ranking eligibility, stable ties and paging, refresh after correction and privacy of returned fields. After PR #49 review, verify the combined page at narrow widths and with keyboard navigation. |

Existing tests such as Backend `M5SqlGameDraftAdminHttpE2ETests`, `M5SqlGameProofReviewRepositoryTests`, and Angular Games and guard specs provide starting points. This audit ran documentation checks only.

## 9. Suggested implementation branches

| Proposed branch | Scope and sequencing |
| --- | --- |
| `feature/m1-admin-browser-session-contract` | M1 browser session and grants, protected evidence access rules, and deployed policy acceptance. |
| `feature/m5-adm10-admin-games-contracts` | M5 inventory and review detail, creation decision reconciliation, then stage proof, final winner and anti-cheat HTTP. Split by contract for review as needed. |
| `feature/m6-game-reward-ranking-contract` | M6 durable reward reconciliation and ranking, with M5 eligibility and event inputs. |
| `feature/m7-adm10-protected-creation-queue` | M7 verified queue read first. Add scoped decisions after the M1/M5 write acceptance. Base on reviewed Angular work and coordinate the combined page through PR #49. |
| `feature/m7-adm10-management-integration` | M7 binds the foundation sections as their contracts and authorization pass acceptance. |

## 10. Independent work and release blockers

| Can proceed independently | Blocked |
| --- | --- |
| M1 browser auth contract and authorization fixtures. M5 source-backed DTO proposals, SQL and HTTP test design, pending/detail review requirements. M6 ledger replay and ranking eligibility contract design. M7 review of PR #49 through its existing process, fixture-based acceptance planning, and read adapter coverage review. | Production queue calls depend on M1 verified browser access and an approved Backend environment. Creation writes also depend on M5 conflict/reconciliation semantics and M1 write authorization. Management screens depend on M5 HTTP and protected evidence contracts. Reward and ranking views depend on M5 confirmed results and M6 ledger/ranking contracts. Combined UI integration depends on PR #49 review. |

**Change scope.** Kept the audited source and Git history. Added this ADM-10 handoff as the sole file change. Verification covers document sections and local links, pinned source targets, whitespace and final Git status. Angular build and tests were skipped because the change is documentation-only.
