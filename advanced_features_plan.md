# Personal Finance Desktop - Advanced Features Implementation Plan

## Document Metadata
- **Purpose**: Provide a comprehensive implementation blueprint for advanced features (A1-A7) that extend the core application with high-value capabilities including predictive analytics, OCR, scenario simulation, and gamification. This document defines how to implement each feature following the established architecture patterns from `main_plan_build.md` and `docs/architecture.md`.
- **Detailed Description**: Breaks down 7 advanced feature modules into concrete implementation stages with entry/exit criteria, technical specifications, test requirements, and documentation deliverables. Each feature must integrate seamlessly with the existing core platform (Stages S0-S11) while maintaining offline-first principles, local execution, and security standards.
- **How to Use**: Reference this document when implementing advanced features after core platform completion. Update status markers at the start and end of each feature implementation, execute listed tests, and append changelog entries. Link all tickets to relevant feature stages and mirror acceptance checks in PR templates.
- **Examples**: Feature A1 describes how to extend the category system with icons, subcategories, and color palettes; Feature A3 outlines the predictive engine architecture with EMA smoothing and forecast caching; Feature A4 details OCR receipt scanning with Tesseract integration and encrypted image storage.
- **How to Test**: Follow the "Tests to Implement" section per feature; they include unit, integration, UI, e2e, performance, and security checks plus verification commands (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `cargo test`, etc.) that must pass before feature completion.
- **Limitations**: Advanced features assume core platform (S0-S11) is stable and operational. OCR accuracy depends on image quality and language pack availability. Predictive algorithms use heuristic methods (no external ML frameworks). Scenario simulation is limited to local data and does not account for external market factors.
- **Modules Impacted**: React UI (`src/features/*`), Tauri bridge (`src-tauri/src/commands/*`), domain services (`src-tauri/src/services/*`), Prisma schema (`prisma/schema.prisma`), database migrations, background workers, export/import scripts, documentation (`docs/`), and testing harness (`tests/`).
- **Version**: 1.0.0
- **Last Updated**: 2025-11-21

## Changelog
- [2025-11-21] - Added: Initial advanced features implementation plan covering A1 (Advanced Category System), A2 (Smart Finance Insights), A3 (Predictive Finance Engine), A4 (OCR Receipt Scanner), A5 (Financial Scenario Simulator), A6 (Monthly Planner System), and A7 (Gamification Layer).

## 1. Guiding Principles for Advanced Features

1. **Local Execution First**: All processing (insights, OCR, predictions, scenarios) must run locally without requiring cloud services. No external API dependencies for core functionality.
2. **Offline-First Capabilities**: All advanced features must remain fully functional regardless of internet availability. Cache strategies and local storage are mandatory.
3. **Modular Integration**: Each advanced feature shall be implemented as a separate isolated module (e.g., `src/features/insights/`, `src/features/ocr/`, `src-tauri/src/services/insights/`) with clear boundaries and minimal coupling to core services.
4. **Performance Requirements**:
   - Forecast generation: ≤ 200 ms on datasets up to 10,000 transactions
   - Insights evaluation: ≤ 150 ms per rule set
   - Scenario simulation: ≤ 300 ms for 30-day projections
   - OCR processing: ≤ 5 seconds per receipt image
5. **Security Requirements**: All derived data (OCR images, cached forecasts, insight logs, scenario snapshots) must be stored in encrypted SQLite tables or encrypted file bundles. No sensitive data in logs. All user inputs validated via Zod schemas.
6. **Architecture Contract Alignment**: Map every feature to relevant sections of `docs/architecture.md`. Extend Prisma schema and Tauri command contracts before coding. Follow Context7 Tauri best practices.
7. **Definition of Done**: Code + automated tests + documentation + changelog entry + CI pass (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `cargo fmt --check`, `cargo clippy -- -D warnings`, `cargo test`).
8. **Documentation Discipline**: Each feature requires Markdown updates with metadata, architecture diagrams, API contracts, UX flows, test plans, and changelog entries (per `.cursor/rules/main.mdc`).

## 2. Feature Overview (Quick Reference)

| Feature ID | Priority | Outcome | Key Deliverables | Primary Tests | Primary Docs |
| --- | --- | --- | --- | --- | --- |
| A1 | High | Advanced Category System | Icons, subcategories, color palette, templates, merging | Unit: category hierarchy, Integration: CRUD with nesting, E2E: drag-drop reorder | `docs/architecture.md` Section 4, `src/features/categories/README.md` |
| A2 | High | Smart Finance Insights | Rule engine, insight types, notification integration | Unit: rule evaluation, Integration: daily scheduler, E2E: insight display | `docs/architecture.md` Section 3.8, `docs/insights.md`, `src/features/insights/README.md` |
| A3 | High | Predictive Finance Engine | Forecast algorithms, cache system, dashboard widgets | Unit: EMA/forecast math, Integration: cache invalidation, Performance: <200ms | `docs/architecture.md` Section 3.9, `docs/predictions.md`, `src/features/predictions/README.md` |
| A4 | Medium | OCR Receipt Scanner | Tesseract integration, image processing, transaction extraction | Unit: regex filters, Integration: OCR pipeline, Accuracy: ≥85% benchmark | `docs/architecture.md` Section 3.10, `docs/ocr.md`, `src/features/ocr/README.md` |
| A5 | Medium | Financial Scenario Simulator | Scenario engine, comparison UI, baseline snapshots | Unit: scenario math, Integration: save/load, E2E: scenario creation | `docs/architecture.md` Section 3.11, `docs/scenarios.md`, `src/features/scenarios/README.md` |
| A6 | Medium | Monthly Planner System | Planning UI, priority tracking, retrospective summaries | Unit: month calculations, Integration: auto-generation, E2E: plan creation | `docs/architecture.md` Section 3.12, `docs/planner.md`, `src/features/planner/README.md` |
| A7 | Low | Gamification Layer | Achievement system, streak tracking, badges | Unit: achievement logic, Integration: event triggers, E2E: badge unlock | `docs/architecture.md` Section 3.13, `docs/gamification.md`, `src/features/gamification/README.md` |

