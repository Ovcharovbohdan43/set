# Transactions Core – Stage 2 Deep Dive

## Document Metadata
- **Purpose**: Describe the end-to-end implementation of the Accounts & Transactions milestone so future contributors can extend the ledger safely.
- **Detailed Description**: Covers backend services, database logic, Tauri commands, React feature slices, validations, optimistic update patterns, and associated tests.
- **How to Use**: Reference this doc when touching any ledger-related code, when debugging Tauri commands, or when planning the Stage 3 dashboard dependencies.
- **Examples**: Section 3 shows command payloads/responses; Section 4 illustrates optimistic update flows; Section 5 lists CLI/test commands.
- **How to Test**: Follow Section 5 (“Verification Checklist”) for the exact commands executed in CI/local runs.
- **Limitations**: Single-tenant user (`seed-user`) assumed; transfer support is one-sided; encryption falls back to plaintext if SQLCipher is unavailable (see Section 2.1).
- **Modules Impacted**: `src-tauri/src/services/transactions`, `src/features/transactions/*`, `src/store/index.ts`, `docs/architecture.md`, `docs/testing.md`.
- **Version**: 1.0.0
- **Last Updated**: 2025-11-20

## 1. Overview
Stage 2 focuses on delivering a production-ready transactions workflow:
- Offline-first CRUD operations persisted in SQLite/SQLCipher.
- Account balance deltas maintained automatically.
- TanStack Table UI with filters, inline editing, optimistic updates, and Radix Dialog create/edit forms.
- Shared Zod contracts to keep Tauri payloads and React hooks aligned.

## 2. Backend Implementation
### 2.1 Service
- **File**: `src-tauri/src/services/transactions/sqlite.rs`
- **Tech**: `rusqlite` (bundled SQLite). Attempts to apply the SQLCipher key (`PRAGMA key`) using the secret derived in `AppSecrets`. When SQLCipher symbols are missing, a warning is logged and the connection proceeds unencrypted (tracked risk for future stages).
- **Responsibilities**:
  - Reconcile `Account.balance_cents` on startup (`recalculate_account_balances`).
  - Wrap create/update/delete/import inside database transactions, applying ledger deltas with `apply_balance_delta`.
  - Map DB rows into DTOs consumed by the frontend (account name + category name hydrated).
  - Handle optimistic-friendly ordering (`ORDER BY occurred_on DESC, created_at DESC`) and search filters (case-insensitive notes/tags).
- **Tests**: Inline Rust test `creates_transaction_and_updates_balance` copies `prisma/dev.db`, inserts a transaction, and asserts the balance delta.

### 2.2 Commands
| Command | Module | Notes |
| --- | --- | --- |
| `list_accounts` | `src-tauri/src/commands/transactions.rs` | `includeBalances` flag triggers live aggregation. |
| `list_categories` | same | Filters archived rows. |
| `list_transactions` | same | Supports limit/offset/account/category/search filters. |
| `create_transaction` | same | Returns hydrated DTO. |
| `update_transaction` | same | Reconciles previous + new balance impact. |
| `delete_transaction` | same | Reverses delta before removal. |
| `import_transactions` | same | Bulk helper used by sample import + future CSV flows. |

## 3. Frontend Implementation
- **Data layer**: `src/features/transactions/api.ts` + `hooks.ts` (React Query). All responses run through Zod (`schema.ts`).
- **State**: `src/store/index.ts` now holds `transactionFilters`, ensuring filters persist across components.
- **UI**:
  - `TransactionsPage.tsx`: orchestrates filters, table, and Radix dialog.
  - `TransactionTable.tsx`: TanStack Table with inline editing (notes & amount) and per-row actions.
  - `TransactionForm.tsx`: Shared form for create/update flows, handling amount parsing and tags normalization.
  - `utils/money.ts`: Formats + parses currency values (unit tests at `tests/unit/transactions/money.test.ts`).
- **Optimistic Updates**: Mutations update the relevant React Query cache immediately (synthesizing placeholder rows with stable IDs) and invalidate queries after the backend confirms the write.

## 4. Validation & Error Handling
- Backend rejects non-positive amounts and unknown IDs; errors propagate to the UI via the Tauri command `Result`.
- Frontend ensures `amountCents` is derived from decimal user input and normalizes currencies to uppercase.
- Path traversal protections still handled by `src/services/fs/securePath.ts` for future attachment uploads.

## 5. Verification Checklist
Run these commands before marking Stage 2 tasks complete:
```bash
pnpm prisma:migrate:deploy        # Requires DATABASE_URL / PF_APP_DB_KEY
pnpm prisma:generate
pnpm lint
pnpm typecheck
pnpm test
cargo fmt --check
cargo clippy -- -D warnings
cargo test
```

## 6. Future Work
- Dual-account transfers (credit/debit) + split transactions.
- Category drag-and-drop plus reorder persistence (Stage 8).
- Report invalidation hooks (Stage 7) when new transactions arrive.
- Hardening SQLCipher usage for macOS/Linux release builds.

