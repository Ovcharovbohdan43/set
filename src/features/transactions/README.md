# Transactions Feature

## Purpose
Deliver the Stage 2 scope from `main_plan_build.md`: an offline-first accounts/transactions experience with optimistic CRUD flows, TanStack-powered tables, inline editing, filters, and Radix-powered creation dialogs.

## Architecture Summary
- **Data access**: React Query hooks (`src/features/transactions/hooks.ts`) wrap Tauri commands (`list_accounts`, `list_transactions`, etc.) with shared Zod contracts from `schema.ts`.
- **UI**: `components/TransactionsPage.tsx` assembles filters, table, and dialogs. `TransactionTable.tsx` uses TanStack Table for virtualization + inline editing, while `TransactionForm.tsx` centralizes create/update fields.
- **Optimistic updates**: Mutations update React Query caches immediately and fall back to invalidation on settlement.
- **Formatting utilities**: `utils/money.ts` handles cents↔currency conversions with tests in `tests/unit/transactions/money.test.ts`.

## Commands Consumed
- `list_accounts`, `list_categories`, `list_transactions`
- `create_transaction`, `update_transaction`, `delete_transaction`, `import_transactions`

## Testing
- Unit: `tests/unit/transactions/money.test.ts`
- Integration: Rust service tests inside `src-tauri/src/services/transactions/sqlite.rs`
- UI smoke: React Query hooks covered indirectly via optimistic-update assertions (Vitest).

## Next Steps
- Wire drag-and-drop category reorder once Stage 8 ships.
- Extend inline editing to category/account reassignment after KPI dependencies land.
