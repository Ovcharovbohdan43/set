# Notification System Documentation

## Document Metadata
- **Purpose**: Comprehensive guide to the reminder notification system, including scheduler design, Windows toast integration, in-app notification center, and testing procedures.
- **Detailed Description**: Documents the complete notification flow from reminder creation to user interaction, covering background scheduler, Windows toast notifications with actionable buttons, in-app notification center, RRULE parsing, and audit logging.
- **How to Use**: Reference this document when implementing notification features, debugging scheduler issues, or adding new notification channels. Follow the testing instructions to verify notification functionality.
- **Examples**: See Section 3 for RRULE examples, Section 4 for toast action handlers, and Section 6 for test scenarios.
- **How to Test**: Follow Section 6 for unit, integration, and e2e test procedures. Use the provided commands to verify scheduler polling, toast delivery, and action handling.
- **Limitations**: Windows toast actions require Windows 10+ and proper app manifest configuration. Email channel is planned for future enhancement. Full RRULE parsing (RFC 5545) is currently simplified to DAILY/WEEKLY/MONTHLY patterns.
- **Modules Impacted**: `src-tauri/src/services/reminders/`, `src-tauri/src/scheduler/`, `src/features/reminders/`, `src-tauri/src/commands/reminders.rs`, notification plugins.
- **Version**: 1.0.0
- **Last Updated**: 2025-11-21

## Changelog
- [2025-11-21] - Added: Initial notification system documentation covering scheduler, Windows toast, in-app center, RRULE examples, and testing procedures.

---

## 1. Overview

The notification system provides a multi-channel approach to remind users about upcoming payments and financial obligations:

1. **Background Scheduler**: Polls the `reminder` table every minute to identify due reminders
2. **Windows Toast Notifications**: Native system notifications with actionable buttons (Pay, Snooze, Open)
3. **In-App Notification Center**: Drawer interface showing due reminders with quick actions
4. **Audit Logging**: All notification actions are logged to `ReminderLog` for tracking

### Architecture Flow

```
Reminder Created
    ↓
next_fire_at calculated (based on due_at + recurrence_rule)
    ↓
[Scheduler polls every minute]
    ↓
Due Reminder Detected (next_fire_at <= now)
    ↓
┌─────────────────────────┬──────────────────────────┐
│  Windows Toast          │  In-App Notification     │
│  (if channel=toast)     │  (if channel=in_app)     │
│    - Pay button         │    - Snooze button       │
│    - Snooze button      │    - Dismiss button      │
│    - Open button        │    - Auto-refresh        │
└─────────────────────────┴──────────────────────────┘
    ↓
User Action → ReminderService updates status → ReminderLog entry
```

---

## 2. Scheduler Design

### 2.1 Background Worker

The scheduler runs as a background task using Tauri's async runtime (`tauri::async_runtime`). It:

- Polls the `reminder` table every 60 seconds (configurable)
- Queries reminders where `next_fire_at <= now()` and `status = 'scheduled'`
- For each due reminder:
  - Emits `notification:prepared` event with reminder details
  - Triggers appropriate notification channel (toast, in_app, email)
  - Updates `last_triggered_at` timestamp
  - Logs action to `ReminderLog`

### 2.2 Implementation

The scheduler is implemented in `src-tauri/src/scheduler/mod.rs`:

```rust
// Pseudocode structure
pub struct ReminderScheduler {
    reminder_service: Arc<dyn ReminderService>,
    app_handle: AppHandle,
}

impl ReminderScheduler {
    pub async fn start_polling(&self) {
        let mut interval = tokio::time::interval(Duration::from_secs(60));
        loop {
            interval.tick().await;
            if let Ok(due_reminders) = self.reminder_service.get_due_reminders() {
                for reminder in due_reminders {
                    self.trigger_notification(reminder).await;
                }
            }
        }
    }
}
```

### 2.3 Configuration

- **Poll Interval**: Default 60 seconds, configurable via settings
- **Batch Size**: Process up to 50 reminders per poll cycle
- **Error Handling**: Failed notifications are logged but don't stop the scheduler

---

## 3. RRULE Support

### 3.1 Current Implementation

The system supports simplified recurrence patterns:

- `DAILY` or `FREQ=DAILY`: Repeats every day
- `WEEKLY` or `FREQ=WEEKLY`: Repeats every week (same day of week)
- `MONTHLY` or `FREQ=MONTHLY`: Repeats every month (approximated as 30 days)

### 3.2 RRULE Examples

