# Reminders Feature

## Purpose
Manages payment reminders, scheduled notifications, and recurring alerts with RRULE support, snooze functionality, and audit logging.

## Detailed Description
The Reminders feature provides a comprehensive reminder management system that supports:
- **Payment Reminders**: Track upcoming bills and payments with due dates
- **Recurring Reminders**: Support for daily, weekly, and monthly recurrence patterns (RRULE)
- **Status Management**: Scheduled, Sent, Snoozed, Dismissed
- **Multiple Channels**: Toast notifications, in-app notifications, email (future)
- **Snooze Functionality**: Postpone reminders with configurable snooze duration
- **Audit Logging**: Track all reminder actions (created, sent, snoozed, dismissed)
- **Notification Center**: In-app drawer showing due reminders with quick actions

## How to Use

### Creating a Reminder
1. Navigate to the Reminders page from the main navigation
2. Click "New Reminder" button
3. Fill in the form:
   - Title: Brief description (e.g., "Pay Credit Card")
   - Description: Optional detailed notes
   - Account: Optional - link to an account
   - Amount: Optional payment amount
   - Due Date: When the reminder should fire
   - Recurrence Rule: Optional - DAILY, WEEKLY, MONTHLY, or full RRULE format
   - Channel: Toast, In-App, or Email (default: Toast)
   - Snooze Minutes: Default snooze duration (optional)

### Viewing Reminders
- Reminders are displayed in sections by status:
  - **Scheduled**: Upcoming reminders
  - **Snoozed**: Postponed reminders
  - **Sent**: Recently triggered reminders
  - **Dismissed**: Completed/cancelled reminders
- Each card shows:
  - Title and description
  - Account name (if linked)
  - Amount (if specified)
  - Due date or next fire time
  - Status badge
  - Overdue indicator (red border for past due)

### Managing Reminders
- **Snooze**: Click "Snooze" to postpone by default duration (15 minutes)
- **Dismiss**: Click "Dismiss" to mark as dismissed
- **Edit**: Click on a reminder card to edit details
- **Delete**: Use the delete button (with confirmation)

### Notification Center
- Access via the bell icon in the header or `Ctrl+Shift+N`
- Shows all due reminders (where `next_fire_at <= now`)
- Quick actions: Snooze or Mark as Sent
- Auto-refreshes every minute

## State Diagram
```
Reminder Lifecycle:
  Created (Scheduled) → [next_fire_at calculated]
    ↓
  [Scheduled] → [Due] → [Sent] (when notification fires)
    ↓
  [Scheduled/Sent] → [Snoozed] (when snoozed)
    ↓
  [Snoozed] → [Scheduled] (when next_fire_at reached)
    ↓
  [Any Status] → [Dismissed]
```

## API Contract

### Tauri Commands
- `list_reminders()`: Returns all reminders for the current user
- `get_reminder(id)`: Returns a specific reminder by ID
- `create_reminder(payload)`: Creates a new reminder
- `update_reminder(payload)`: Updates an existing reminder
- `delete_reminder(id)`: Deletes a reminder
- `snooze_reminder(payload)`: Snoozes a reminder (updates next_fire_at)
- `get_due_reminders()`: Returns reminders where next_fire_at <= now
- `mark_reminder_sent(id)`: Marks a reminder as sent and logs the action

### React Hooks
- `useRemindersQuery()`: Fetches all reminders (React Query)
- `useReminderQuery(id)`: Fetches a specific reminder
- `useDueRemindersQuery()`: Fetches due reminders (auto-refreshes every minute)
- `useCreateReminderMutation()`: Creates a new reminder
- `useUpdateReminderMutation()`: Updates a reminder
- `useDeleteReminderMutation()`: Deletes a reminder
- `useSnoozeReminderMutation()`: Snoozes a reminder
- `useMarkReminderSentMutation()`: Marks a reminder as sent

## RRULE Support

Currently supports simplified recurrence patterns:
- `DAILY` or `FREQ=DAILY`: Repeats every day
- `WEEKLY` or `FREQ=WEEKLY`: Repeats every week
- `MONTHLY` or `FREQ=MONTHLY`: Repeats every month (approximated as 30 days)

Full RRULE parsing (e.g., `FREQ=MONTHLY;BYMONTHDAY=15`) is planned for future enhancement.

## Tests

### Unit Tests
- `tests/unit/reminders/utils.test.ts`: Tests for date formatting, overdue detection, and status colors

### Integration Tests
- Reminder CRUD operations via Tauri commands
- Snooze logic and next_fire_at calculation
- Recurrence rule parsing and next occurrence calculation
- Due reminders query filtering

### Component Tests
- ReminderCard rendering with different statuses
- ReminderForm validation and submission
- RemindersPage status filtering
- NotificationCenter due reminders display

## Implementation Details

### Backend (Rust)
- `SqliteReminderService`: Implements `ReminderService` trait
- Calculates `next_fire_at` based on `due_at` and recurrence rules
- Supports simple RRULE patterns (DAILY, WEEKLY, MONTHLY)
- Logs all actions to `ReminderLog` table for audit trail
- Updates `last_triggered_at` when reminders are sent

### Frontend (React)
- `RemindersPage`: Main page with status-filtered sections
- `ReminderCard`: Individual reminder card with actions
- `ReminderForm`: Create/edit form with validation
- `NotificationCenter`: Drawer showing due reminders
- Uses React Query for data fetching with auto-refresh for due reminders
- Keyboard shortcut: `Ctrl+Shift+N` to open notification center

## Limitations
- Full RRULE parsing not yet implemented (only simple patterns)
- Windows toast notifications not yet integrated (UI ready)
- Email channel not yet implemented (database schema supports it)
- Scheduler worker not yet implemented (manual polling via React Query)

## Future Enhancements
- Full RRULE parsing library integration
- Background scheduler worker (Rust or TypeScript)
- Windows toast plugin integration with Pay/Snooze/Open actions
- Email notifications via SMTP
- Reminder templates for common bills
- Retention policies for old reminders

## Version
1.0.0 - Initial implementation (Stage 6)
