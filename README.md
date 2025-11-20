# Personal Finance Desktop App

## Purpose
This repository hosts the offline-first Windows desktop finance manager described in `docs/architecture.md`. Stage 2 (Accounts & Transactions) is now complete: the app boots into a full transactions cockpit (TanStack Table + Radix Dialog) backed by the new `SqliteTransactionService`, optimistic CRUD flows, shared Zod contracts, and updated documentation/testing assets.

## Structure
- `docs/` – Living architecture and technical references (start with `architecture.md` and `transactions.md`).
- `src/` – React + Vite frontend organized by feature folders (`src/features/transactions` delivers Stage 2 UI/logic).
- `src-tauri/` – Tauri backend (Rust + optional TypeScript services) wired for commands, background work, and notifications.
  - `src-tauri/icons/` – Placeholder ICO/PNG assets referenced by the bundle and tray configs.
- `prisma/` – Database schema & migrations (SQLite + SQLCipher).
- `scripts/` – Operational scripts (seeding, export/import utilities).
- `tests/` – Unit, integration, and e2e harnesses.
- `.github/workflows/` – CI pipeline definitions.

Consult `docs/architecture.md` for detailed descriptions of every slice plus acceptance criteria per subsystem.

## Getting Started
1. **Install toolchain**
   - [Node.js 20+](https://nodejs.org/)
   - [pnpm 9+](https://pnpm.io/)
   - [Rust stable](https://www.rust-lang.org/tools/install)
   - SQLite CLI (for inspecting encrypted DBs during development)
2. **Install deps** (after packages are defined): `pnpm install` (or `npx pnpm install` if `pnpm` isn’t on your PATH)
3. **Prepare local environment**
   - When running Prisma CLI commands outside of the Tauri runtime, export `DATABASE_URL` (for example `set DATABASE_URL=file:./dev.db?...`) and reuse the same SQLCipher key via `PF_APP_DB_KEY`.
   - Windows builds automatically persist the SQLCipher key inside Credential Manager; macOS/Linux fall back to the JSON secret in `%APPDATA%/FinanceApp/config/secrets.json`.
4. **Development commands**
   - `pnpm dev`: Vite dev server
   - `pnpm tauri dev`: Combined React + Tauri dev (script to be wired later)
   - `pnpm test`: Vitest unit suite
   - `pnpm test:e2e`: Playwright (desktop) tests
   - `pnpm lint`, `pnpm typecheck`: Quality gates
   - `pnpm prisma migrate deploy --preview-feature`: Validates Prisma migrations (requires `DATABASE_URL`)
   - `pnpm prisma generate`: Regenerates the Prisma client for scripts/automation

> Note: Scripts currently reference placeholder configs. Update them as soon as actual implementations are committed.

## Documentation Workflow
Per `.cursor/rules/main.mdc`, every functional change must update relevant Markdown docs with purpose, usage, testing, limitations, impacted modules, and changelog entries. Keep `docs/architecture.md` authoritative and bump its version/date when architecture changes. Drill-down docs:
- `docs/transactions.md` – Stage 2 backend/frontend details.
- `docs/testing.md` – Verification commands per milestone.
- `main_plan_build.md` – Build orchestration and stage status.

## Additional References
- React project structuring guidance (React.dev, Context7 `/reactjs/react.dev` dataset).
- Tauri secure path/config patterns (Context7 `/tauri-apps/tauri` dataset).

## Contributing
1. Create a feature branch from `main`.
2. Update/extend documentation first (architecture, decision records).
3. Add implementation + tests (unit/integration/e2e).
4. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm test:e2e`.
5. Submit PR with summary + verification steps.

## License
TBD – choose a suitable license before first release.

