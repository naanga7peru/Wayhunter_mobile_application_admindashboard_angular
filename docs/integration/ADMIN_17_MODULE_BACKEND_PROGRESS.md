# Admin backend integration progress

Angular baseline `262f5212bddffea0124a130aaddb6f8769d2a841` on `devlop`. Backend baseline `c8b3aa60eed28da4d7a78039ca1e4a5607c3921c` on `develop`. Both fetched tips matched. The Backend integration worktree is `Wayhunter_Admin_Integration_Worktree`. The original Backend worktree and preview were excluded from source edits.

**SOURCE** denotes a requirement or documented inventory. **CODE_VERIFIED** denotes a route, policy or implementation inspected in the baseline source. **PROPOSED** denotes an unmerged or draft contract. **DECISION_REQUIRED** denotes a documented unresolved decision. The matrix uses partial for existing code with remaining integration work and blocked for missing contracts or dependencies. Completion requires an authorized Angular-to-API run and isolated SQL evidence.

## Initial protected read task

- **KEEP** existing routes, access guards, Royal Gold styles, preview and moderation controls.
- **MODIFY** the Hunter page to display pending queue rows with loading, empty, access denied, unavailable and error states. Search by place, district or reference. Paginate the returned collection locally because the current API returns a list.
- **ADD** a typed GET adapter and focused tests for request contract, permission gate and UI states. Run the Angular suite and production build, then check the Backend authorization test results separately.

## Module register

Route fragments in the Backend column are relative to the preceding prefix. Existing policy or storage references are source observations. PR numbers in the dependency notes are upstream.

