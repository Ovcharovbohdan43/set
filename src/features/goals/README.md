# Goals Feature

## Purpose
Manages savings goals, tracks progress toward targets, computes projections, and supports milestone tracking with status transitions.

## Detailed Description
The Goals feature provides a comprehensive goal management system that supports:
- **Savings Goals**: Track progress toward financial targets (e.g., "Emergency Fund - $5,000")
- **Status Management**: Active, Paused, Achieved, Abandoned
- **Progress Tracking**: Automatic calculation based on linked transactions
- **Projections**: Estimated completion dates based on current spending rate
- **Priority System**: Sort goals by importance
- **Category Linking**: Optional association with expense categories
- **Kanban Board**: Visual organization by status columns

## How to Use

### Creating a Goal
1. Navigate to the Goals page from the main navigation
2. Click "New Goal" button
3. Fill in the form:
   - Name: Descriptive name (e.g., "Emergency Fund")
   - Target Amount: Goal target in your default currency
   - Target Date: Optional deadline
   - Category: Optional - link to a category
   - Priority: Higher numbers appear first (default: 0)
   - Status: Active, Paused, Achieved, or Abandoned

### Viewing Goals
- Goals are displayed in a Kanban board with 4 columns:
  - **Active**: Goals currently being worked toward
  - **Paused**: Temporarily on hold
  - **Achieved**: Successfully completed
  - **Abandoned**: No longer pursuing
- Each card shows:
  - Goal name and category (if applicable)
  - Current amount vs. target amount
  - Progress bar with percentage
  - Remaining amount
  - Days remaining (if target date set)

### Editing/Deleting Goals
- Click on a goal card to edit
- Use the status dropdown to change status
- Delete button removes the goal (with confirmation)

### Adding Contributions
- Contributions are automatically tracked via transactions linked to the goal
- When a transaction with `goal_id` is created, the goal's `current_cents` is updated
- Goals automatically transition to "Achieved" status when target is reached

## State Diagram
```
Goal Lifecycle:
  Created (Active) → [Progress tracked via transactions]
    ↓
  [Active] → [Paused] → [Active]
    ↓
  [Active] → [Achieved] (when target reached)
    ↓
  [Any Status] → [Abandoned]
```

## API Contract

### Tauri Commands
- `list_goals()`: Returns all goals for the current user, sorted by priority
- `get_goal(id)`: Returns a specific goal by ID
- `create_goal(payload)`: Creates a new goal
- `update_goal(payload)`: Updates an existing goal
- `update_goal_status(payload)`: Updates only the status
- `add_contribution(payload)`: Manually adds a contribution (updates current_cents)
- `delete_goal(id)`: Deletes a goal

### React Hooks
- `useGoalsQuery()`: Fetches all goals (React Query)
- `useGoalQuery(id)`: Fetches a specific goal
- `useCreateGoalMutation()`: Creates a new goal
- `useUpdateGoalMutation()`: Updates a goal
- `useUpdateGoalStatusMutation()`: Updates goal status
- `useAddContributionMutation()`: Adds a manual contribution
- `useDeleteGoalMutation()`: Deletes a goal

## Tests

### Unit Tests
- `tests/unit/goals/utils.test.ts`: Tests for days formatting and status color helpers

### Integration Tests
- Goal CRUD operations via Tauri commands
- Progress calculation with transaction contributions
- Status transitions and auto-achievement when target reached
- Projection calculations with target dates

### Component Tests
- GoalCard rendering with different statuses
- GoalForm validation and submission
- GoalsPage Kanban board layout and status changes

## Implementation Details

### Backend (Rust)
- `SqliteGoalService`: Implements `GoalService` trait
- Calculates current amount from transactions with matching `goal_id`
- Computes progress percentage and projections based on target date
- Auto-achieves goals when `current_cents >= target_cents`

### Frontend (React)
- `GoalsPage`: Main page component with Kanban board layout
- `GoalCard`: Individual goal card with progress bar
- `GoalForm`: Create/edit form with validation
- Uses React Query for data fetching and cache management
- Emits `transaction:changed` events to trigger dashboard updates

## Limitations
- Projections are calculated based on current spending rate, not historical averages
- Milestone notifications are visual only (future: toast notifications)
- Drag-and-drop reordering not yet implemented (future enhancement)

## Version
1.0.0 - Initial implementation (Stage 5)
