# Changelog

All notable changes will be documented here according to the rules in `.cursor/rules/main.mdc`.

## [2025-11-20]
- Added project scaffolding: folder hierarchy, placeholder configs, documentation, and CI stub in alignment with `docs/architecture.md`.
- Captured initial README and process guidance referencing Context7 best practices for React and Tauri setups.
- Installed npm dependencies, generated `pnpm-lock.yaml`, added initial Vitest suite, and documented verification steps in `docs/testing.md`.
- Authored `main_plan_build.md`, a Context7-aligned build orchestration plan covering sequencing, tests, and documentation requirements for every stage.
- Delivered Stage 2 (Accounts & Transactions): `SqliteTransactionService`, new Tauri commands (`list_accounts`, `list_transactions`, etc.), React Transactions page (TanStack Table + Radix Dialog), optimistic mutations, and supporting store/hooks/schemas.
- Added `docs/transactions.md`, expanded `docs/architecture.md`/`docs/testing.md`, and refreshed `README.md` with the new workflow.
- Delivered Stage 3 (Dashboard & KPIs): `SqliteDashboardService` + `get_dashboard_snapshot`, responsive Dashboard page (KPI cards, quick actions, command palette & hotkeys, weekly spend chart, account highlights, offline badge), React Router shell, dashboard-specific Vitest/Rust coverage, and updated documentation (`docs/architecture.md`, `docs/testing.md`, `main_plan_build.md`, `README.md`, `src/features/dashboard/README.md`).
- Delivered Stage 4 (Budget Engine): `SqliteBudgetService` + budget CRUD commands (`list_budgets`, `create_budget`, `update_budget`, `delete_budget`, `record_snapshot`), Budgets UI page (envelope grid, progress rings with color-coded status indicators, inline edit/delete), alert threshold detection (Normal/At Risk/Over), seed script updates for starter budgets, unit tests for progress calculation and status helpers, and updated documentation (`docs/architecture.md`, `docs/testing.md`, `main_plan_build.md`, `src/features/budgets/README.md`).
- Delivered Stage 5 (Goals & Savings): `SqliteGoalService` + goal CRUD commands (`list_goals`, `create_goal`, `update_goal`, `update_goal_status`, `add_contribution`, `delete_goal`), Goals UI page (Kanban board with status columns, progress bars, inline status changes), projection calculations with target dates, auto-achievement when targets reached, seed script updates for starter goals, unit tests for projection and status helpers, and updated documentation (`docs/architecture.md`, `docs/testing.md`, `main_plan_build.md`, `src/features/goals/README.md`).

