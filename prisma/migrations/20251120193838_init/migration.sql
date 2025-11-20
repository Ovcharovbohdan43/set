-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "display_name" TEXT,
    "default_currency" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    "week_starts_on" INTEGER NOT NULL DEFAULT 1,
    "telemetry_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'checking' CHECK ("type" IN ('cash','checking','credit','savings','investment','wallet')),
    "currency" TEXT NOT NULL,
    "balance_cents" INTEGER NOT NULL DEFAULT 0,
    "institution" TEXT,
    "color_token" TEXT,
    "sync_external_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL CHECK ("type" IN ('income','expense','transfer')),
    "parent_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Category_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "category_id" TEXT,
    "goal_id" TEXT,
    "type" TEXT NOT NULL CHECK ("type" IN ('income','expense','transfer')),
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "exchange_rate" REAL,
    "occurred_on" DATETIME NOT NULL,
    "cleared" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "tags" TEXT,
    "attachment_path" TEXT,
    "recurrence_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "Goal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "period" TEXT NOT NULL CHECK ("period" IN ('weekly','monthly','quarterly','yearly')),
    "type" TEXT NOT NULL CHECK ("type" IN ('envelope','overall')),
    "category_id" TEXT,
    "amount_cents" INTEGER NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "rollover" BOOLEAN NOT NULL DEFAULT false,
    "alert_threshold" REAL NOT NULL DEFAULT 0.8,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Budget_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Budget_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BudgetEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budget_id" TEXT NOT NULL,
    "actual_cents" INTEGER NOT NULL,
    "projected_cents" INTEGER NOT NULL,
    "snapshot_date" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BudgetEntry_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "Budget" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "target_cents" INTEGER NOT NULL,
    "current_cents" INTEGER NOT NULL DEFAULT 0,
    "target_date" DATETIME,
    "category_id" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active' CHECK ("status" IN ('active','paused','achieved','abandoned')),
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Goal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Goal_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "account_id" TEXT,
    "amount_cents" INTEGER,
    "due_at" DATETIME NOT NULL,
    "recurrence_rule" TEXT,
    "next_fire_at" DATETIME,
    "channel" TEXT NOT NULL DEFAULT 'toast' CHECK ("channel" IN ('toast','in_app','email')),
    "snooze_minutes" INTEGER DEFAULT 0,
    "last_triggered_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'scheduled' CHECK ("status" IN ('scheduled','sent','snoozed','dismissed')),
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reminder_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reminder_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReminderLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reminder_id" TEXT NOT NULL,
    "action" TEXT NOT NULL CHECK ("action" IN ('sent','clicked_pay','clicked_snooze','clicked_open')),
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReminderLog_reminder_id_fkey" FOREIGN KEY ("reminder_id") REFERENCES "Reminder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SyncState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "entity_name" TEXT NOT NULL,
    "last_local_change" DATETIME,
    "last_remote_cursor" TEXT,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "SyncState_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReportCache_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_user_id_idx" ON "Account"("user_id");

-- CreateIndex
CREATE INDEX "Category_user_id_type_idx" ON "Category"("user_id", "type");

-- CreateIndex
CREATE INDEX "Transaction_user_id_occurred_on_idx" ON "Transaction"("user_id", "occurred_on");

-- CreateIndex
CREATE INDEX "Transaction_category_id_occurred_on_idx" ON "Transaction"("category_id", "occurred_on");

-- CreateIndex
CREATE INDEX "Budget_user_id_period_start_date_idx" ON "Budget"("user_id", "period", "start_date");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetEntry_budget_id_snapshot_date_key" ON "BudgetEntry"("budget_id", "snapshot_date");

-- CreateIndex
CREATE INDEX "Goal_user_id_status_idx" ON "Goal"("user_id", "status");

-- CreateIndex
CREATE INDEX "Reminder_user_id_next_fire_at_idx" ON "Reminder"("user_id", "next_fire_at");

-- CreateIndex
CREATE UNIQUE INDEX "SyncState_user_id_entity_name_key" ON "SyncState"("user_id", "entity_name");

-- CreateIndex
CREATE UNIQUE INDEX "ReportCache_user_id_key_key" ON "ReportCache"("user_id", "key");