## 3. Feature Details & Implementation Checklists

### Feature A1 - Advanced Category System (Status: Not Started)
- **Entry Criteria**: Core platform (S0-S11) complete and stable. Category CRUD operations functional. Settings UI accessible. Database migration system operational.
- **Implementation Checklist**:
  1. **Database Schema Extension**:
     - Extend `Category` model in Prisma schema: add `icon TEXT`, `color TEXT`, `parent_id TEXT NULL`, `sort_order INTEGER DEFAULT 0`.
     - Create migration: `prisma migrate dev --name add_category_advanced_fields`.
     - Update `CategoryDto` in `src-tauri/src/services/transactions/mod.rs` to include new fields.
  2. **Icon System**:
     - Create icon library component (`src/components/icons/CategoryIcon.tsx`) with 48-60 SVG icons.
     - Implement emoji fallback for missing icons.
     - Store icon identifiers as strings (e.g., "food", "transport", "entertainment").
  3. **Color Palette**:
     - Build color picker component using HSL sliders (`src/features/categories/components/ColorPicker.tsx`).
     - Provide 12 preset color themes (Food, Housing, Transport, Entertainment, etc.).
     - Store colors as HSL strings (e.g., "hsl(210, 70%, 50%)").
  4. **Subcategory Support**:
     - Implement recursive category tree structure in `CategoryService` (`src-tauri/src/services/categories/mod.rs`).
     - Add validation to prevent circular references in parent-child relationships.
     - Update `listCategories` command to return hierarchical tree or flat list with `parent_id`.
  5. **Category Templates**:
     - Create seed data for starter packs (Food, Housing, Transport, Health, Education, etc.).
     - Add `applyCategoryTemplate` command to bulk-create categories from templates.
  6. **Category Merging**:
     - Implement `mergeCategories` command that:
       - Re-maps all transactions from source category to target category.
       - Deletes source category after merge.
       - Shows conflict resolution warnings if categories have different parent hierarchies.
  7. **UI Components**:
     - Build category management page (`src/features/categories/pages/CategoryManagement.tsx`).
     - Implement drag-and-drop reordering using `@dnd-kit/core` or Radix DnD.
     - Add category form with icon picker, color picker, and parent category selector.
     - Update transaction form to support subcategory selection with nested dropdowns.
  8. **Report Aggregation**:
     - Update `ReportService` to aggregate subcategories into parent category totals.
     - Add option to "Expand subcategories" in report views.
- **Tests to Implement**:
  - **Unit Tests**:
    - Category hierarchy validation (prevent circular references).
    - Icon/color serialization/deserialization.
    - Category merge logic (transaction re-mapping).
    - Subcategory aggregation math.
  - **Integration Tests**:
    - `createCategory` with parent_id creates valid hierarchy.
    - `updateCategory` parent_id updates tree structure.
    - `mergeCategories` re-maps all transactions correctly.
    - `listCategories` returns correct tree/flat structure.
  - **Component Tests**:
    - Category form renders icon picker and color picker.
    - Drag-and-drop reordering updates `sort_order`.
    - Nested category dropdown in transaction form.
  - **E2E Tests**:
    - Create category with icon and color → appears in list → used in transaction.
    - Create subcategory → appears nested under parent → transactions aggregate correctly.
    - Merge two categories → all transactions moved → source category deleted.
  - **Performance Tests**:
    - Category tree rendering with 100+ categories < 100 ms.
- **Documentation Deliverables**:
  - `docs/architecture.md` Section 4 updates (category data model, hierarchy, icons, colors).
  - `docs/testing.md` "Advanced Category System" section (test matrix, scenarios, edge cases).
  - `src/features/categories/README.md` (purpose, API contract, icon library reference, color palette guide, usage examples).
  - `CHANGELOG.md` entry for A1 completion.
- **Exit Criteria**:
  - Full CRUD on categories with subcategory relationships functional.
  - Icons and colors rendered consistently across all UI components.
  - Report aggregation includes multi-level nesting correctly.
  - All tests green locally + CI.
  - Documentation updated with metadata + changelog.
- **Next Feature**: A2 Smart Finance Insights.