```typescript
// Daily reminder
{
  title: "Daily Expense Review",
  recurrence_rule: "DAILY",
  due_at: "2025-11-21T09:00:00Z"
}

// Weekly reminder (every Monday)
{
  title: "Weekly Budget Review",
  recurrence_rule: "WEEKLY",
  due_at: "2025-11-24T10:00:00Z" // Monday
}

// Monthly reminder (15th of each month)
{
  title: "Credit Card Payment",
  recurrence_rule: "MONTHLY",
  due_at: "2025-11-15T08:00:00Z"
}

// Full RRULE format (future enhancement)
{
  title: "Bi-weekly Paycheck",
  recurrence_rule: "FREQ=WEEKLY;INTERVAL=2;BYDAY=FR",
  due_at: "2025-11-28T09:00:00Z"
}
```

### 3.3 Next Fire Calculation

When a reminder is created or updated:

1. If `recurrence_rule` is present, calculate `next_fire_at` based on pattern
2. If no recurrence, `next_fire_at = due_at`
3. After notification fires, recalculate `next_fire_at` for recurring reminders

---

## 4. Windows Toast Notifications

### 4.1 Toast Structure

Windows toast notifications include:

- **Title**: Reminder title
- **Body**: Reminder description or formatted amount
- **Actions**:
  - **Pay**: Opens transaction modal prefilled with reminder details
  - **Snooze**: Postpones reminder by default duration (15 minutes)
  - **Open**: Opens app and navigates to reminder detail page

### 4.2 Toast Payload

```typescript
{
  title: "Pay Credit Card",
  body: "Amount: $150.00 | Due: Today",
  reminder_id: "rem_123",
  actions: [
    { id: "pay", label: "Pay" },
    { id: "snooze", label: "Snooze" },
    { id: "open", label: "Open App" }
  ]
}
```

### 4.3 Deep Link Handling

When user clicks a toast action:

1. App receives deep link: `app://reminder/action?reminder_id=rem_123&action=pay`
2. Frontend router handles deep link
3. `handleToastAction` function processes action:
   - **Pay**: Opens transaction form with prefilled account/amount
   - **Snooze**: Calls `snooze_reminder` command
   - **Open**: Navigates to reminders page and highlights reminder

### 4.4 Implementation

Uses `@tauri-apps/plugin-notification` for basic notifications. For actionable toasts on Windows, we use Windows Toast API via `winrt` crate for full control over actions.

---

## 5. In-App Notification Center

### 5.1 UI Components

- **NotificationCenter**: Drawer component accessible via `Ctrl+Shift+N` or bell icon
- **ReminderCard**: Individual reminder card with snooze/dismiss actions
- **Auto-refresh**: React Query refetches due reminders every 60 seconds

### 5.2 Features

- Shows all due reminders (`next_fire_at <= now`)
- Quick actions: Snooze (15 min) or Mark as Sent
- Overdue indicators (red border for past due)
- Empty state when no due reminders
- Keyboard navigation support

### 5.3 State Management

- Uses React Query (`useDueRemindersQuery`) for data fetching
- Auto-refreshes every minute via `refetchInterval`
- Optimistic updates for snooze/dismiss actions

---

## 6. Testing

### 6.1 Unit Tests

**RRULE Parsing** (`tests/unit/reminders/rrule.test.ts`):
- Test DAILY pattern calculation
- Test WEEKLY pattern calculation
- Test MONTHLY pattern calculation
- Test edge cases (leap years, month boundaries)

**Snooze Calculations** (`tests/unit/reminders/snooze.test.ts`):
- Test default snooze duration (15 minutes)
- Test custom snooze duration
- Test snooze updates `next_fire_at` correctly

**Status Transitions** (`tests/unit/reminders/status.test.ts`):
- Test scheduled → sent transition
- Test scheduled → snoozed transition
- Test snoozed → scheduled transition
- Test any → dismissed transition

### 6.2 Integration Tests

**Scheduler Firing** (`tests/integration/scheduler.test.ts`):
- Create reminder with `next_fire_at` in past
- Wait for scheduler poll (mock time)
- Verify notification event emitted
- Verify `last_triggered_at` updated
- Verify `ReminderLog` entry created

**Toast Action Handlers** (`tests/integration/toast.test.ts`):
- Mock Windows toast API
- Trigger Pay action
- Verify transaction form opens with prefilled data
- Trigger Snooze action
- Verify `next_fire_at` updated
- Trigger Open action
- Verify navigation to reminder page

### 6.3 Component Tests

**NotificationCenter Rendering** (`tests/unit/reminders/NotificationCenter.test.tsx`):
- Render with empty due reminders
- Render with multiple due reminders
- Test snooze button click
- Test dismiss button click
- Test keyboard navigation

**Snooze Countdown** (`tests/unit/reminders/SnoozeCountdown.test.tsx`):
- Display countdown timer for snoozed reminders
- Update countdown every second
- Show "Due now" when countdown reaches zero

### 6.4 E2E Tests

