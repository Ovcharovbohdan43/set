# Personal Finance Desktop App Architecture Blueprint

## Document Metadata
- **Purpose**: Provide the single source of truth for implementing the Windows desktop personal finance application defined in `plan.md`, covering architecture, domain, UX, DevOps, and delivery roadmap.
- **Detailed Description**: End-to-end blueprint describing stack selection, component responsibilities, schemas, commands, UI patterns, security controls, packaging, CI/CD, and testing expectations for both offline-first and optional cloud-sync modes.
- **How to Use**: Treat this document as an architecture contract—start new features by aligning with the relevant section (e.g., Section 5 for commands, Section 7 for UI), and reference it during code reviews and onboarding.
- **Examples**: Section 5.2 shows how the React layer invokes Tauri commands with secure path handling; Section 7.4 provides concrete Tailwind tokens; Section 8.3 outlines toast actions (Pay/Snooze/Open).
- **How to Test**: Follow the multi-level strategy in Section 14 (unit → integration → e2e) and reuse the provided Vitest and Playwright templates.
- **Limitations**: Focuses on architecture and process—not a substitute for detailed API reference docs or finalized copywriting; assumes single-tenant local storage with optional multi-device sync.
- **Modules Impacted**: React UI, Tauri command layer, domain services, SQLite/Prisma data layer, sync engine, background scheduler, notifications, CI/CD, and packaging.
- **Version**: 1.5.0
- **Last Updated**: 2025-11-21

## Changelog
- [2025-11-20] – Added: Initial architecture blueprint, including stack rationale, data model, commands, UX system, analytics, security, packaging, CI/CD, testing, and 10-week roadmap.
- [2025-11-20] – Changed: Documented the platform foundation (PathState/AppState, ServiceRegistry builder, SQLCipher DSN + env propagation, and Tauri capability configuration for secure filesystem access).
- [2025-11-20] – Added: Dashboard/KPI implementation details (SqliteDashboardService, `get_dashboard_snapshot`, command palette & quick actions, offline indicator, weekly spend visualization, and new testing expectations).
- [2025-01-20] – Added: Reports & Analytics implementation details (SqliteReportService with caching and forecast, ECharts visualizations, export pipeline for CSV/JSON/encrypted JSON/PNG, query optimization with indexes, and export/import documentation).
- [2025-11-21] - Added: Packaging & Sync enablement (SqliteSyncService, Fastify sync gateway skeleton with JWT/HMAC envelopes, Settings sync UI, MSIX bundling/signing defaults, updater endpoint, CI release job, and nightly sync test workflow).
- [2025-11-21] - Added: Hardening & Beta (telemetry opt-in/out flow guidance, crash reporting/log rotation expectations, performance targets, and beta validation references).
- [2025-11-21] - Added: Planning Layer backend schemas and commands (MonthlyPlan, PlannedIncome/Expense/Saving, DebtAccount/Schedule, PlanningService commands).

---

## 1. System Overview & Architecture

### 1.1 Interaction Flow
```
Users
  ↓
React + TypeScript UI (Radix UI, Tailwind, Framer Motion)
  ↓ (invoke)
Tauri Frontend Bridge (@tauri-apps/api, secure window/channel)
  ↓
Domain Services (TypeScript modules, Zod validation, caching)
  ↓
Repository Layer (Prisma on top of SQLCipher-encrypted SQLite)
  ↙                           ↘
Background Scheduler           Sync Engine (Fastify/Node, PostgreSQL)
  ↓                            ↔
Notification System      Cloud REST / GraphQL API (JWT, encrypted payloads)
```

### 1.2 Layer Responsibilities
- **UI Layer**: React pages and feature slices inside Vite; consumes typed hooks generated from Tauri commands, renders charts via ECharts, and stores transient UI state in Zustand/Redux Toolkit Query (RTK Query optional).
- **Tauri Bridge**: Thin invocation layer ensuring serialization, permission checks, and data validation before handing payloads to services. Follows the Context7 Tauri guidance by using `appDataDir()` and `join()` to resolve platform-specific paths securely and by configuring `tauri.conf.json` `distDir`/`devPath` to match the Vite pipeline.
- **Business Services**: Pure TypeScript modules with dependency injection (ports/adapters). Each service (budget, transaction, goal, reminder, sync) exposes idempotent methods and emits domain events (using Node `EventEmitter` or `mitt`) that the UI can subscribe to via Tauri events (`window.emit`, `addListener`).
- **Database Layer**: Prisma client targeting SQLCipher-enabled SQLite via `better-sqlite3` bindings for deterministic performance. Migrations live in `/prisma/migrations`. All access passes through repositories for audit logging and caching.
- **Sync Layer**: Optional; serializes domain aggregates into signed deltas, pushes via REST/GraphQL to a NestJS or Fastify backend with PostgreSQL. Applies CRDT-inspired "last-writer-wins + semantic merge" policy per entity.
- **Background Scheduler**: Rust/TypeScript hybrid worker triggered by Tauri’s `async_runtime` to evaluate RRULE reminders, update `next_fire_at`, and enqueue Windows toast notifications.
- **Notification System**: Uses native Windows toast APIs (via the official plugin) plus in-app notification center. Supports actionable buttons (Pay/Snooze/Open) and state reconciliation with reminders.
- **Security Layer**: SQLCipher encryption, Windows Credential Manager for key storage, JWT validation for sync, Zod + OWASP validation for command inputs, structured logging without PII, telemetry opt-in only.

### 1.3 Platform Foundation Implementations
- **Path & Secret State**: `PathState` centralizes `app_data_dir`-derived folders (storage, logs, exports, attachments, secrets). `AppSecrets` loads the SQLCipher key from Windows Credential Manager (or JSON fallback) and exposes it through `AppState`.
- **SQLCipher DSN Propagation**: On startup, `AppState::paths.database_url()` composes a file URL such as `file:///C:/.../app.db?cipher=sqlcipher&kdf_iter=256000&cipher_page_size=1024&mode=rwc&cache=shared&key=<encoded>` and injects it into `std::env::set_var("DATABASE_URL", ...)`, ensuring Prisma CLI commands and future Tauri commands share the same connection string.
- **Structured Logging**: `logging::init_logging` configures JSON logs with `tracing_subscriber` and a rotating file sink inside `%APPDATA%/FinanceApp/storage/logs`, masking PII before emission.
- **Capabilities & Permissions**: `src-tauri/capabilities/main.json` now grants the main window `core:default`, `core:path:default`, `core:event:default`, `core:window:default`, `core:menu:default`, and `core:tray:default`, mirroring the Context7 `/tauri-apps/tauri-docs` guidance on least-privilege window permissions. Tauri automatically loads the capability file, so the config simply declares the secure `main` window definition.

