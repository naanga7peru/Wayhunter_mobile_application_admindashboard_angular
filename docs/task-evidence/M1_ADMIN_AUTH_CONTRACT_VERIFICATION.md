# M1 Admin authentication contract verification

- **Owner** · Thadsha, Developer 1
- **Scope** · ADM-01 and the shared Angular Admin authentication boundary
**Verdict** · Angular Admin integration **BLOCKED**. Runtime verification **NOT TESTED**.

## Baselines and evidence

- Angular branch · `feature/admin-thadsha-m1-auth-contract-verification`
- Angular HEAD and fetched `origin/devlop` · `2fc0d512c8427c7829cbb4d15d11aca2ceb5d51e`. The working tree was clean at entry. The approved T7 merge and the fetched base are included in HEAD.
- Backend checkout · `task/m2-ms10-t05-provider-run-guide-20261121` at `225fa0c294b0d5fa80068ec8212ec7c6c333119c`. The checkout contains unrelated test and untracked work.
- Backend contract reference · Locally recorded `origin/develop` at `e3b0e9336e9f19003811f01649491c27fa3730a5`, inspected directly through Git objects. The live backend remote tip, deployed configuration, and database state were not established.

Sources include Angular `AGENTS.md`, Second Brain active rules and context, `docs/OWNERSHIP_MAP.md`, `core/auth/`, `core/permissions/`, `core/guards/`, `core/http/`, `features/authentication/`, routing, app providers, and existing specs. Backend evidence comes from `Program.cs`, `Controllers/Mobile/IdentitySocial/`, `IdentityApiContract.cs`, the identity persistence and session registration extensions, token and session validation services, SQL session and role readers, role resolution, and the relevant Admin controllers and policies. Existing source tests were inspected as coverage evidence.

## Angular boundary

`ADMIN_SESSION_STATE` defaults to `blocked` and also models `unknown` and `signed-out`. `AdminAccessService` always returns `allowed: false`. The `/admin` route redirects to `/login`; the login form is disabled and cancels submission. The preview guard uses Angular development mode, and the login link to preview is also development-only. There is no session API call, role loader, permission grant, or credential handling.

Angular registers `HttpClient` with Fetch. The existing client calls the configured base URL plus `/health` and normalizes errors. The checked-in environment points to local port 5055. Existing tests cover disabled login/no HTTP, blocked and unknown sessions, all nine protected module deep links, production-mode preview denial, and health success/failure without privilege changes. The tests use controlled dependencies and were not rerun in this audit.

## Endpoint and DTO inventory

| Classification | HTTP contract | DTO and behavior |
|---|---|---|
| **MISSING** | Approved Admin browser login | No controller action, request DTO, response DTO, or credential transport found. |
| **MISSING** | Admin browser session validation, refresh, logout and permission discovery | No dedicated browser contract found. Shared session primitives are partially implemented. |
| **VERIFIED IN SOURCE** | `POST /api/mobile/identity/login` | `IdentitySignInRequest(Email, Password)` → `IdentitySignInResult(UserId, AccessToken, ExpiresAtUtc)` on 200. Returns 401 for invalid credentials or account state and 503 for the caught configuration-unavailable path. Issues a signed bearer token after persisting a session. This is a mobile identity contract. |
| **VERIFIED IN SOURCE** | `GET /api/mobile/identity/me` | Authenticated caller’s `PrivateProfileDto`, resolved from the trusted principal with an active-account owner check. 401/403 paths exist. |
| **VERIFIED IN SOURCE** | `POST /api/mobile/auth/logout` | Authenticated bearer request with no body. Revocation uses the validated actor and session claims. Returns 204 on success or 401 on invalid identity/session or failed revocation. |
| **VERIFIED IN SOURCE** | `POST /api/mobile/identity/register`, `/resend-otp`, `/verify-otp` | `IdentityRegisterRequest`, `IdentityOtpResendRequest`, `IdentityOtpRequest` respectively. The controller maps the service’s `IdentityFlowResult` into status/body and optional Retry-After. |
| **VERIFIED IN SOURCE** | `POST /api/mobile/identity/forgot-password`, `/reset-password` | `IdentityForgotPasswordRequest` → generic 202 acknowledgment. `IdentityResetPasswordRequest` → 204 or 400. |
| **MISSING** | Admin user and role management | `/api/admin/identity/users` exists as a route constant. No corresponding controller or permission contract found. |

No Admin browser refresh mechanism, CORS deployment contract, or cookie/CSRF design was established. The inspected API configures a development-only CORS policy using configured origins and allowing headers and methods. That policy does not opt into credentials. The source shows bearer transport for shared identity and no Admin browser cookie scheme. If M1 selects cookies, cookie attributes and CSRF defenses must be specified and verified. If M1 selects bearer transport, token handling and browser-origin controls still require an approved contract.

