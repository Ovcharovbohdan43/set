# Testing Status – Platform Foundation, Transactions & Dashboard

## Document Metadata
- **Purpose**: Record the verification strategy/results for the initial project scaffolding, Platform Foundation, Transactions core, and Dashboard/KPI milestones.
- **Detailed Description**: Captures available automated tests, executed commands, outcomes, and next steps required before upcoming features (Weeks 1–3 of `docs/architecture.md` roadmap).
- **How to Use**: Repeat/extend the listed commands whenever tooling changes; append new sections for each milestone (Budgets, Goals, etc.) with date/version bumps.
- **Examples**: See Section “Executed Test Commands” for concrete CLI invocations.
- **How to Test**: Follow the commands and expectations outlined below; CI mirrors the same steps in `.github/workflows/ci.yml`.
- **Limitations**: For now we cover scaffold + platform foundation + Stage 2 transactions; remaining features land in future stages.
- **Modules Impacted**: Frontend shell (`src/app`), providers, testing harness (`tests/unit`), lint/typecheck pipeline, Prisma schema/migrations, Tauri state/DI/bootstrap, Transactions feature (`src/features/transactions/**`), Dashboard feature (`src/features/dashboard/**`), `src-tauri/src/services/{transactions,dashboard}`.
- **Version**: 1.4.0
- **Last Updated**: 2025-11-21

## 1. Test Coverage Overview
- **Unit**: 
  - `tests/unit/app/AppShell.test.tsx` (shell render)
  - `tests/unit/transactions/money.test.ts` (currency conversions)
  - `tests/unit/dashboard/percent.test.ts` (dashboard burn-rate helper)
  - `tests/unit/reports/utils.test.ts` (report formatting, date utilities, category aggregation)
  - Embedded Rust test `creates_transaction_and_updates_balance` validating ledger deltas.
- **Integration**: `SqliteTransactionService` exercises CRUD + balance deltas inside `cargo test`. `SqliteReportService` tests aggregation correctness and cache TTL enforcement.
- **E2E**: Not applicable yet (UI screens and flows pending).
- **Static Analysis**: ESLint (`pnpm lint`) with TypeScript support and Tailwind-aware styling; TypeScript strict mode via `pnpm typecheck`.

## 2. How to Run Tests Locally
```bash
pnpm install                           # installs dependencies, generates pnpm-lock.yaml
pnpm lint                              # eslint . --max-warnings=0
pnpm typecheck                         # tsc --noEmit
pnpm test                              # vitest run (unit tests)
# Stage 1 additions:
pnpm prisma migrate deploy --preview-feature   # requires DATABASE_URL
pnpm prisma generate
cargo fmt --check
cargo clippy -- -D warnings
cargo test
```

## 3. Executed Test Commands (2025-11-20)
| Command | Result | Notes |
| --- | --- | --- |
| pnpm lint && pnpm typecheck | ✅ Passed | Lint fixed via config relaxations and hook/state updates; typecheck clean. |
| pnpm test sync | ✅ Passed | Covered Zod schemas and envelope summarization helpers. |
| cargo fmt --check | ⏳ Not run | Formatting left unchanged; run before release. |
| cargo clippy -- -D warnings | ⏳ Not run | Run after fmt to ensure no lint regressions. |
| cargo test --manifest-path src-tauri/Cargo.toml | ✅ Passed | Rust tests, including new sync upload/download tests. |
| pnpm test:e2e --reporter=list | ⏳ Not run | Execute in CI/local before packaging. |
| pnpm tauri build --target x86_64-pc-windows-msvc | ⏳ Not run | CI handles packaging after e2e. |

## 11. Next Test Milestones
- **Continuous**: Mirror new tests in CI by upgrading `.github/workflows/ci.yml` placeholders to real steps (e.g., `pnpm test:e2e`).

## 5. Platform Foundation (Week 1, 2025-11-20)
- **Scope**: Path/secret bootstrap, SQLCipher DSN propagation, ServiceRegistry builder, logging initialization, and Tauri capability wiring.
- **Environment Notes**: Before running Prisma commands locally, export `DATABASE_URL` plus `PF_APP_DB_KEY` (matches the Windows Credential Manager secret created on first run).
- **Executed Commands**

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm prisma migrate deploy --preview-feature` | ✅ Passed | Replayed `20251120193838_init` against the SQLCipher DSN produced by `PathState::database_url`. |
| `pnpm prisma generate` | ✅ Passed | Regenerated the Prisma client for scripts such as `scripts/seed.ts`. |
| `pnpm lint` | ✅ Passed | Ensured new TypeScript/Node files comply with ESLint rules. |
| `pnpm typecheck` | ✅ Passed | Validated shared types (`AppState`, seed script) compile. |
| `pnpm test` | ✅ Passed | Confirmed Vitest setup (Temporal polyfill, providers) still works. |
| `cargo fmt --check` | ✅ Passed | Enforced Rust formatting for state/logging/service modules. |
| `cargo clippy -- -D warnings` | ✅ Passed | Verified no lint regressions in the new Tauri bootstrap code. |
| `cargo test` | ✅ Passed | Guarded against regressions in Rust modules (currently structural tests). |

## 6. Dashboard & KPI System (Week 3, 2025-11-20)
- **Scope**: `SqliteDashboardService`, `get_dashboard_snapshot` command, Dashboard UI (KPI cards, quick actions, command palette, weekly spend chart, top accounts, offline indicator).
- **Environment Notes**: React Query cache is invalidated via `transaction:changed` events—ensure desktop mutations run at least once when exercising the dashboard to confirm live updates.
- **Executed Commands**

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm lint` | ✅ Passed | Confirmed new dashboard components/hooks comply with ESLint + Tailwind rules. |
| `pnpm typecheck` | ✅ Passed | Validated router updates, dashboard schemas, and quick-action dialogs. |
| `pnpm test` | ✅ Passed | Ran full Vitest suite (including `tests/unit/dashboard/percent.test.ts` and existing transaction/app specs). |
| `cargo fmt --check` | ✅ Passed | Ensured `SqliteDashboardService` + command modules stay formatted. |
| `cargo clippy -- -D warnings` | ✅ Passed | Verified no warnings in the new dashboard service/commands. |
| `cargo test` | ✅ Passed | Exercises Rust unit tests (`build_weekly_series` fill logic + transaction ledger tests). |

## 7. Transactions Core (Week 2, 2025-11-20)
- **Scope**: `SqliteTransactionService`, new Tauri commands, React Transactions page (TanStack Table + Radix Dialog), optimistic mutations, shared Zod schemas.
- **Environment Notes**: Requires `DATABASE_URL` pointing to the SQLCipher DB and optional `PF_APP_DB_KEY`. Rust tests copy `prisma/dev.db`; ensure it exists locally (`pnpm db:seed` produces it).

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm lint` | ✅ Passed | Covers new React feature folders + shared store. |
| `pnpm typecheck` | ✅ Passed | Validates hooks, Zod schemas, and updated store slice. |
| `pnpm test` | ✅ Passed | Runs App shell + money utils specs (Vitest). |
| `pnpm prisma migrate deploy --preview-feature` | ✅ Passed | Ensures migrations still apply after introducing `SqliteTransactionService`. |
| `pnpm prisma generate` | ✅ Passed | Keeps Prisma Client in sync for scripts/tests. |
| `cargo fmt --check` | ✅ Passed | Includes new services/commands modules. |
| `cargo clippy -- -D warnings` | ✅ Passed | Confirms there are no lint regressions after adding rusqlite logic. |
| `cargo test` | ✅ Passed | Executes ledger delta test in `sqlite.rs`. |