---

## 2. Technology Stack & Rationale

| Layer | Primary Tech | Rationale & Trade-offs / Alternatives |
| --- | --- | --- |
| Desktop Shell | **Tauri 2.x** | Minimal footprint, Rust-level security, deep Windows integration, native toast & tray support. Alternatives: Electron (heavier), Neutralino (less ecosystem). Context7 docs confirm best practices for `tauri.conf.json` configuration and advanced command patterns with state/events. |
| Frontend | **React 18 + TypeScript + Vite** | Familiar ecosystem, fast HMR, SSR-ready if needed. Alternatives: Solid.js (faster but smaller ecosystem), Svelte (learning curve). |
| UI Toolkit | **Radix UI + Tailwind CSS + Framer Motion** | Accessible headless primitives + utility styling + animation library for smooth transitions. |
| State & Data | **Zustand (light state), React Query/RTK Query for data fetching** | Local-first caches, optimistic updates for transactions/budgets. |
| Charts | **Apache ECharts** | Rich financial chart support (sunburst, forecast). Alternatives: Chart.js or ApexCharts (simpler but less flexible). |
| Validation | **Zod** | Shared schemas for UI/services to guarantee contract safety. |
| Dates | **Temporal polyfill (or Luxon)** | Precise budget/goal period calculations. |
| Backend Services | **TypeScript services running inside Tauri**, optional **Rust helpers** for heavy crypto tasks. |
| Database | **SQLite + SQLCipher + Prisma** | Offline-first, encrypted at rest, typed client. For high-volume analytics, add DuckDB extracts. |
| Sync Backend | **Fastify (Node 20 LTS) + PostgreSQL 15 + Prisma** | Lightweight REST/GraphQL service with JWT + encrypted payloads. Could be replaced with Supabase if managed hosting desired. |
| Notifications | **Tauri Windows Toast plugin + `@tauri-apps/api/window`** | Native toasts with actions; in-app queue mirroring for offline auditing. |
| Packaging | **MSIX** | Windows-friendly installer, digital signing for SmartScreen. |
| CI/CD | **GitHub Actions + tauri-apps/tauri-action** | Cross-platform builds, signing, release automation. |

---

## 3. Component Responsibilities

### 3.1 UI Layer
- Route structure (React Router) with feature-based folders (`/features/budgets`, `/features/goals`).
- Hooks generated from Tauri commands (Specta-compatible) ensure compile-time types.
- Implements offline indicators, skeleton loaders, undo/redo stacks, and virtualization for large transaction tables.

### 3.2 Tauri Command Layer
- Registers commands via `tauri::Builder::default().invoke_handler(...)`, sharing state (e.g., Prisma client handles) using `.manage`.
- Emits domain events to the UI (`window.emit("budget:updated", payload)`).
- Uses `addPluginListener('before-exit', ...)` for graceful shutdown (per Context7 guidance).

### 3.3 Business Services
- `TransactionService`: Validate income/expense/transfer logic, trigger budget recalculations, and persist ledger changes. The Stage 2 implementation (`SqliteTransactionService`) runs inside the Tauri backend using `rusqlite` on the SQLCipher database. It exposes CRUD operations for accounts/categories/transactions, enforces optimistic locking, and ensures `Account.balance_cents` stays in sync by applying deltas whenever transactions are created, updated, deleted, or imported.
- `DashboardService`: Aggregate KPIs (net worth, cash flow, budget burn, weekly spending) with <50 ms SQL queries, hydrate account highlights, and surface the data via `get_dashboard_snapshot`. Stage 3 ships the `SqliteDashboardService`, which derives deltas from transaction history, sums active budgets, and fills 7-day spend series even when no transactions exist on a given day.
- `BudgetService`: Manage envelope/period budgets, track actual vs target, compute burn rate for widgets. The Stage 4 implementation (`SqliteBudgetService`) calculates spent amounts from transactions matching budget category and period, computes progress percentage and status (Normal/At Risk/Over) based on alert thresholds, and supports rollover configuration. Budgets are displayed in a responsive grid with circular progress rings and color-coded status indicators.
- `GoalService`: Manage savings targets, compute projections, trigger milestone notifications. The Stage 5 implementation (`SqliteGoalService`) calculates current amounts from transactions linked via `goal_id`, computes progress percentages and projected completion dates based on target dates, automatically transitions goals to "Achieved" status when targets are reached, and supports status management (Active/Paused/Achieved/Abandoned) with priority-based sorting. Goals are displayed in a Kanban board UI with progress bars and status indicators.
- `ReportService`: Materialize analytics views, cache aggregated rows, produce chart-ready DTOs. The Stage 7 implementation (`SqliteReportService`) provides monthly reports with spending by category, income vs expense analysis, budget summaries, and forecast calculations using simple linear regression. Reports are cached for 30 minutes to improve performance. The service supports export in CSV, JSON, encrypted JSON, and PNG formats. Query optimization includes indexes on transaction type/date combinations and report cache expiration.
- `ReminderService`: Manage RRULE definitions, non-linked reminders (e.g., pay credit card), and send instructions to scheduler. The Stage 6 implementation (`SqliteReminderService`) calculates `next_fire_at` based on `due_at` and simplified recurrence rules (DAILY, WEEKLY, MONTHLY), supports snooze functionality with configurable duration, logs all actions to `ReminderLog` for audit trail, and provides queries for due reminders. The frontend includes a Reminders page with status-filtered sections, a NotificationCenter drawer accessible via `Ctrl+Shift+N`, and auto-refreshing due reminders query.
- `SyncService`: Compose delta payloads, handle conflict resolution, decrypt/encrypt remote data.

