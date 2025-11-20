# Changelog

All notable changes will be documented here according to the rules in `.cursor/rules/main.mdc`.

## [2025-11-20]
- Added project scaffolding: folder hierarchy, placeholder configs, documentation, and CI stub in alignment with `docs/architecture.md`.
- Captured initial README and process guidance referencing Context7 best practices for React and Tauri setups.
- Installed npm dependencies, generated `pnpm-lock.yaml`, added initial Vitest suite, and documented verification steps in `docs/testing.md`.
- Authored `main_plan_build.md`, a Context7-aligned build orchestration plan covering sequencing, tests, and documentation requirements for every stage.
- Delivered Stage 2 (Accounts & Transactions): `SqliteTransactionService`, new Tauri commands (`list_accounts`, `list_transactions`, etc.), React Transactions page (TanStack Table + Radix Dialog), optimistic mutations, and supporting store/hooks/schemas.
- Added `docs/transactions.md`, expanded `docs/architecture.md`/`docs/testing.md`, and refreshed `README.md` with the new workflow.

