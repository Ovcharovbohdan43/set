-- Planning Layer schema extension

CREATE TABLE "MonthlyPlan" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "month" DATETIME NOT NULL,
    "total_planned_income" REAL DEFAULT 0,
    "total_planned_expenses" REAL DEFAULT 0,
    "total_planned_savings" REAL DEFAULT 0,
    "note" TEXT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PlannedIncome" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "monthly_plan_id" TEXT NOT NULL REFERENCES "MonthlyPlan"(id) ON DELETE CASCADE,
    "source_name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_fixed" INTEGER NOT NULL DEFAULT 1,
    "expected_date" DATETIME,
    "expected_amount" REAL NOT NULL,
    "actual_amount" REAL DEFAULT 0,
    "account_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PlannedExpense" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "monthly_plan_id" TEXT NOT NULL REFERENCES "MonthlyPlan"(id) ON DELETE CASCADE,
    "category_id" TEXT,
    "label" TEXT NOT NULL,
    "expected_amount" REAL NOT NULL,
    "actual_amount" REAL DEFAULT 0,
    "frequency" TEXT NOT NULL DEFAULT 'once',
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "DebtAccount" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "principal" REAL NOT NULL,
    "interest_rate" REAL NOT NULL,
    "min_monthly_payment" REAL NOT NULL,
    "due_day" INTEGER NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME,
    "current_balance" REAL NOT NULL,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "DebtPaymentSchedule" (
    "id" TEXT PRIMARY KEY,
    "debt_account_id" TEXT NOT NULL REFERENCES "DebtAccount"(id) ON DELETE CASCADE,
    "due_date" DATETIME NOT NULL,
    "planned_payment" REAL NOT NULL,
    "planned_interest" REAL NOT NULL,
    "planned_principal" REAL NOT NULL,
    "is_paid" INTEGER NOT NULL DEFAULT 0,
    "transaction_id" TEXT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PlannedSaving" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "monthly_plan_id" TEXT NOT NULL REFERENCES "MonthlyPlan"(id) ON DELETE CASCADE,
    "goal_id" TEXT,
    "expected_amount" REAL NOT NULL,
    "actual_amount" REAL DEFAULT 0,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);