### 3.4 Database & Repository Layer
- Prisma repositories per aggregate.
- Migration scripts enforce constraints & indexes; seeds provide starter categories.
- Data access functions always run inside transactions when performing multi-entity updates (e.g., transfer touches two accounts + ledger log).

### 3.5 Sync Layer
- Optional background job (Tauri plugin or cron) triggered on network availability.
- Upload flow: gather changed rows since `last_synced_at`, sign payload, POST to `/sync/upload`.
- Download flow: GET `/sync/download?cursor=...`, merge using vector clocks + semantic merges (budgets prefer latest period values, transactions always append).

### 3.6 Background Scheduler
- Worker uses `@tauri-apps/api/process` to spawn a hidden task or Rust async runtime to poll `reminder` table (due <= now).
- Applies RRULE or cron-like expressions stored as text (RFC 5545). Updates `next_fire_at` with helper library (rrule.js).
- Writes audit entries to `reminder_run_log`.

### 3.7 Notification System
- Windows toast actions: **Pay**, **Snooze (choose +1h/+1day)**, **Open app**.
- Toast payload includes reminder ID; handler routes to `ReminderService`.
- In-app notification center (Radix `Toast` + custom queue) mirrors state for offline review.

### 3.8 Export/Import
- Supports CSV (transactions), PDF (reports), PNG (charts) using ECharts renderer, and encrypted JSON bundle for full backup.
- Imports require schema versioning and checksum verification; invalid rows quarantined in `import_audit` table.

### 3.9 Security & Observability
- SQLCipher key stored via Windows Credential Manager retrieved using secure Tauri command (Rust side) at boot.
- Structured logging (pino for services, tracing for Rust). Logs route to rotating file in `%APPDATA%/Logs`.
- Telemetry opt-in; if disabled, only anonymous crash reports stored locally.

### 3.10 Application State & Dependency Injection
- **PathState**: Resolves `%APPDATA%/<Product>/FinanceApp` using `app.path().app_data_dir()` (per Context7 secure path guidance) and eagerly creates `storage`, `logs`, `attachments`, and `exports` folders. Exposes helpers such as `db_path()` and `database_url(key)` for downstream services.
- **AppState**: Stores `PathState`, `AppSecrets`, the SQLCipher DSN, and a `ServiceRegistry`. Commands obtain it via `State<AppState>` to read filesystem roots, secrets, or service handles without recalculating paths.
- **ServiceRegistry**: Provides a builder that accepts concrete implementations for `TransactionService`, `DashboardService`, `BudgetService`, etc., while defaulting to noop structs until Stage 2. `descriptors()` exposes metadata for diagnostics, and cloning methods (`transaction()`, `dashboard()`, `budget()`, ...) return `Arc<dyn ...>` handles for command modules.
- **Event & Connectivity Bridges**: The React provider listens to browser online/offline events and updates `useAppStore().isOffline`, enabling the UI banner + quick actions to react instantly. Frontend mutations dispatch `transaction:changed` events; the dashboard hook re-validates cached KPIs when it hears the event, keeping numbers and charts in sync without polling.
---

## 4. Data Model

### 4.1 Entities & Relationships
| Entity | Purpose | Key Relations |
| --- | --- | --- |
| `user` | Application profile & preferences | 1:N `account`, `budget`, `goal`, `reminder` |
| `account` | Bank, card, cash, wallet | Belongs to `user`; 1:N `transaction`; optional sync metadata |
| `category` | Hierarchical spending/income classification | Parent-child via `parent_id`; referenced by `transaction`, `budget` |
| `transaction` | Ledger entries (income, expense, transfer) | Belongs to `account`, `category`, optional `goal` |
| `budget` | Envelope or period-based plan | Linked to optional `category` or `account`; has `budget_entry` history |
| `goal` | Savings/ payoff targets | 1:N `goal_checkpoint`, optional `transaction` link |
| `reminder` | Scheduled reminders/payments | Links to `account`/`transaction`, has `reminder_log` |
| `sync_state` | Tracks per-entity sync cursors | Supports delta upload/download |
| `report_cache` | Materialized aggregates | Speeds up ECharts queries |

> **Note**: Prisma’s SQLite connector does not support enum columns, so model fields such as `account.type`, `transaction.type`, `budget.period`, and `reminder.status` are declared as `String` in `schema.prisma`. We still enforce the allowed values via SQL `CHECK` constraints (see Section 4.2) and share TypeScript literal unions (e.g., `scripts/seed.ts`) so both the database and the application adhere to the same vocabulary.