## Request and authorization trace

1. **Middleware and activation.** The pipeline applies correlation middleware, development CORS where applicable, authentication, authorization, and controller mapping. `Identity:EnableSharedAuthentication` selects SQL identity persistence and `SessionBearer`. The alternative registers the disabled identity handler. SQL session reader and revocation store registrations exist in the shared identity path.
2. **Session validation.** `SessionBearerAuthenticationHandler` parses the bearer header and calls `AuthenticatedSessionAuthorizationService`. Token validation checks issuer, audience, signing key and lifetime with zero clock skew. Persisted validation checks the matching account/session, active verified account, expiry and revocation. Mobile login derives expiry from the configured session lifetime and persists the session before issuing its token.
3. **Principal and trusted role.** The handler emits `sub`, `sid`, and `NameIdentifier`. It does not call `TrustedAdministratorRoleResolutionService` or attach an Admin claim. The standalone resolver revalidates the session, reads a server-controlled assignment, checks matching identity and active Admin status, and fails closed. The SQL reader rejects missing, ambiguous, revoked, or unavailable assignments.
4. **Registration gap.** No production DI registration was found for `TrustedAdministratorRoleResolutionService` or for `ITrustedAdministratorRoleReader` backed by `SqlTrustedAdministratorRoleReader`. No common Admin claim issuance or permission-discovery pipeline was found. Schema and reader code alone do not establish deployment or activation.
5. **Policies and services.** Hazard mutations require the `Admin` role and a trusted actor. The notification policy requires an authenticated trusted principal with the configured Admin role and the composer performs additional grant checks. Its audience and job services are registered as unavailable in the inspected API. The safety-session policy requests the trusted resolver separately and denies when it is absent. The safety service applies exact trip/session grants and requires projection and audit dependencies. Operational registrations for those safety dependencies were not found.

This source supports fail-closed identity validation and a standalone trusted role decision. It does not establish an end-to-end browser Admin identity. Ordinary, unverified, expired, revoked, and mismatched identities are covered by source-level guards or tests in the shared session and resolver paths. A separate browser-versus-mobile credential boundary, real endpoint-level resource denial, or an Admin sign-in and authorization audit trail must still be verified at runtime. Correlation middleware alone is not audit evidence.

## Test evidence and runtime limits

`SessionBearerHttpIntegrationTests` covers missing and invalid tokens, valid session access, revoked sessions, and suspended accounts. `SessionLogoutHttpIntegrationTests` covers revocation and token reuse denial. `TrustedAdministratorRoleResolutionServiceTests` exercises valid, absent, inactive, mismatched and unavailable assignments, plus expired/revoked sessions and unverified accounts. SQL reader and registration tests exist. These are findings from test source. No test commands, live requests, approved test credentials, or approved backend environment were used. **No endpoint is classified RUNTIME VERIFIED.**

## M1 handoff and acceptance gate

1. Publish the approved backend commit and OpenAPI or controller/DTO references for Admin browser sign-in, current-session validation, logout/revocation, permission discovery, and any refresh/recovery operations. Document status codes and error envelopes.
2. Confirm browser credential transport, expiry and refresh rules, allowed origins and HTTPS behavior. If using cookies, specify flags, credentialed CORS where relevant, and CSRF controls. Provide the separation and enforcement rules for mobile-only credentials.
3. Provide production DI and principal/policy wiring evidence for the trusted role reader and resolver, role revocation, and permission enforcement. Identify schema and deployment prerequisites and confirm fail-closed behavior if role data is unavailable.
4. With API owners, identify policies and resource scopes for individual Admin endpoints and provide audit evidence for authentication, revocation and protected operations. Logs and evidence must exclude credentials and tokens.
5. Supply actual integration results from an approved environment for valid Admin access, ordinary and mobile-only denial, invalid or tampered credentials, expired and revoked sessions, missing or revoked role, unavailable role storage, missing permission, cross-resource denial, logout reuse denial, and audit behavior. Include environment, backend commit, command, expected and actual response classes, and redacted audit outcome.
6. Coordinate with Thashvini only after this gate passes. Her handoff covers `app.routes.ts` and any shared shell navigation or session-state display. Angular core and owned authentication UI changes belong to Thadsha.

**Recommended next task** · M1 delivers and runtime-verifies the browser Admin session and authorization contract on an approved backend build. Angular wiring can be reviewed after those acceptance results. The current frontend remains blocked and the production release is not approved.