### Feature A2 - Smart Finance Insights Module (Status: Not Started)
- **Entry Criteria**: Feature A1 complete (categories stable). Transaction history contains sufficient data (≥30 days). Dashboard and notification systems operational.
- **Implementation Checklist**:
  1. **Database Schema**:
     - Create `insight_log` table: `id TEXT PRIMARY KEY`, `type TEXT`, `message TEXT`, `metadata JSON`, `created_at DATETIME`, `is_read BOOLEAN DEFAULT 0`, `priority TEXT DEFAULT 'info'`.
     - Create migration: `prisma migrate dev --name add_insight_log`.
  2. **Insight Engine Architecture**:
     - Create module `src-tauri/src/services/insights/mod.rs` with `InsightService` trait.
     - Implement `SqliteInsightService` with rule evaluation engine.
     - Create rule definitions in `src-tauri/src/services/insights/rules/`:
       - `period_comparison.rs`: Period-to-period spending comparisons.
       - `budget_threshold.rs`: Budget alert thresholds (80%, 90%, 100%).
       - `goal_projection.rs`: Goal completion timeline predictions.
       - `subscription_detection.rs`: Recurring merchant identification.
       - `unusual_expense.rs`: Outlier detection using statistical methods.
  3. **Rule Engine Implementation**:
     - Each rule implements `InsightRule` trait with `evaluate(context: &InsightContext) -> Option<Insight>`.
     - Rules are declarative and composable (can be enabled/disabled per user preference).
     - Context includes: transaction history, budgets, goals, account balances, time ranges.
  4. **Scheduler Integration**:
     - Extend background scheduler (`src-tauri/src/scheduler/mod.rs`) to run insight evaluation daily at 03:00 local time.
     - Use `tauri::async_runtime::spawn` for async insight generation.
     - Store insights in `insight_log` table with appropriate priority levels.
  5. **Insight Types Implementation**:
     - **Period-to-Period Comparison**: Compare current month vs. previous month spending by category.
     - **Budget Threshold Alerts**: Check budget progress and generate alerts at 80%, 90%, 100%.
     - **Goal Projection**: Calculate estimated completion date based on current contribution rate.
     - **Subscription Detection**: Identify recurring transactions (same merchant, similar amount, regular intervals) and flag unused subscriptions (60+ days inactive).
     - **Unusual Expense Detection**: Use z-score or IQR method to identify outliers (transactions >2 standard deviations from mean).
  6. **UI Components**:
     - Create insights widget for Dashboard (`src/features/insights/components/InsightsWidget.tsx`).
     - Build insights list page (`src/features/insights/pages/InsightsPage.tsx`) with filtering by type, priority, read/unread.
     - Integrate insights into Notification Center (show unread insights count).
     - Add "Mark as read" and "Dismiss" actions.
  7. **Tauri Commands**:
     - `listInsights(query: InsightQuery) -> Vec<InsightDto>`
     - `markInsightRead(id: String) -> Result<()>`
     - `dismissInsight(id: String) -> Result<()>`
     - `generateInsights(force: bool) -> Result<Vec<InsightDto>>` (manual trigger)
- **Tests to Implement**:
  - **Unit Tests**:
    - Rule evaluation logic for each rule type (period comparison, budget threshold, goal projection, subscription detection, unusual expense).
    - Statistical methods (z-score, IQR) for outlier detection.
    - Subscription pattern matching (merchant, amount, interval).
  - **Integration Tests**:
    - Scheduler triggers insight generation at scheduled time.
     - Insight generation completes in <150 ms for typical dataset.
     - Insights stored correctly in `insight_log` table.
     - `markInsightRead` and `dismissInsight` update database.
  - **Component Tests**:
    - Insights widget renders unread count.
    - Insights list filters by type and priority.
    - Mark as read/dismiss actions update UI.
  - **E2E Tests**:
    - Create transaction → wait for scheduler → insight appears in Dashboard.
    - Budget reaches 80% threshold → alert insight generated.
    - Goal contribution made → projection insight updated.
  - **Performance Tests**:
    - Insight evaluation <150 ms for 10,000 transactions.
    - Insight list rendering with 100+ insights < 200 ms.
- **Documentation Deliverables**:
  - `docs/architecture.md` Section 3.8 updates (insight engine architecture, rule system, scheduler integration).
  - New `docs/insights.md` (purpose, rule types, configuration, examples, testing instructions).
  - `docs/testing.md` "Smart Finance Insights" section (test matrix, rule evaluation scenarios, performance targets).
  - `src/features/insights/README.md` (purpose, API contract, rule development guide, usage examples).
  - `CHANGELOG.md` entry for A2 completion.
- **Exit Criteria**:
  - Insight generation occurs daily at 03:00 local time (or manually triggered).
  - No insight execution exceeds 150 ms.
  - Insights appear in Dashboard and Notification Center.
  - All rule types functional and tested.
  - Documentation updated with metadata + changelog.
- **Next Feature**: A3 Predictive Finance Engine.

### Feature A3 - Predictive Finance Engine (Status: Not Started)
- **Entry Criteria**: Feature A2 complete (insights stable). Transaction history contains sufficient data (≥60 days recommended). Dashboard operational.
- **Implementation Checklist**:
  1. **Database Schema**:
     - Create `forecast_cache` table: `id TEXT PRIMARY KEY`, `user_id TEXT`, `type TEXT`, `payload JSON`, `valid_until DATETIME`, `created_at DATETIME`.
     - Create migration: `prisma migrate dev --name add_forecast_cache`.
  2. **Forecast Service Architecture**:
     - Create module `src-tauri/src/services/predictions/mod.rs` with `PredictionService` trait.
     - Implement `SqlitePredictionService` with forecast algorithms.
     - Forecast types: `CashflowForecast`, `GoalCompletionForecast`, `BudgetOverrunForecast`, `MoneyOutForecast`.
  3. **Algorithm Implementation**:
     - **EMA Smoothing**: Implement Exponential Moving Average for trend smoothing (alpha = 0.3 recommended).
     - **Weighted Moving Averages**: Use weighted averages with recent data having higher weights.
     - **Seasonal Adjustment**: Apply heuristics for weekly/monthly patterns (e.g., higher spending on weekends, month-end spikes).
     - **Cashflow Forecast**: Project income and expenses for 30/60/90 days based on historical patterns.
     - **Goal Completion Prediction**: Calculate estimated completion date using current contribution rate and projected income.
     - **Budget Overrun Forecast**: Predict if budget will be exceeded before period end based on current burn rate.
     - **Money-Out Prediction**: Calculate days until account balance reaches zero (or threshold) based on average daily spending.
  4. **Cache System**:
     - Cache forecasts for 24 hours (or until new transactions added).
     - Invalidate cache on transaction create/update/delete events.
     - Store forecast results as JSON in `forecast_cache` table.
  5. **Tauri Commands**:
     - `getCashflowForecast(days: u32) -> Result<CashflowForecastDto>`
     - `getGoalCompletionForecast(goal_id: String) -> Result<GoalCompletionForecastDto>`
     - `getBudgetOverrunForecast(budget_id: String) -> Result<BudgetOverrunForecastDto>`
     - `getMoneyOutForecast(account_id: String) -> Result<MoneyOutForecastDto>`
     - `invalidateForecastCache(type: Option<String>) -> Result<()>`
  6. **UI Components**:
     - Create forecast widgets for Dashboard (`src/features/predictions/components/ForecastWidget.tsx`):
       - Cashflow chart (30/60/90 day projections).
       - Goal completion timeline.
       - Budget overrun warnings.
       - "Days until funds depleted" indicator.
     - Build detailed forecast page (`src/features/predictions/pages/ForecastPage.tsx`) with all forecast types and interactive charts (ECharts).
  7. **Performance Optimization**:
     - Use materialized views or pre-aggregated data for common queries.
     - Implement lazy loading for forecast widgets (load on demand).
     - Cache intermediate calculations (daily averages, trends) in memory.