### 4.2 SQL Schema (SQLite + SQLCipher)
\```sql
PRAGMA foreign_keys = ON;

CREATE TABLE user (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT,
  default_currency TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en-US',
  week_starts_on INTEGER NOT NULL DEFAULT 1,
  telemetry_opt_in INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE account (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash','checking','credit','savings','investment','wallet')),
  currency TEXT NOT NULL,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  institution TEXT,
  color_token TEXT,
  sync_external_id TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_account_user ON account(user_id);

CREATE TABLE category (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense','transfer')),
  parent_id TEXT REFERENCES category(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_category_user_type ON category(user_id, type);

CREATE TABLE transaction (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES category(id),
  goal_id TEXT REFERENCES goal(id),
  type TEXT NOT NULL CHECK (type IN ('income','expense','transfer')),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  exchange_rate REAL,
  occurred_on DATE NOT NULL,
  cleared INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  tags TEXT,
  attachment_path TEXT,
  recurrence_id TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_tx_user_date ON transaction(user_id, occurred_on);
CREATE INDEX idx_tx_category ON transaction(category_id, occurred_on);

CREATE TABLE budget (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('weekly','monthly','quarterly','yearly')),
  type TEXT NOT NULL CHECK (type IN ('envelope','overall')),
  category_id TEXT REFERENCES category(id),
  amount_cents INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rollover INTEGER NOT NULL DEFAULT 0,
  alert_threshold REAL NOT NULL DEFAULT 0.8,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_budget_user_period ON budget(user_id, period, start_date);

CREATE TABLE budget_entry (
  id TEXT PRIMARY KEY,
  budget_id TEXT NOT NULL REFERENCES budget(id) ON DELETE CASCADE,
  actual_cents INTEGER NOT NULL,
  projected_cents INTEGER NOT NULL,
  snapshot_date DATE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX idx_budget_entry_snapshot ON budget_entry(budget_id, snapshot_date);

CREATE TABLE goal (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_cents INTEGER NOT NULL,
  current_cents INTEGER NOT NULL DEFAULT 0,
  target_date DATE,
  category_id TEXT REFERENCES category(id),
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('active','paused','achieved','abandoned')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_goal_user_status ON goal(user_id, status);

CREATE TABLE reminder (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  account_id TEXT REFERENCES account(id),
  amount_cents INTEGER,
  due_at DATETIME NOT NULL,
  recurrence_rule TEXT,
  next_fire_at DATETIME,
  channel TEXT NOT NULL DEFAULT 'toast', -- toast, in_app, email (future)
  snooze_minutes INTEGER DEFAULT 0,
  last_triggered_at DATETIME,
  status TEXT NOT NULL CHECK (status IN ('scheduled','sent','snoozed','dismissed')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_reminder_due ON reminder(user_id, next_fire_at);

CREATE TABLE reminder_log (
  id TEXT PRIMARY KEY,
  reminder_id TEXT NOT NULL REFERENCES reminder(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('sent','clicked_pay','clicked_snooze','clicked_open')),
  metadata TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sync_state (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  entity_name TEXT NOT NULL,
  last_local_change DATETIME,
  last_remote_cursor TEXT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, entity_name)
);

CREATE TABLE report_cache (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  payload TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, key)
);
\```

**Connection String**: Every CLI/runtime consumer must use the SQLCipher-enabled URI that `PathState::database_url` emits (for example `file:///C:/Users/<user>/AppData/Roaming/Personal%20Finance%20Desktop/FinanceApp/storage/app.db?cipher=sqlcipher&kdf_iter=256000&cipher_page_size=1024&mode=rwc&cache=shared&key=<base64>`). The key is fetched from Windows Credential Manager or `PF_APP_DB_KEY`, so secrets never leak into the frontend or repository.

