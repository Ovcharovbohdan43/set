# Budgets Feature

## Purpose
Manages envelope and overall budgets, tracks spending against targets, computes burn rates, and triggers alerts when thresholds are exceeded.

## Detailed Description
The Budgets feature provides a comprehensive budget management system that supports:
- **Envelope Budgets**: Category-specific budgets (e.g., "Groceries - $600/month")
- **Overall Budgets**: Total spending limits across all categories
- **Period-based Tracking**: Weekly, monthly, quarterly, or yearly budgets
- **Progress Visualization**: Circular progress rings showing spending percentage
- **Status Indicators**: Normal (green), At Risk (yellow), Over Budget (red)
- **Rollover Support**: Optional carryover of unused budget to next period
- **Alert Thresholds**: Configurable warning levels (default 80%)

## How to Use

### Creating a Budget
1. Navigate to the Budgets page from the main navigation
2. Click "New Budget" button
3. Fill in the form:
   - Name: Descriptive name (e.g., "Groceries - Monthly")
   - Period: Weekly, Monthly, Quarterly, or Yearly
   - Type: Envelope (category-specific) or Overall (total spending)
   - Category: Optional - select an expense category for envelope budgets
   - Amount: Budget target in your default currency
   - Start/End Date: Budget period boundaries
   - Rollover: Enable to carry unused budget forward
   - Alert Threshold: Percentage at which to show warning (0-100%)

### Viewing Budgets
- Budgets are displayed in a responsive grid
- Each card shows:
  - Budget name and category (if applicable)
  - Spent amount vs. total budget
  - Progress percentage with color-coded ring
  - Remaining amount
  - Status indicator (Normal/At Risk/Over)

### Editing/Deleting Budgets
- Hover over a budget card to reveal Edit/Delete buttons
- Edit: Opens the form with current values pre-filled
- Delete: Removes the budget (with confirmation)

## State Diagram
```
Budget Lifecycle:
  Created → Active → (Spending tracked) → Status Updated
    ↓
  [Normal] → [At Risk] → [Over Budget]
    ↓
  Period End → (Rollover?) → Next Period / Reset
```

## API Contract

### Tauri Commands
- `list_budgets()`: Returns all budgets for the current user
- `get_budget(id)`: Returns a specific budget by ID
- `create_budget(payload)`: Creates a new budget
- `update_budget(payload)`: Updates an existing budget
- `delete_budget(id)`: Deletes a budget
- `record_snapshot(payload)`: Records a budget snapshot entry

### React Hooks
- `useBudgetsQuery()`: Fetches all budgets (React Query)
- `useBudgetQuery(id)`: Fetches a specific budget
- `useCreateBudgetMutation()`: Creates a new budget
- `useUpdateBudgetMutation()`: Updates a budget
- `useDeleteBudgetMutation()`: Deletes a budget
- `useRecordSnapshotMutation()`: Records a snapshot

## Tests

### Unit Tests
- `tests/unit/budgets/utils.test.ts`: Tests for progress calculation and status color helpers

### Integration Tests
- Budget CRUD operations via Tauri commands
- Budget progress calculation with transaction spending
- Status transitions (Normal → At Risk → Over)

### Component Tests
- BudgetCard rendering with different statuses
- BudgetForm validation and submission
- BudgetsPage grid layout and interactions

## Implementation Details

### Backend (Rust)
- `SqliteBudgetService`: Implements `BudgetService` trait
- Calculates spent amounts from transactions matching budget category and period
- Computes progress percentage and status based on alert threshold
- Supports rollover logic (future enhancement)

### Frontend (React)
- `BudgetsPage`: Main page component with grid layout
- `BudgetCard`: Individual budget card with progress ring
- `BudgetForm`: Create/edit form with validation
- Uses React Query for data fetching and cache management
- Emits `transaction:changed` events to trigger dashboard updates

## Limitations
- Rollover logic is stored but not yet automatically applied
- Snapshot recording is manual (future: automated daily snapshots)
- Budget alerts are visual only (future: notifications)

## Version
1.0.0 - Initial implementation (Stage 4)