- **Tests to Implement**:
  - **Unit Tests**:
    - EMA smoothing calculation accuracy.
    - Weighted moving average math.
    - Seasonal adjustment heuristics (weekly/monthly patterns).
    - Cashflow projection logic (income vs. expenses).
    - Goal completion date calculation.
    - Budget overrun prediction (burn rate analysis).
    - Money-out prediction (days until zero balance).
  - **Integration Tests**:
    - Forecast generation completes in <200 ms for 10,000 transactions.
    - Cache invalidation on transaction events.
    - Cache retrieval returns valid forecasts within TTL.
    - Forecast accuracy validation (compare predictions to actuals on test dataset).
  - **Component Tests**:
    - Forecast widgets render correctly with data.
    - Forecast page displays all forecast types.
    - Chart interactions (zoom, filter) work correctly.
  - **E2E Tests**:
    - Add transactions → forecast updates → cache invalidated → new forecast generated.
    - Goal contribution made → completion forecast recalculated.
    - Budget spending increases → overrun forecast shows warning.
  - **Performance Tests**:
    - Forecast generation <200 ms for 10,000 transactions (benchmark).
    - Forecast page load time <500 ms.
    - Cache hit rate >80% for repeated requests.
- **Documentation Deliverables**:
  - `docs/architecture.md` Section 3.9 updates (predictive engine architecture, algorithms, cache strategy).
  - New `docs/predictions.md` (purpose, algorithm details, forecast types, accuracy notes, testing instructions).
  - `docs/testing.md` "Predictive Finance Engine" section (test matrix, algorithm validation, performance targets).
  - `src/features/predictions/README.md` (purpose, API contract, algorithm parameters, usage examples).
  - `CHANGELOG.md` entry for A3 completion.
- **Exit Criteria**:
  - Forecast generation <200 ms for datasets up to 10,000 transactions.
  - Forecasts visible on Dashboard and Reports views.
  - Cache invalidates daily or when new transactions added.
  - All forecast types functional and tested.
  - Documentation updated with metadata + changelog.
- **Next Feature**: A4 OCR Receipt Scanner.

### Feature A4 - OCR Receipt Scanner (Status: Not Started)
- **Entry Criteria**: Feature A3 complete (predictions stable). Transaction creation flow operational. File upload capabilities available in Tauri.
- **Implementation Checklist**:
  1. **Database Schema**:
     - Create `receipt_scan` table: `id TEXT PRIMARY KEY`, `transaction_id TEXT NULL`, `image_path TEXT`, `extracted_data JSON`, `confidence_score REAL`, `status TEXT`, `created_at DATETIME`, `processed_at DATETIME`.
     - Create migration: `prisma migrate dev --name add_receipt_scan`.
     - Store receipt images in encrypted file bundle (`%APPDATA%/FinanceApp/storage/receipts/`).
  2. **OCR Engine Integration**:
     - Integrate Tesseract OCR via Rust bindings (`tesseract-rs` or `leptonica-rs`).
     - Install Tesseract runtime and language packs (English + local language if needed).
     - Configure Tesseract for receipt-specific OCR (single-column text, currency symbols, dates).
  3. **Image Processing Pipeline**:
     - Accept image upload (JPEG/PNG) via Tauri file dialog or drag-and-drop.
     - Pre-process images: grayscale conversion, contrast enhancement, noise reduction.
     - Crop receipt area if possible (edge detection).
     - Resize to optimal resolution for OCR (300 DPI recommended).
  4. **Data Extraction**:
     - Extract total amount using regex patterns (currency symbols, decimal separators).
     - Extract date using date parsing (multiple formats: MM/DD/YYYY, DD.MM.YYYY, etc.).
     - Extract merchant name (usually first line or near total).
     - Optionally extract line items (if receipt structure is clear and consistent).
  5. **Post-Processing**:
     - Validate extracted data (amount must be positive, date must be valid, merchant not empty).
     - Apply confidence scoring (Tesseract provides confidence per word/line).
     - Flag low-confidence extractions for manual review.
  6. **Manual Review Flow**:
     - Present extracted data in review modal before saving transaction.
     - Allow user to edit/correct extracted fields.
     - Show original receipt image alongside extracted data.
     - Save corrected data to `receipt_scan` table with `status = 'reviewed'`.
  7. **Tauri Commands**:
     - `scanReceipt(image_path: String) -> Result<ReceiptScanDto>`
     - `saveReceiptTransaction(scan_id: String, transaction_data: CreateTransactionInput) -> Result<TransactionDto>`
     - `listReceiptScans(query: ReceiptScanQuery) -> Result<Vec<ReceiptScanDto>>`
     - `deleteReceiptScan(id: String) -> Result<()>`
  8. **UI Components**:
     - Create receipt scanner page (`src/features/ocr/pages/ReceiptScannerPage.tsx`):
       - File upload area (drag-and-drop + file picker).
       - Receipt preview with extracted data overlay.
       - Manual review modal with editable fields.
       - Receipt history list.
     - Add "Scan Receipt" button to transaction form.
  9. **Security**:
     - Encrypt receipt images before storage (use SQLCipher or file-level encryption).
     - Never log extracted data containing sensitive information.
     - Implement image cleanup (delete old scans after 90 days or user deletion).