### 4.3 Prisma Schema (Excerpt)
\```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id             String   @id
  email          String?  @unique
  display_name   String?
  default_currency String
  locale         String   @default("en-US")
  week_starts_on Int      @default(1)
  telemetry_opt_in Boolean @default(false)
  accounts       Account[]
  categories     Category[]
  transactions   Transaction[]
  budgets        Budget[]
  goals          Goal[]
  reminders      Reminder[]
  syncStates     SyncState[]
  reportCaches   ReportCache[]
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt
}

model Account {
  id          String   @id
  user_id     String
  user        User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  name        String
  type        AccountType
  currency    String
  balance_cents Int
  institution String?
  color_token String?
  sync_external_id String?
  transactions Transaction[]
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
}

model Transaction {
  id           String   @id
  user_id      String
  account_id   String
  category_id  String?
  goal_id      String?
  user         User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  account      Account   @relation(fields: [account_id], references: [id], onDelete: Cascade)
  category     Category? @relation(fields: [category_id], references: [id])
  goal         Goal?     @relation(fields: [goal_id], references: [id])
  type         TransactionType
  amount_cents Int
  currency     String
  exchange_rate Float?
  occurred_on  DateTime
  cleared      Boolean   @default(false)
  notes        String?
  tags         String?
  attachment_path String?
  recurrence_id String?
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt
  @@index([user_id, occurred_on])
  @@index([category_id, occurred_on])
}

enum AccountType {
  cash
  checking
  credit
  savings
  investment
  wallet
}

enum TransactionType {
  income
  expense
  transfer
}

// ...additional models mirror SQL schema (Budget, Goal, Reminder, etc.)
\```

### 4.4 Indexing & Optimization
- **Time-series queries**: `transaction(user_id, occurred_on)` supports monthly trend line & forecast. Add covering indexes (`category_id, occurred_on`) for spending-by-category charts.
- **Budgets**: Unique `(budget_id, snapshot_date)` ensures deterministic history for progress charts.
- **Reminders**: `(user_id, next_fire_at)` accelerates scheduler scans.
- **Report cache**: hashed `key` (combination of filters) prevents duplicate aggregates; TTL stored in `expires_at`.
- **Sync**: `sync_state` unique constraint prevents duplicate entity trackers and simplifies UPSERT logic.

---

## 5. Command & API Specification

### 5.1 Tauri Commands (TypeScript Signatures)
| Command | Request Payload | Response | Notes |
| --- | --- | --- | --- |
| `listAccounts` | `{ includeBalances?: boolean }` | `AccountDTO[]` | Backed by `SqliteTransactionService`; when `includeBalances=true` a live aggregate is computed alongside the stored `balance_cents`. |
| `listCategories` | `void` | `CategoryDTO[]` | Returns non-archived categories scoped to the offline user. |
| `listTransactions` | `{ limit?, offset?, accountId?, categoryId?, search? }` | `TransactionDTO[]` | Supports pagination + filtering; search inspects notes/tags via lowercase LIKE queries. |
| `createTransaction` | `CreateTransactionInput` | `TransactionDTO` | Validates via Zod, applies ledger deltas atomically, returns the hydrated row (account/category names included). |
| `updateTransaction` | `UpdateTransactionInput` | `TransactionDTO` | Reconciles previous and next account balances inside a SQL transaction before returning the updated DTO. |
| `deleteTransaction` | `{ id: string }` | `void` | Removes the row and reverses its balance impact. |
| `importTransactions` | `{ items: CreateTransactionInput[] }` | `TransactionDTO[]` | Bulk insert helper used by CSV/OFX importers and the sample “Import” button on the Transactions page. |
| `getMonthlyReport` | `{ month: string }` | `MonthlyReportDTO` | Uses `report_cache`, calculates spending trend, anomaly flags. |
| `getDashboardSnapshot` | `void` | `DashboardSnapshot` | Aggregates net worth, cash flow, budget burn, weekly spend, and account highlights through `SqliteDashboardService`. |
| `createBudget` | `BudgetInput` | `BudgetDTO` | Creates envelope + seed snapshot. |
| `scheduleReminder` | `ReminderInput` | `ReminderDTO` | Writes reminder + enqueues scheduler. |
| `syncUpload` | `{ cursor?: string, jwt?: string }` | `{ nextCursor: string, envelope }` | Batches deltas, base64-wraps payload, signs with HMAC (JWT secret) before POSTing to Fastify gateway. |
| `syncDownload` | `{ cursor?: string, jwt?: string }` | `{ entities: SyncEntity[], nextCursor: string, envelope }` | Retrieves remote deltas, verifies signature, merges into local sync_state, and logs conflicts. |
| `exportData` | `{ format: 'csv'|'json'|'pdf' }` | `{ path: string }` | Streams export to `%APPDATA%/Exports`. |
| `importData` | `{ filePath: string }` | `ImportResult` | Validates checksum/version before merging. |
| `updateGoalStatus` | `{ goalId: string, status: GoalStatus }` | `GoalDTO` | Triggers UI notification when achieved. |

**DTO Highlights**:
- `TransactionDTO`: includes `id`, `type`, `amount`, `currency`, `occurredOn`, `category`, `account`, `tags`, `notes`, `goal`, `exchangeRate`.
- `MonthlyReportDTO`: `spendingByCategory[]`, `trendLine`, `incomeVsExpense`, `budgetSummaries[]`, `forecast`.
- `DashboardSnapshot`: `currency`, `netWorthCents`, `netWorthDeltaCents`, `cashFlowCents`, `cashFlowPreviousCents`, `budgetTotalCents`, `budgetSpentCents`, `weeklySpending[]`, `accounts[]` (top balances).

### 5.2 Frontend Usage Example
\```ts
import { invoke } from '@tauri-apps/api/core';
import { appDataDir, join } from '@tauri-apps/api/path';

export async function saveTransaction(input: CreateTransactionInput) {
  const directory = await appDataDir();
  const attachmentDir = await join(directory, 'attachments');

  const payload = { ...input, attachmentDir };
  return invoke<TransactionDTO>('createTransaction', { payload });
}

export async function fetchMonthlyReport(monthIso: string) {
  const report = await invoke<MonthlyReportDTO>('getMonthlyReport', { month: monthIso });
  window.dispatchEvent(new CustomEvent('report:loaded', { detail: report }));
  return report;
}
\```
*Best practice reference*: Context7 Tauri docs emphasize using `appDataDir()` + `join()` for safe, cross-platform paths and leveraging command events for progress reporting via `window.emit`.

### 5.3 Cloud Sync REST API (Fastify)
| Endpoint | Method | Description | Auth |
| --- | --- | --- | --- |
| `/auth/login` | POST | Exchange credentials for JWT; payload encrypted with libsodium sealed boxes. | None |
| `/sync/upload` | POST | Accepts `{ cursor, deltas[] }`; validates signatures, stores per-entity revisions. | Bearer JWT |
| `/sync/download` | GET | Returns deltas newer than cursor; includes `conflicts[]`. | Bearer JWT |
| `/reminders/push` | POST | Optional remote reminder creation (e.g., email). | Bearer JWT |
| `/reports/summary` | GET | Cloud-generated analytics (heavy queries). | Bearer JWT |

**Error Contract** (JSON):
```json
{ "error": { "code": "SYNC_CONFLICT", "message": "Budget B123 has divergent period", "conflicts": [...] } }
```

### 5.4 Optional GraphQL Schema (excerpt)
\```graphql
type Query {
  monthlyReport(month: String!): MonthlyReport!
  goals: [Goal!]!
}

type Mutation {
  createTransaction(input: CreateTransactionInput!): Transaction!
  scheduleReminder(input: ReminderInput!): Reminder!
}
\```

---

## 6. UI / UX System

### 6.1 Pages & Flows
1. **Dashboard**: KPI cards (net worth, cash flow, budget burn), quick actions (Add transaction, Add goal placeholder), command palette (`Ctrl+K`), offline indicator badge, top-account highlights, and mini charts (weekly spend).
2. **Transactions**: TanStack Table-powered infinite list with filters (account/category/search), inline editing for notes/amount, optimistic CRUD mutations, Radix Dialog quick-add modal, and sample import helper for smoke testing.
3. **Budgets**: Grid of envelopes with progress rings, variance table, rollover controls.
4. **Goals**: Kanban-style board (Active/On Track/At Risk/Completed), progress bars, recommendation cards.
5. **Reports**: Chart gallery tabs (Category donut, Trend line, Income vs expense area, Budget progress stacked bars, Goal progress gauge, Forecast line).
6. **Reminders**: Calendar/list hybrid, upcoming timeline view, snooze/reschedule actions.
7. **Settings**: General (currency, locale, week start, display name, telemetry toggle), Accounts (planned), Categories (drag to reorder - planned), Sync (planned for Stage 9), Notifications (planned), Data (export/import - export placeholders exist, import validation planned), Appearance (light/dark/auto with system preference detection). Stage 8 implementation includes `SqliteSettingsService` on Rust backend, Tauri commands for settings management, Settings UI page with sections, theme switcher with immediate application, and telemetry toggle. Theme preference is persisted in User model and applied via `data-theme` attribute on document root.

### 6.2 Component System
- **Navigation sidebar** with collapsible groups, icons, unread indicators (notifications).
- **Top app bar** featuring search, quick add button, profile menu, sync status.
- **Cards** (Radix) for KPIs, budgets, goals.
- **Tables** using TanStack Table w/ virtualization.
- **Modals & Drawers** for create/edit flows (accessible focus trap).
- **Financial widgets**: budget indicators, goal widgets, progress bars with Framer Motion.
- **Chart wrappers**: ECharts components with responsive breakpoints.
- **Notification center**: toast queue + historical panel.
- **Command palette overlay**: Radix Dialog + keyboard navigation for quick actions and navigation.

### 6.3 Interaction Rules
- **Hotkeys**: `Ctrl+N` (new transaction), `Ctrl+Shift+B` (new budget), `Ctrl+K` (command palette), `Ctrl+/` (toggle keyboard shortcuts).
- **Drag & Drop**: Category reorder, transaction re-categorization, goal prioritization.
- **Inline Editing**: Amount, category, notes in transaction table; budgets allow inline amount edit.
- **Animations**: Framer Motion for card entrance, progress updates (<200ms) to preserve responsiveness.
- **Light/Dark Mode**: System preference detection, user override stored in `userSettings`.
- **Accessibility**: Focus rings via Tailwind `ring-offset`, ARIA labels for nav, `prefers-reduced-motion` fallback (disable non-essential animations).

### 6.4 Style System (Tailwind Tokens)
- **Color Palette**:
  - `--color-bg`: `#0F172A` dark / `#F8FAFC` light.
  - `--color-surface`: `#1E293B` / `#FFFFFF`.
  - `--color-primary`: `#4F46E5`.
  - `--color-success`: `#10B981`.
  - `--color-warning`: `#F59E0B`.
  - `--color-danger`: `#EF4444`.
