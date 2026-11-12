# AGENTS.md — Wayhunter Angular Admin (Codex team rules)

    **Repository:** https://github.com/naanga7peru/Wayhunter_mobile_application_admindashboard_angular
    **Technology direction (proposed):** Angular / standalone / feature-first
    **Module scope:** 17 Admin modules, permissioned moderation and audit. Admin-only voucher source upload and optional scanner.

    ## Required process
    1. Project owner reports **folder structures and development have not begun**. Before scaffolding, check whether a repository has existing files; GitHub source is **not code-verified** (previous connector 404).
    2. **Read `docs/second-brain/ACTIVE_RULES.md` first**, then `docs/second-brain/CONTEXT.md` and the draft Master BRD; no file proves implemented behavior.
    3. Distinguish `SOURCE`, `PROPOSED`, `CODE_VERIFIED`, `DECISION_REQUIRED`. Do not invent endpoints/tables/routes.
    4. Make a KEEP / MODIFY / ADD plan with testing before patching. Do not silently alter working UI, branch history, or schema.
    5. **VCH-DEC-01 RESOLVED:** request requires >=10,100 spendable; reserve 10,000; **Admin Approve debits 10,000 once**; reject releases. OCR/barcode *intake* optional, demo voucher QR generation/display required.
    6. Never commit API secrets, production OTP, voucher codes, raw contacts or GPS trails. Use least-privilege auth, backend validation, audit/idempotency.
    7. Never claim a feature complete just because a screenshot or previous demo repo showed it.

    ## Repo-specific rules
    - No hardcoded admin login/OTP or localStorage balances in production; backend must authenticate every action.
- Admin Hunter review includes live evidence/current district/200m candidates and user identity, with reasoned decisions.
- Game creation approval and player proof approval are separate queues; +100 rewards only after backend approved state.
- Voucher screenshot/PDF upload and human verification are documented; OCR/QR/barcode detection proposed not approved.
- Debit timing is resolved: **Admin Approval** debits 10,000 once; Angular only displays backend-confirmed status; no local Coins settlement.
- Follow approved Admin 17-module designs; do not assume old demo sidebar/layout/routes exist in these new repositories.

    ## Additional non-negotiable active rules
- Game expiry is 30 days after Admin approval; **Archive and retain creator My Games/database record**, NOT physical DB deletion.
- One verified winner per Game. Hazard warnings: 1 km from planned trip route, photo capture time, 24-hour active window.
- No new commercial payout scope; academic demo voucher uses sample image, unique code and QR.
- M1–M7 ownership in central `knowledge/TEAM_GIT_WORKFLOW.md` is planning allocation, not a product-rule change.

## Evidence requirements for every PR
    Mention BRD rule / Admin module, branch/commit, actual changed files, tests run, risks, any remaining `Decision Required`. No direct main push without review.