| Module / Angular component and adapter | Backend route and DTO evidence | Authorization and SQL | Status / verification | Blocker and next action |
| --- | --- | --- | --- | --- |
| ADM-01 Authentication / login, blocked session provider | Mobile login and revocation exist. Browser sign-in, session and logout contract absent | SessionBearer validates JWT, persisted active verified account/session and trusted SQL Admin assignment | Blocked | Confirm browser credential/session boundary and audit before enabling login. ADMIN-DEC-01 remains open |
| ADM-02 Dashboard / health adapter | GET /health, HealthResponse. Admin aggregates absent | Health is public. Aggregate scopes and queries pending | Partial | Define authorized aggregate DTOs and authoritative sources |
| ADM-03 Users / no live adapter | Admin directory, immutable UserId lookup and moderation routes not established | Identity schema exists. Directory field permissions and moderation audit pending | Blocked | Implement privacy-scoped DTOs and audited moderation after schema review |
| ADM-04 Hunter Verification / AdminHunterApiService | GET /api/admin/hunter/submissions returns HunterSubmissionResponseDto list. POST /api/admin/hunter/submissions/{submissionId}/approve and /reject take HunterReviewActionRequest | M6CoinsWalletAdministrator, Hunter submission status reader and M4 SQL | Partial | Queue connected in guarded Angular code. Verify valid Admin and SQL. Establish detail, private media and duplicate contracts. Coordinate writes with #319 |
| ADM-05 Advertisements / AdminAdvertisementsApiService | /api/admin/advertisements GET and POST, /{id} GET and PUT, /{id}/status PATCH, /{id}/image POST. Advertisement read/write and upload contracts | AdvertisementAdministrator policy, opt-in SQL and configured media provider | Partial | Verify authorized runtime, filtered reads and audited writes |
| ADM-06 Places / no live adapter | Admin catalog and moderation DTOs not established | M4 place ownership and schema. Admin permissions and merge audit pending | Blocked | Coordinate catalog and moderation contract with M4 and #319 |
| ADM-07 Trips & Historical Routes / no live adapter | No approved Admin trip history DTO | Trip plan/session SQL. GPS disclosure policy pending | Blocked | Design scoped query with server-side authorization and privacy tests |
| ADM-08 Hazards / AdminHazardApiService | POST /api/admin/hazards/{hazardId}/verify and /resolve. Admin report and evidence listing contract pending | M3 role checks, safety SQL and media dependencies | Partial | Verify action runtime and audit, coordinate #318 |
| ADM-09 Group Trips / AdminSafetyApiService | GET /api/admin/safety/trips/{tripPlanId}/sessions/{sessionId}, scoped safety summary | AdminSafety policy. Projection, resource grant reader and audit sink missing from live registration | Partial | Resolve grants, projection and durable audit with #318 |
| ADM-10 Games / AdminGamesQueueApiService | GET /api/admin/games/reviews/pending, POST /{gameId}/approve and /{gameId}/reject. Pending queue and decision DTOs | AdminSafety policy, M5 SQL runtime flags | Partial | Exercise controller activation and transactions. Verify proof review, winner, awards and archive separately |
| ADM-11 Coins & Rewards / no live adapter | /api/admin/coins-wallet GET /rule-versions, /reports/operations and /reports/reconciliation. POST /rule-versions and /ledger/{ledgerEntryId}/reverse | M6CoinsWalletAdministrator and M6 stores | Partial | Adapt report DTOs. Establish authoritative ledger list and verify reversals with #320 |
| ADM-12 Merchants & Voucher Inventory / no live adapter | POST /api/admin/coins-wallet/vouchers/offers and /inventory, M6 offer/stock commands | M6CoinsWalletAdministrator and opt-in voucher SQL | Partial | Establish stock listing, protected evidence and manual verification. Coordinate #320 |
| ADM-13 Redemptions & Settlements / no live adapter | GET /api/admin/coins-wallet/vouchers/requests, POST /requests/{requestId}/approve, /reject, /issue and /use, M6 request and action contracts | M6CoinsWalletAdministrator and voucher SQL transactions | Partial | Verify 10,100 minimum, 10,000 hold, single approval debit, rejection release and single issuance with #320 |
| ADM-14 Campaigns / demo presentation | Campaign draft in #315 | SQL mapping proposed. Runtime authorization and persistence pending | Blocked | Review #315 and agree on the runtime contract before duplicating work |
| ADM-15 Reports & Analytics / no live adapter | M6 reports cover Coins operations. General Admin KPI and CSV contracts absent | Domain-specific authorization and reporting queries pending | Blocked | Establish Admin report/filter contracts and data sources |
| ADM-16 Notifications / AdminNotificationsApiService | /api/admin/notifications POST /preview, /schedules, /schedules/{jobId}/cancel and GET /schedules/{jobId}/summary | Notification Admin policy and explicit grants. Unavailable audience/job dependencies | Partial | Verify audience scope, durable jobs and delivery service registrations |
| ADM-17 Settings, Security & Audit / no live adapter | Settings, role/session administration and audit search contracts absent | Trusted assignment table exists. ADMIN-DEC-01 and audit permissions pending | Blocked | Obtain documented permission decision and implement read/audit contracts |

## Acceptance evidence

No module has completed Angular, Backend, SQL, authorization, automated and browser acceptance together. Open upstream PRs at audit were #320 (M6), #319 (M4), #318 (M3), #317 (M2), #315 (M7 campaigns) and #256 (M5 proof recovery). The Swagger inventory is a source snapshot and does not establish runtime availability.

- Angular production build and 391 tests across 33 files passed. The HTTP adapter and page tests use test-only access decisions and responses.
- Playwright loaded all 17 preview destinations at 1440 px and 390 px on port 4201, with no horizontal document overflow or console errors. All 17 anonymous Admin routes redirected to login. The Hunter queue table accepted keyboard focus. Authorized browser reads and writes remain unverified.
- Backend built successfully and passed 26 focused Hunter and cross-module HTTP tests plus 39 SessionBearer and trusted Administrator unit tests. These test fixtures do not establish an authorized browser session.
- The disposable M4 SQL test failed before it could apply migrations. LocalDB startup could not open its model database. The test was configured with a newly generated local-only catalog. Shared SQL was untouched. No migration was authored.
- Angular integration branch is `feature/admin-full-backend-integration`. The isolated Backend branch `feature/admin-browser-auth-foundation` remains at the fetched baseline.