- **Spacing Scale**: 4px base → `[4,8,12,16,20,24,32,40,48,64]`.
- **Border Radius**: default `12px`, cards `16px (2xl)`, buttons `8px`.
- **Typography**: Inter/JetBrains Mono pairing; sizes: `xs 12px`, `sm 14px`, `base 16px`, `lg 18px`, `xl 24px`, `2xl 32px`.
- **Shadows**: `sm (0 1px 2px / 0.08)`, `md (0 4px 24px / 0.12)`.
- **Iconography**: Lucide/Phosphor icons, consistent stroke width.

---

## 7. Reports & Analytics Module

### 7.1 Required Charts & Data Sources
| Chart | Data Source | Notes |
| --- | --- | --- |
| Spending by Category (donut) | aggregated transactions grouped by category type=expense | Filter by date range + tags; highlight overspend categories. |
| Monthly Trend Line | `transaction` aggregated per month (income & expense) | Supports forecast line (ARIMA-lite or simple regression). |
| Income vs Expenses Area | Sum income vs expense per month | Display net difference bars. |
| Budget Progress Bars | `budget_entry` snapshots | Show actual vs projected + alert threshold. |
| Goal Progress Gauges | `goal` + contributions | Display percent and ETA vs target date. |
| Forecasted Spending | Rolling 3-month average + standard deviation | Provide warnings when predicted spend > budget. |

### 7.2 Aggregation Logic
- Use Prisma raw queries or SQLite window functions for performance.
- Cache heavy aggregates in `report_cache` with TTL (default 30 minutes) and invalidation triggered by transaction/budget updates.
- For forecast: compute slope/intercept via least squares on last N months; store in `report_cache`.