- **Tests to Implement**:
  - **Unit Tests**:
    - Regex patterns for currency extraction (various formats: $, €, £, etc.).
    - Date parsing (multiple formats and locales).
    - Merchant name extraction (first line, near total).
    - Confidence scoring calculation.
    - Image pre-processing functions (grayscale, contrast, resize).
  - **Integration Tests**:
    - OCR pipeline processes image and extracts data.
    - Extracted data validation (amount, date, merchant).
    - Receipt scan saved to database with correct status.
    - Transaction creation from receipt scan.
  - **Component Tests**:
    - File upload component accepts JPEG/PNG.
    - Receipt preview displays image and extracted data.
    - Manual review modal allows editing fields.
  - **E2E Tests**:
    - Upload receipt image → OCR processes → extracted data shown → user reviews → transaction created.
    - Low-confidence extraction → flagged for review → user corrects → transaction saved.
  - **Accuracy Benchmark**:
    - Test with benchmark dataset of 100+ sample receipts.
    - Target: ≥85% accuracy for total amount extraction.
    - Target: ≥80% accuracy for date extraction.
    - Target: ≥75% accuracy for merchant name extraction.
  - **Performance Tests**:
    - OCR processing <5 seconds per receipt image.
    - Image encryption/decryption <500 ms.
- **Documentation Deliverables**:
  - `docs/architecture.md` Section 3.10 updates (OCR engine architecture, image processing pipeline, security).
  - New `docs/ocr.md` (purpose, OCR setup instructions, supported formats, accuracy notes, troubleshooting).
  - `docs/testing.md` "OCR Receipt Scanner" section (test matrix, benchmark dataset, accuracy targets).
  - `src/features/ocr/README.md` (purpose, API contract, OCR configuration, usage examples, troubleshooting).
  - `CHANGELOG.md` entry for A4 completion.
- **Exit Criteria**:
  - ≥85% accuracy for total amount extraction (benchmark dataset).
  - Manual review modal presented before saving transaction.
  - All receipt images encrypted before storage.
  - OCR processing <5 seconds per image.
  - Documentation updated with metadata + changelog.
- **Next Feature**: A5 Financial Scenario Simulator.

### Feature A5 - Financial Scenario Simulator (Status: Not Started)
- **Entry Criteria**: Feature A4 complete (OCR stable). Budget and goal systems operational. Forecast engine (A3) available for baseline comparisons.
- **Implementation Checklist**:
  1. **Database Schema**:
     - Create `scenario` table: `id TEXT PRIMARY KEY`, `name TEXT`, `description TEXT`, `baseline_snapshot JSON`, `modifications JSON`, `results JSON`, `created_at DATETIME`, `updated_at DATETIME`.
     - Create migration: `prisma migrate dev --name add_scenario`.
  2. **Scenario Engine Architecture**:
     - Create module `src-tauri/src/services/scenarios/mod.rs` with `ScenarioService` trait.
     - Implement `SqliteScenarioService` with scenario calculation logic.
     - Scenario modifications include: budget limits, recurring expenses, savings contributions, expected income changes.
  3. **Baseline Snapshot**:
     - Capture current financial state: account balances, active budgets, goals, recurring transactions, average spending by category.
     - Store snapshot as JSON in `scenario.baseline_snapshot`.
  4. **Scenario Calculation**:
     - Apply modifications to baseline snapshot (virtual changes, not persisted to actual data).
     - Compute adjusted cashflow using forecast engine (A3) with modified parameters.
     - Calculate adjusted goal timelines based on modified savings contributions.
     - Perform budget risk analysis (which budgets would be at risk with modified limits).
     - Generate comparison delta vs. current baseline (percentage changes, absolute differences).
  5. **Tauri Commands**:
     - `createScenario(input: CreateScenarioInput) -> Result<ScenarioDto>`
     - `updateScenario(id: String, modifications: ScenarioModifications) -> Result<ScenarioDto>`
     - `calculateScenario(id: String) -> Result<ScenarioResultsDto>`
     - `listScenarios(query: ScenarioQuery) -> Result<Vec<ScenarioDto>>`
     - `deleteScenario(id: String) -> Result<()>`
     - `compareScenarios(scenario_id: String, baseline_id: Option<String>) -> Result<ScenarioComparisonDto>`
  6. **UI Components**:
     - Create scenario simulator page (`src/features/scenarios/pages/ScenarioSimulatorPage.tsx`):
       - Scenario list with saved scenarios.
       - Scenario creation form with modification controls:
         - Budget limit sliders/inputs.
         - Recurring expense add/edit/remove.
         - Savings contribution adjustments.
         - Income change inputs.
       - Scenario results view with:
         - Adjusted cashflow chart (vs. baseline).
         - Goal timeline comparison.
         - Budget risk indicators.
         - Delta comparison table (current vs. scenario).
       - "Apply Scenario" button (optional: apply modifications to actual data).
  7. **Performance Optimization**:
     - Cache scenario calculations (recalculate only when modifications change).
     - Use forecast engine cache for baseline projections.
     - Lazy load scenario results (calculate on demand).
