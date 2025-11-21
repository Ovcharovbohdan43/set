# Operations Runbook - Post-Beta

## Document Metadata
- **Purpose**: Provide operational runbooks for incidents, hotfix releases, telemetry/crash log review, and nightly validation for the personal finance desktop app.
- **Scope**: Applies to post-beta operations (Stage 11 in `main_plan_build.md`) covering on-call, monitoring, sync/nightly tests, release management, and support workflows.
- **Version**: 1.0.0
- **Last Updated**: 2025-11-21

## Incident Response
- **Severities**:
  - SEV1: Data loss/corruption, installer/signature failure, sync outage affecting all users.
  - SEV2: Core feature broken (transactions/budgets/goals), crash-on-launch.
  - SEV3: Degraded UX or minor bug with workaround.
- **On-call Actions**:
  1) Acknowledge alert (sync job failure, crash spike, installer download failure).
  2) Collect evidence: logs (`%APPDATA%/FinanceApp/storage/logs`), Windows Event Viewer, sync gateway logs.
  3) Mitigate: rollback release, disable OTA (when updater enabled), publish signed hotfix MSI.
  4) Postmortem within 48h: root cause, blast radius, fix plan, tests added.

## Hotfix Release
1. Branch from latest stable tag.
2. Apply fix; update `CHANGELOG.md` (Hotfix section) and bump version.
3. Run gates: `pnpm lint && pnpm typecheck && pnpm test && cargo test && pnpm test:e2e --reporter=list`.
4. Package/sign: `pnpm tauri build --target x86_64-pc-windows-msvc` (use CI secrets).
5. Smoke install on Win VM; verify launch + settings/sync.
6. Publish release artifacts; notify support with known issues.

## Monitoring & Telemetry
- **Crash/Log Review**: Daily scan of `%APPDATA%/FinanceApp/storage/logs` for ERROR; scrub PII before sharing.
- **Telemetry (opt-in)**: Aggregate counts only (launches, feature toggles). No raw PII. Honor user opt-out immediately.
- **Sync/Toast Checks**: Nightly sync compatibility test (CI `nightly-sync` job) and optional toast trigger smoke.

## Nightly Validation
- **Automated**: `.github/workflows/ci.yml` scheduled job runs sync contract tests. Extend to Playwright smoke when ready.
- **Manual (weekly)**:
  - Launch app, add transaction, verify dashboard KPIs update.
  - Trigger reminder due path; confirm in-app notification appears.
  - Export report CSV/JSON; re-import sample via Data settings.

## Support & Escalation
- **Channels**: Email/ticketing (TBD), GitHub issues for community beta.
- **Response Targets**: SEV1 (2h), SEV2 (8h), SEV3 (2 business days).
- **Data Requests**: Provide sanitized logs; never request raw secrets/keys.

## Fast-Follow Planning
- Collect feedback weekly; prioritize cloud-only reports and AI insights via architecture change proposal.
- Track beta issues in backlog tagged `ops/beta`.

## Changelog
- [2025-11-21] - Initial operations runbook covering incidents, hotfixes, telemetry/monitoring, nightly validation, and support/escalation paths.