**Create Reminder → Toast → Snooze Flow** (`tests/e2e/reminders-toast.spec.ts`):
1. Create reminder with due date in future
2. Fast-forward time to due date
3. Verify toast notification appears
4. Click Snooze button in toast
5. Verify `next_fire_at` updated
6. Verify reminder status changed to "snoozed"

**Create Reminder → Toast → Pay Flow** (`tests/e2e/reminders-pay.spec.ts`):
1. Create reminder with account and amount
2. Fast-forward time to due date
3. Verify toast notification appears
4. Click Pay button in toast
5. Verify transaction form opens
6. Verify form prefilled with account and amount
7. Submit transaction
8. Verify reminder status changed to "sent"

### 6.5 Security Tests

**Snapshot Test for Payloads** (`tests/security/reminder-payload.test.ts`):
- Verify no sensitive data (passwords, tokens) in toast payloads
- Verify reminder IDs are UUIDs (not sequential)
- Verify amount formatting doesn't leak precision

### 6.6 Test Commands

```bash
# Run all reminder tests
pnpm test reminders

# Run scheduler integration tests
pnpm test scheduler

# Run toast action tests
pnpm test toast

# Run e2e reminder flows
pnpm test:e2e reminders
```

---

## 7. Reminder Templates

### 7.1 Template System

Reminder templates provide pre-configured reminders for common bills:

- **Credit Card Payment**: Monthly, 15th of month, default amount
- **Utility Bills**: Monthly, 1st of month, variable amount
- **Rent/Mortgage**: Monthly, 1st of month, fixed amount
- **Insurance Premiums**: Quarterly/Annual, specific dates

### 7.2 Template Structure

```typescript
interface ReminderTemplate {
  id: string;
  name: string;
  title: string;
  description?: string;
  recurrence_rule: string;
  default_amount_cents?: number;
  default_due_day: number; // Day of month
  category_id?: string;
}
```

### 7.3 Usage

Users can:
1. Browse templates from Reminders page
2. Select a template
3. Customize title, amount, account, due date
4. Create reminder from template

---

## 8. Retention Policies

### 8.1 Policy Configuration

Retention policies automatically clean up old reminders:

- **Sent Reminders**: Keep for 90 days, then archive
- **Dismissed Reminders**: Keep for 30 days, then delete
- **Scheduled Reminders**: Keep indefinitely (active reminders)

### 8.2 Implementation

Background job runs daily:

1. Query reminders older than retention period
2. For sent reminders: Move to archive table
3. For dismissed reminders: Delete from database
4. Log retention actions to audit log

### 8.3 Configuration

Users can configure retention periods in Settings:
- Sent reminders retention (default: 90 days)
- Dismissed reminders retention (default: 30 days)
- Enable/disable auto-cleanup

---

## 9. Troubleshooting

### 9.1 Scheduler Not Running

**Symptoms**: Reminders not firing even when due

**Diagnosis**:
- Check scheduler is started in `main.rs` setup
- Verify `get_due_reminders` query returns results
- Check logs for scheduler errors

**Solution**:
- Ensure scheduler task is spawned in app setup
- Verify database connection is active
- Check `next_fire_at` values are correct

### 9.2 Toast Notifications Not Appearing

**Symptoms**: Reminders due but no toast shown

**Diagnosis**:
- Check Windows notification permissions
- Verify `channel = 'toast'` in reminder
- Check Windows Focus Assist settings

**Solution**:
- Request notification permission on first run
- Verify app is not in Focus Assist "Alarms only" mode
- Check Windows notification settings for app

### 9.3 Deep Links Not Working

**Symptoms**: Toast actions don't open app or navigate

**Diagnosis**:
- Verify deep link protocol registered in `tauri.conf.json`
- Check router handles deep link routes
- Verify action handler functions exist

**Solution**:
- Register `app://` protocol in Tauri config
- Implement deep link router handler
- Test deep links manually via browser

---

## 10. Future Enhancements

- **Full RRULE Support**: Implement RFC 5545 compliant RRULE parser
- **Email Notifications**: SMTP integration for email channel
- **Push Notifications**: Cloud sync integration for cross-device notifications
- **Smart Scheduling**: ML-based optimal reminder timing
- **Notification Preferences**: Per-reminder channel preferences
- **Rich Toast Content**: Images, progress bars, multiple actions

---

## 11. References

- [Tauri Notification Plugin](https://github.com/tauri-apps/plugins-workspace/tree/v2/plugins/notification)
- [Windows Toast Notifications](https://docs.microsoft.com/en-us/windows/apps/design/shell/tiles-and-notifications/toast-notifications-overview)
- [RFC 5545 - iCalendar](https://tools.ietf.org/html/rfc5545)
- [RRULE.js Library](https://github.com/jkbrzt/rrule)