- **Tests to Implement**:
  - **Unit Tests**:
    - Baseline snapshot capture (accounts, budgets, goals, transactions).
    - Scenario modification application (budget limits, expenses, contributions, income).
    - Adjusted cashflow calculation (using modified parameters).
    - Goal timeline adjustment (based on contribution changes).
    - Budget risk analysis (identify at-risk budgets).
    - Comparison delta calculation (percentage and absolute differences).
  - **Integration Tests**:
     - Scenario creation saves baseline snapshot correctly.
     - Scenario calculation completes in <300 ms.
     - Scenario results include all required metrics (cashflow, goals, budgets).
     - Scenario comparison shows correct deltas.
  - **Component Tests**:
     - Scenario form renders modification controls.
     - Scenario results view displays charts and comparisons.
     - Scenario list shows saved scenarios.
  - **E2E Tests**:
     - Create scenario → modify budget limits → calculate → results show adjusted cashflow.
     - Create scenario → change savings contribution → calculate → goal timeline updates.
     - Compare two scenarios → delta table shows differences.
  - **Performance Tests**:
     - Scenario calculation <300 ms for 30-day projection.
     - Scenario page load time <1 second.
- **Documentation Deliverables**:
  - `docs/architecture.md` Section 3.11 updates (scenario engine architecture, baseline snapshots, calculation logic).
  - New `docs/scenarios.md` (purpose, scenario types, modification options, calculation details, usage examples).
  - `docs/testing.md` "Financial Scenario Simulator" section (test matrix, calculation validation, performance targets).
  - `src/features/scenarios/README.md` (purpose, API contract, scenario creation guide, usage examples).
  - `CHANGELOG.md` entry for A5 completion.
- **Exit Criteria**:
  - Scenario results calculated in <300 ms for 30-day projections.
  - Users can save scenarios for later review.
  - Comparison delta vs. baseline accurate and displayed correctly.
  - All scenario types functional and tested.
  - Documentation updated with metadata + changelog.
- **Next Feature**: A6 Monthly Planner System.

### Feature A6 - Monthly Planner System (Status: Not Started)
- **Entry Criteria**: Feature A5 complete (scenarios stable). Budget and goal systems operational. Transaction history available.
- **Implementation Checklist**:
  1. **Database Schema**:
     - Create `monthly_plan` table: `id TEXT PRIMARY KEY`, `month DATE`, `priorities JSON`, `targets JSON`, `result JSON NULL`, `created_at DATETIME`, `updated_at DATETIME`, `completed_at DATETIME NULL`.
     - Create migration: `prisma migrate dev --name add_monthly_plan`.
     - `priorities` JSON structure: `{ "goals": [...], "expense_limits": {...}, "notes": "..." }`
     - `targets` JSON structure: `{ "savings_target": number, "spending_limit": number, "category_limits": {...} }`
     - `result` JSON structure: `{ "actual_savings": number, "actual_spending": number, "goals_achieved": [...], "summary": "..." }`
  2. **Monthly Plan Service**:
     - Create module `src-tauri/src/services/planner/mod.rs` with `PlannerService` trait.
     - Implement `SqlitePlannerService` with plan creation, update, and summary generation.
  3. **Auto-Generation Logic**:
     - Scheduler triggers plan creation on the first day of each month (or user can create manually).
     - Pre-fill plan with:
       - Active goals for the month.
       - Budget limits from active budgets.
       - Previous month's spending patterns (as suggestions).
  4. **Plan Management**:
     - Users can set monthly priorities (goals, expense limitations, notes).
     - Users can define targets (savings target, spending limit, category limits).
     - Plans are editable throughout the month.
  5. **End-of-Month Summary**:
     - Scheduler triggers summary generation in the first 48 hours of the next month.
     - Calculate actual vs. target comparisons:
       - Actual savings vs. target savings.
       - Actual spending vs. spending limit.
       - Goals achieved vs. planned goals.
       - Category spending vs. category limits.
     - Generate summary text with insights and recommendations.
  6. **Tauri Commands**:
     - `createMonthlyPlan(month: String, input: CreatePlanInput) -> Result<MonthlyPlanDto>`
     - `updateMonthlyPlan(id: String, updates: UpdatePlanInput) -> Result<MonthlyPlanDto>`
     - `getMonthlyPlan(month: String) -> Result<Option<MonthlyPlanDto>>`
     - `listMonthlyPlans(query: PlanQuery) -> Result<Vec<MonthlyPlanDto>>`
     - `generatePlanSummary(plan_id: String) -> Result<PlanSummaryDto>`
  7. **UI Components**:
     - Create monthly planner page (`src/features/planner/pages/MonthlyPlannerPage.tsx`):
       - Current month plan view with priorities and targets.
       - Plan creation/editing form.
       - Progress indicators (savings progress, spending progress, goals progress).
       - Previous month summaries (retrospective view).
       - Plan comparison (current vs. previous months).
  8. **Dashboard Integration**:
     - Add monthly plan widget to Dashboard showing:
       - Current month priorities.
       - Progress toward targets.
       - Days remaining in month.
