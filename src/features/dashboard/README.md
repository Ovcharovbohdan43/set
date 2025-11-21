# Dashboard Feature

Stage 3 introduces the **Financial Cockpit** screen powered by the new `DashboardService`.

## Responsibilities
- Fetch aggregated KPIs via the `get_dashboard_snapshot` Tauri command.
- Render KPI cards (net worth, cash flow, budget burn) with live deltas.
- Provide quick actions (Add transaction, Add goal placeholder) and a keyboard-driven command palette (`Ctrl + K`).
- Visualize weekly spending and highlight top accounts.
- Listen to `transaction:changed` events (emitted by Transactions mutations) and invalidate cached data via React Query.
- Expose a quick-add transaction dialog that reuses `TransactionFormView`.

## Files
- `schema.ts` – Zod contracts for dashboard data.
- `api.ts` – Thin wrapper around the `get_dashboard_snapshot` command.
- `hooks.ts` – React Query hook + event invalidation helper.
- `components/DashboardPage.tsx` – Main UI, quick actions, command palette, charts.

## Testing
- Unit helpers covered via `tests/unit/dashboard/percent.test.ts`.
- Run `pnpm test` to execute dashboard + transactions suites.