### 7.3 Example ECharts Config (Spending by Category)
\```ts
const chartOptions = {
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { orient: 'vertical', left: 'left' },
  series: [{
    name: 'Spending',
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    itemStyle: { borderRadius: 12, borderColor: '#0f172a', borderWidth: 2 },
    data: spendingData,
    emphasis: { scale: true, scaleSize: 12 }
  }]
};
\```

### 7.4 Export Options
- **PNG/PDF**: Use ECharts `getDataURL()` + Tauri filesystem API to write.
- **CSV**: Provide aggregated dataset used for charts.
- **Notebook Export**: Future extension via DuckDB or Excel template.

---

## 8. Reminder & Notification System

### 8.1 Scheduler Design
- Poll `reminder` table every minute (configurable) while app runs; when suspended, rely on Windows background tasks via Tauri plugin.
- Evaluate `recurrence_rule` (RRULE) with fallback to cron expressions.
- Support `snooze_minutes` and persist snooze history.

### 8.2 Windows Toast Flow
1. Scheduler identifies due reminder and emits `notification:prepared`.
2. Rust command invokes Windows toast API with actions: **Pay**, **Snooze**, **Open**.
3. User action returns to app via deep link → `handleToastAction`.
4. `ReminderService` updates status, logs entry, and if Pay choose, opens transaction modal prefilled.

### 8.3 In-App Notification Center
- Queue stored in memory + `reminder_log` for history.
- Radix `Toast.Provider` used for ephemeral view; a drawer view shows archived notifications with filters.
- Snoozed reminders show countdown chips; dismissed ones remain searchable.

### 8.4 Sync Integration
- `reminder` changes included in sync payload; remote reminders can generate pushes if enabled.
- Conflict resolution: keep earliest `next_fire_at`, merge `recurrence_rule` by version number.
- Sync transport uses HMAC-signed envelopes (JWT secret) and base64-wrapped payloads produced by `SqliteSyncService`; Settings > Sync exposes manual trigger and status pill to surface gateway health.

---

## 9. Security & Privacy Architecture
- **Encryption at Rest**: SQLCipher with 256-bit key retrieved/stored via Windows Credential Manager; rotate using key version table and background rekey job.
- _Implementation note_: Stage 2 ships with `rusqlite` + bundled SQLite. The SQLCipher key is still applied via `PRAGMA key`; failing environments log a warning and continue unencrypted—flagged as a risk to be resolved before Stage 6.
- **Secrets Handling**: Keys never touch frontend; Rust command unlocks DB and passes DSN via environment variable override.
- **Input Validation**: Zod schemas for all commands, including range checks (amount > 0), date boundaries, and length limits to prevent SQL injection / overflow.
- **Network Security**: Sync requests enforce TLS 1.3, JWT with short lifetimes, refresh tokens stored encrypted. Payloads optionally double-encrypted (AES-GCM) using user key.
- **Export/Import Hardening**: Exports include checksum + schema version; imports verified, scanned for macros, and sanitized (strip HTML).
- **Telemetry**: Opt-in only; if enabled, send anonymized metrics (app version, feature usage). Provide toggle + data deletion button.
- **Logging**: Use structured JSON logs; levels: TRACE (dev), INFO (default), WARN, ERROR. Strip PII (mask account numbers) before writing.
- **Rate Limiting & DoS**: Sync API enforces 100 req/min per user + exponential backoff instructions.
- **Secure Storage Locations**: Use `resourceDir()` for read-only assets, `%APPDATA%/FinanceApp` for mutable data (per Context7 best practice path guidance).

---

## 10. Data Export / Import & Lifecycle
- **Export Pipeline**: User selects format → Tauri command composes dataset → writes to `Exports/<timestamp>/<format>` directory (ensuring `join(appDataDir, ...)`).
- **Import Pipeline**: Validate file signature, decompress, run dry-run validation (duplicate categories, mismatched currency). Replay into transaction with idempotent keys.
- **Lifecycle**: Provide retention policy settings (auto-delete old reminders/logs after N days). Background job prunes `report_cache` & `reminder_log` beyond retention.

---

## 11. Packaging & Deployment (MSIX + Updates)
1. **Build Frontend**: `pnpm build` (Vite) outputs to `dist/`.
2. **Tauri Build**: Configure `src-tauri/tauri.conf.json` with `"frontendDist": "../dist"`, `"devUrl": "http://localhost:5173"`, MSI target list, and the secure `main` window wired to `capabilities/main.json`, which limits filesystem access to `$APPDATA`/`$RESOURCE` following the Context7 capability best practices.
3. **Cargo Build**: Release profile uses LTO, `panic = "abort"`, `strip = true` (per Tauri guidance).
4. **MSI Packaging**: `tauri build --target x86_64-pc-windows-msvc`; CI runs `tauri-apps/tauri-action@v0` with release metadata and signed output. Switch to MSIX/updater when schema/tooling allow.
5. **Code Signing**: EV certificate (`certificateThumbprint` placeholder) with CI secrets (`TAURI_PRIVATE_KEY`, `TAURI_KEY_PASSWORD`); do not commit certs/keys.
6. **Updates**: Updater to be enabled once schema supports it; beta uses manual installer and Settings > Sync shows manual sync, not updater trigger.
7. **Distribution**: Signed MSI + release notes; nightly sync tests validate gateway compatibility before posting installers.

---

## 12. CI/CD Pipeline (GitHub Actions)

### 12.1 Stages
1. **Lint & Type-check**: `pnpm lint`, `pnpm typecheck`, `cargo fmt --check`, `cargo clippy`.
2. **Unit Tests**: `pnpm test`, `cargo test`.
3. **Integration/UI Tests**: Playwright headless suite (`pnpm test:e2e`).
4. **Build + Package**: `tauri-apps/tauri-action` builds Windows binary + MSIX and attaches artifacts.
5. **Sign & Release**: Signing happens within the action using `TAURI_PRIVATE_KEY`/`TAURI_KEY_PASSWORD`; releases include changelog + MSIX.
6. **Nightly Sync Tests**: Scheduled job hitting the Fastify mock gateway via `pnpm test --filter sync`.

### 12.2 Sample Workflow Snippet
\```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'
jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - uses: actions-rs/toolchain@v1
        with: { profile: minimal, toolchain: stable, components: clippy }
      - run: pnpm install --frozen-lockfile --ignore-scripts
      - run: pnpm lint && pnpm typecheck && pnpm test
      - run: cargo fmt --check && cargo clippy -- -D warnings && cargo test
      - run: pnpm playwright install --with-deps
      - run: pnpm test:e2e --reporter=list
      - uses: tauri-apps/tauri-action@v0
        with:
          tagName: v__VERSION__
          releaseName: "Finance App v__VERSION__"
          releaseBody: "Automated release"
          tauriScript: pnpm tauri
          args: --target x86_64-pc-windows-msvc --bundles msix
        env:
          TAURI_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}
          TAURI_KEY_PASSWORD: ${{ secrets.TAURI_KEY_PASSWORD }}
  nightly-sync:
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile --ignore-scripts
      - run: pnpm test --filter sync
\```

---

## 13. Folder Structure
\```
/
├── docs/
│   └── architecture.md        # This document
├── src/
│   ├── app/
│   │   ├── App.tsx            # Shell + router
│   │   └── providers/         # Theme, query, store providers
│   ├── features/
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── budgets/
│   │   ├── goals/
│   │   ├── reports/
│   │   ├── reminders/
│   │   └── settings/
│   ├── components/            # Reusable UI primitives (tables, cards)
│   ├── services/              # Frontend service hooks (reports, sync)
│   ├── store/                 # Zustand slices / query clients
│   ├── styles/                # Tailwind config, tokens
│   └── utils/                 # Formatters, date helpers
├── src-tauri/
│   ├── src/
│   │   ├── main.rs            # Tauri entry, command registration
│   │   ├── commands/          # Rust wrappers (notifications, secrets)
│   │   └── services/          # TypeScript or Rust modules compiled via plugin
│   ├── package.json           # Tauri backend (if using TS commands)
│   ├── Cargo.toml
│   └── tauri.conf.json
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── scripts/
│   ├── seed.ts
│   └── export-import/
├── tests/
│   ├── unit/                  # Vitest suites
│   ├── integration/           # Prisma + command tests
│   └── e2e/                   # Playwright scenarios
├── .github/workflows/
│   └── ci.yml
├── package.json
├── pnpm-lock.yaml
└── README.md (to be generated)
\```

---

## 14. Testing Strategy

### 14.1 Levels & Goals
| Level | Goal | Tooling | Sample Coverage |
| --- | --- | --- | --- |
| Unit | Validate pure logic (budget math, dashboard KPI math, recurrence parsing) | Vitest | Ensure `BudgetService.calculateBurnRate` handles rollovers & zero targets; `calculatePercent` keeps dashboard burn ≤100%. |
| Integration | Ensure Tauri commands + Prisma + encryption pipeline behave end-to-end | Vitest + `@tauri-apps/api` mocks + sqlite memory | `createTransaction` command writes ledger, updates budgets, logs events; `getDashboardSnapshot` aggregates KPIs from the same SQLCipher DB. |
| UI Component | Guarantee components render/behave (Radix modals, charts) | Testing Library + MSW | Transaction table inline edit, chart re-render on filter change. |
| E2E | Validate golden flows (Add transaction → budget updates → chart refresh) | Playwright (desktop) | Happy path + offline/online toggle scenarios. |
| Sync/Background | Verify scheduler + sync apply correct states | Vitest worker tests + mocked time | Reminder fired, snoozed, re-queued; sync resolves conflicts. |

### 14.2 Example Unit Test (Vitest)
\```ts
import { describe, it, expect } from 'vitest';
import { calculateBudgetProgress } from '@/services/budgets/progress';

describe('calculateBudgetProgress', () => {
  it('respects rollover and alert thresholds', () => {
    const result = calculateBudgetProgress({
      amount: 100000,
      actual: 72000,
      rollover: 15000,
      alertThreshold: 0.8
    });
    expect(result.percent).toBeCloseTo(0.82, 2);
    expect(result.isAlert).toBe(true);
  });
});
\```
**Test Description**: Verifies envelope budgets consider rollover funds and flag alerts when usage exceeds threshold.

\```ts
import { describe, expect, it } from 'vitest';
import { calculatePercent } from '@/features/dashboard/utils';

describe('calculatePercent', () => {
  it('clamps output to 0-100%', () => {
    expect(calculatePercent(150, 100)).toBe(100);
    expect(calculatePercent(0, 200)).toBe(0);
  });
});
\```
**Test Description**: Guards the dashboard burn-rate card from dividing by zero or overflowing 100%, matching the UX indicators.

### 14.3 Integration Test (Command)
\```ts
it('creates transaction and emits event', async () => {
  const tx = await invoke<TransactionDTO>('createTransaction', { payload: mockPayload });
  expect(tx.id).toBeTruthy();
  const event = await once('transaction:created');
  expect(event.detail.amount).toBe(mockPayload.amount);
});
\```
**Scenario**: Command should persist transaction, emit event, and return DTO with normalized currency.

### 14.4 Playwright E2E Scenario
1. Launch app via Playwright Tauri driver.
2. Add expense transaction (category Groceries, $80).
3. Navigate to Budgets; verify Groceries envelope updates progress ring & shows "At Risk" label if threshold exceeded.
4. Open Reports → Spending by Category chart; ensure Groceries slice increases accordingly.
5. Toggle offline mode (dev tool) → attempt sync (should queue). Go online → confirm sync success toast.

**Edge Cases to Cover**: Negative amounts, crossing currency conversions, reminders firing during offline mode, import duplicates, conflict resolution in sync.

---

## 15. 10-Week Roadmap (with Acceptance Criteria)

| Week | Focus | Key Deliverables | Acceptance Criteria |
| --- | --- | --- | --- |
| 1 | Project Bootstrap | Repo setup, Tauri + React skeleton, Tailwind, Prisma schema stub, CI lint/test scaffolding | App launches with placeholder page; lint/typecheck pass; SQLCipher-enabled SQLite opens via dummy command. |
| 2 | Transactions Core | Accounts CRUD, TransactionService, `createTransaction` command, transaction table UI prototype | User can add/edit/delete transactions offline; data persists; inline edit works; unit tests for TransactionService pass. |
| 3 | Dashboard & KPIs | Dashboard cards, net worth calc, quick actions, event bus wiring | Dashboard loads KPIs from real data; updates in <250ms after transaction; e2e test verifies quick-add flow. |
| 4 | Budgets System | BudgetService, envelopes UI, alerts, rollover logic, budget snapshots | Budgets page shows progress bars with alert states; `BudgetService` tests cover rollovers; acceptance test verifies envelope update after expense. |
| 5 | Goals Module | Goal CRUD, projections, widgets, notifications for milestones | Goals page displays progress & ETA; achieving goal triggers notification; Vitest coverage >80% for GoalService. |
| 6 | Reminders & Notifications | Reminder scheduler, Windows toast integration, in-app center | Reminders can be created w/ RRULE; due reminders show toast with actions; snooze + pay actions update status; integration tests cover scheduler. |
| 7 | Reports & Analytics | ReportService aggregates, ECharts dashboards, export (PNG/PDF/CSV) | Reports page renders specified charts; exports produce files; performance: <1.5s for 10k transactions. |
| 8 | Settings, Categories, Data Ops | Settings UI, category reorder, import/export JSON, theme switch | Users change locale/currency, reorder categories via drag/drop, export/import sample data; automated test verifies import validation. |
| 9 | Packaging & Sync Prep | MSIX packaging, digital signing setup, optional Fastify sync skeleton | Signed MSIX builds in CI; manual install succeeds; sync endpoints stubbed with authentication + sample delta flow. |
|10| Hardening & Beta | Full test suite, performance profiling, telemetry toggle, beta release | All tests pass in CI; memory footprint <150MB idle; telemetry opt-in/out works; GitHub Release with installers + changelog. |

---

## 16. How to Use & Next Steps
- **Planning**: Use Section 15 to drive sprint planning and stakeholder reviews.
- **Implementation**: Developers should align their feature branches with the relevant sections; update this doc and add changelog entries whenever architecture decisions change.
- **Testing**: Follow Section 14 templates; ensure new features specify test scenarios (goal, inputs, expected result, edge cases).
- **Documentation Maintenance**: On every significant change, bump Version/Date in metadata and append changelog entry per Section “Changelog”.

---

## 17. References & Best Practices
- Context7 / Tauri docs on secure path handling: leverage `appDataDir()` + `join()` for storing DB/exports and `resourceDir()` for assets.
- Context7 / Tauri configuration examples: ensure `tauri.conf.json` `distDir` & `devPath` match Vite output; manage state via `tauri::Builder::manage`.
- Tauri event/listener best practices: use `window.emit` for progress updates (`process_data` example) and `addPluginListener('before-exit', ...)` for cleanup.
- Follow OWASP MASVS for desktop apps, Microsoft UX guidelines for Fluent-like surface styling.

---

## 18. Testing & Validation Checklist (Quick Reference)
- [ ] Unit tests updated/added with description (goal, scenario, inputs, expected, edge cases).
- [ ] Integration tests cover new commands/services.
- [ ] Playwright scenario updated when UI flows change.
- [ ] Documentation (this file + README/CHANGELOG) updated with version/date.
- [ ] CI pipeline green (lint, typecheck, tests, build).
- [ ] Security review of new inputs/exports.

This blueprint is now ready to hand off to implementation teams. Update it whenever architecture, constraints, or timelines evolve.