- **Tests to Implement**:
   - **Unit Tests**:
     - Month calculation and date range logic.
     - Plan auto-generation (pre-fill logic).
     - Summary calculation (actual vs. target comparisons).
     - Priority and target JSON serialization/deserialization.
   - **Integration Tests**:
     - Scheduler creates plan on first day of month.
     - Plan creation saves priorities and targets correctly.
     - Summary generation calculates actuals from transactions.
     - Summary generation completes within 48 hours of month start.
   - **Component Tests**:
     - Plan form renders priorities and targets inputs.
     - Progress indicators update based on actual data.
     - Summary view displays comparisons correctly.
   - **E2E Tests**:
     - Create monthly plan → set priorities and targets → plan saved.
     - Month progresses → progress indicators update → end of month → summary generated.
     - View previous month summary → retrospective analysis displayed.
   - **Performance Tests**:
     - Plan creation <200 ms.
     - Summary generation <500 ms for typical month.
- **Documentation Deliverables**:
  - `docs/architecture.md` Section 3.12 updates (monthly planner architecture, auto-generation, summary logic).
  - New `docs/planner.md` (purpose, plan structure, auto-generation details, summary format, usage examples).
  - `docs/testing.md` "Monthly Planner System" section (test matrix, plan creation scenarios, summary validation).
  - `src/features/planner/README.md` (purpose, API contract, plan creation guide, usage examples).
  - `CHANGELOG.md` entry for A6 completion.
- **Exit Criteria**:
  - New plan generated automatically at month start (or manually).
  - Summary generated in the first 48 hours of next month.
  - Plans editable throughout the month.
  - Progress indicators update in real-time.
  - Documentation updated with metadata + changelog.
- **Next Feature**: A7 Gamification Layer.

### Feature A7 - Gamification Layer (Status: Not Started)
- **Entry Criteria**: Feature A6 complete (planner stable). Transaction, budget, and goal systems operational. Notification system available.
- **Implementation Checklist**:
  1. **Database Schema**:
     - Create `achievement` table: `id TEXT PRIMARY KEY`, `code TEXT UNIQUE`, `name TEXT`, `description TEXT`, `icon TEXT`, `category TEXT`, `criteria JSON`, `points INTEGER DEFAULT 0`.
     - Create `achievement_log` table: `id TEXT PRIMARY KEY`, `user_id TEXT`, `achievement_id TEXT`, `unlocked_at DATETIME`, `metadata JSON`.
     - Create `streak_state` table: `id TEXT PRIMARY KEY`, `user_id TEXT`, `type TEXT`, `current_streak INTEGER DEFAULT 0`, `longest_streak INTEGER DEFAULT 0`, `last_activity_date DATE`, `metadata JSON`.
     - Create migrations: `prisma migrate dev --name add_gamification_tables`.
  2. **Achievement System**:
     - Create module `src-tauri/src/services/gamification/mod.rs` with `GamificationService` trait.
     - Implement `SqliteGamificationService` with achievement evaluation and streak tracking.
     - Define ≥10 achievements at launch:
       - "First Transaction" (create first transaction)
       - "Savings Starter" (save $100)
       - "Budget Master" (stay within budget for a week)
       - "Goal Achiever" (complete a goal)
       - "No Impulse Spending" (no overspending for 7 days)
       - "Transaction Streak" (log transactions for 30 consecutive days)
       - "Category Explorer" (use 10 different categories)
       - "Monthly Planner" (create and complete a monthly plan)
       - "Receipt Scanner" (scan 10 receipts)
       - "Insight Reader" (read 50 insights)
  3. **Achievement Evaluation**:
     - Event-driven: achievements evaluated on relevant events (transaction created, goal achieved, budget updated, etc.).
     - Criteria evaluation: each achievement has JSON criteria (e.g., `{ "type": "total_saved", "threshold": 10000 }`).
     - Unlock logic: check criteria on event, unlock if met, log to `achievement_log`.
  4. **Streak Tracking**:
     - Track streaks for: transaction logging, budget compliance, goal contributions.
     - Update `streak_state` on relevant activities:
     - Increment `current_streak` if activity on consecutive days.
     - Reset `current_streak` if gap detected.
     - Update `longest_streak` if `current_streak` exceeds it.
  5. **Badge System**:
     - Visual badges for achievements (SVG icons).
     - Progress badges for streaks (show current streak count).
     - Badge display in profile/settings page.
  6. **Tauri Commands**:
     - `listAchievements(query: AchievementQuery) -> Result<Vec<AchievementDto>>`
     - `getUserAchievements(user_id: String) -> Result<Vec<AchievementLogDto>>`
     - `getStreakState(user_id: String, type: String) -> Result<StreakStateDto>`
     - `evaluateAchievements(user_id: String, event_type: String) -> Result<Vec<AchievementDto>>` (manual trigger)
  7. **UI Components**:
     - Create gamification page (`src/features/gamification/pages/GamificationPage.tsx`):
       - Achievement list (locked/unlocked with progress indicators).
       - Streak display (current and longest streaks).
       - Badge gallery.
       - Leaderboard (optional: if multi-user support added later).
     - Add achievement notifications (toast when achievement unlocked).
     - Add streak indicators to Dashboard.
  8. **Event Integration**:
     - Hook into existing events: `transaction:created`, `goal:achieved`, `budget:updated`, etc.
     - Evaluate achievements on event emission.
     - Update streaks on daily activity checks (scheduler).
- **Tests to Implement**:
  - **Unit Tests**:
    - Achievement criteria evaluation logic (threshold checks, counting logic).
    - Streak calculation (consecutive days, gap detection, reset logic).
    - Achievement unlock detection (prevent duplicate unlocks).
    - Badge icon rendering.
  - **Integration Tests**:
    - Achievement unlocked on event (transaction created → "First Transaction" unlocked).
    - Streak increments on consecutive activities.
    - Streak resets on gap detection.
    - Achievement log entries created correctly.
  - **Component Tests**:
    - Achievement list renders locked/unlocked states.
    - Streak display shows current and longest streaks.
    - Achievement notification toast appears on unlock.
  - **E2E Tests**:
    - Create transaction → "First Transaction" achievement unlocked → notification shown.
    - Save $100 → "Savings Starter" achievement unlocked.
    - Log transactions for 30 days → "Transaction Streak" achievement unlocked → streak counter shows 30.
    - Miss a day → streak resets → counter shows 0.
  - **Edge Case Tests**:
    - Achievement already unlocked (prevent duplicate).
    - Streak calculation across month boundaries.
    - Multiple achievements unlocked simultaneously.
- **Documentation Deliverables**:
  - `docs/architecture.md` Section 3.13 updates (gamification architecture, achievement system, streak tracking).
  - New `docs/gamification.md` (purpose, achievement list, streak types, event integration, usage examples).
  - `docs/testing.md` "Gamification Layer" section (test matrix, achievement scenarios, streak edge cases).
  - `src/features/gamification/README.md` (purpose, API contract, achievement development guide, usage examples).
  - `CHANGELOG.md` entry for A7 completion.
- **Exit Criteria**:
  - ≥10 achievements implemented and functional at launch.
  - Streak logic fully tested (edge cases included).
  - Achievements unlock on relevant events.
  - Streaks track correctly across day/month boundaries.
  - Badge display and notifications working.
  - Documentation updated with metadata + changelog.
- **Next Feature**: None (all advanced features complete).

## 4. Cross-Feature Considerations

### 4.1 Performance Optimization
- All advanced features must meet performance targets specified in Section 1 (Guiding Principles).
- Implement caching strategies where appropriate (forecasts, insights, scenarios).
- Use database indexes for frequently queried fields (category hierarchies, insight types, scenario IDs).
- Lazy load UI components and data where possible.

### 4.2 Security & Privacy
- All user data (OCR images, scenario snapshots, insight logs) encrypted at rest.
- No sensitive data in logs or error messages.
- Validate all inputs via Zod schemas before processing.
- Implement data retention policies (e.g., delete old receipt scans after 90 days).

### 4.3 Testing Strategy
- Each feature must include unit, integration, component, e2e, and performance tests.
- Maintain test coverage ≥80% for all new code.
- Include edge case testing (empty data, large datasets, concurrent operations).
- Performance benchmarks must be documented and tracked.

### 4.4 Documentation Requirements
- Each feature requires updates to `docs/architecture.md` (relevant sections).
- Each feature requires a dedicated documentation file (e.g., `docs/insights.md`, `docs/ocr.md`).
- Each feature requires a feature-specific README (e.g., `src/features/insights/README.md`).
- All documentation must include metadata, purpose, usage examples, and testing instructions.

### 4.5 Integration with Core Platform
- All advanced features must integrate seamlessly with existing core services (TransactionService, BudgetService, GoalService, etc.).
- Use existing event system for cross-feature communication (e.g., insights triggered by transaction events).
- Follow established patterns for Tauri commands, React hooks, and UI components.
- Maintain backward compatibility with core platform APIs.

## 5. Versioning and Governance

### 5.1 Release Cycles
- **v2.x**: Implementation phase (advanced features development)
- **v3.x**: Public stable release (all advanced features complete and tested)
- **v4.x+**: Future enhancements and optimizations

### 5.2 Approval Process
- Approval from product owner required before commencing each feature stage.
- Technical review required for architecture changes (new services, database schema modifications).
- QA sign-off required before feature completion (all tests green, documentation complete).

### 5.3 Status Tracking
- Update status markers in this document at the start and end of each feature implementation.
- Link all tickets/PRs to relevant feature stages.
- Maintain changelog entries for each feature completion.

## 6. Dependencies and Prerequisites

### 6.1 External Dependencies
- **Tesseract OCR**: Required for Feature A4. Must be installed on user's system or bundled with application.
- **Language Packs**: English + local language packs for OCR (Feature A4).
- **Tauri Plugins**: May require additional Tauri plugins for file handling, image processing (Feature A4).

### 6.2 Internal Dependencies
- All advanced features depend on core platform (Stages S0-S11) being complete and stable.
- Feature A2 (Insights) depends on Feature A1 (Categories) for category-based analysis.
- Feature A3 (Predictions) depends on Feature A2 (Insights) for data validation.
- Feature A5 (Scenarios) depends on Feature A3 (Predictions) for baseline comparisons.
- Feature A6 (Planner) depends on Feature A5 (Scenarios) for planning tools.
- Feature A7 (Gamification) depends on all previous features for achievement triggers.

## 7. Risk Mitigation

### 7.1 Technical Risks
- **OCR Accuracy**: Mitigate with manual review flow and confidence scoring (Feature A4).
- **Forecast Accuracy**: Mitigate with clear disclaimers and confidence intervals (Feature A3).
- **Performance Degradation**: Mitigate with caching, lazy loading, and performance benchmarks.
- **Database Bloat**: Mitigate with data retention policies and cleanup jobs.

### 7.2 User Experience Risks
- **Feature Complexity**: Mitigate with clear UI/UX, tooltips, and documentation.
- **Overwhelming Notifications**: Mitigate with user preferences and notification filtering.
- **Data Privacy Concerns**: Mitigate with encryption, local-first architecture, and clear privacy policy.

---

This plan serves as the authoritative guide for implementing advanced features. Update it at the beginning and end of each feature implementation so the team always knows what is done, what is next, and how to prove completeness.

