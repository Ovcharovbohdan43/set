use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use uuid::Uuid;
use chrono::Datelike;

use crate::services::ServiceDescriptor;

#[derive(Debug, Error)]
pub enum PlanningError {
    #[error("database error: {0}")]
    Database(String),
    #[error("validation error: {0}")]
    Validation(String),
}

pub type PlanningResult<T> = Result<T, PlanningError>;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MonthlyPlanDto {
    pub id: String,
    pub month: String,
    pub total_planned_income: f64,
    pub total_planned_expenses: f64,
    pub total_planned_savings: f64,
    pub note: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateMonthlyPlanInput {
    pub month: String, // ISO date first day of month
    pub total_planned_income: Option<f64>,
    pub total_planned_expenses: Option<f64>,
    pub total_planned_savings: Option<f64>,
    pub note: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddPlannedIncomeInput {
    pub monthly_plan_id: String,
    pub source_name: String,
    pub r#type: String,
    pub expected_amount: f64,
    pub expected_date: Option<String>,
    pub is_fixed: Option<bool>,
    pub account_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePlannedIncomeInput {
    pub id: String,
    pub source_name: Option<String>,
    pub r#type: Option<String>,
    pub expected_amount: Option<f64>,
    pub expected_date: Option<String>,
    pub is_fixed: Option<bool>,
    pub account_id: Option<String>,
    pub actual_amount: Option<f64>,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeletePlannedIncomeInput {
    pub id: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlannedIncomeDto {
    pub id: String,
    pub source_name: String,
    pub r#type: String,
    pub expected_amount: f64,
    pub actual_amount: f64,
    pub expected_date: Option<String>,
    pub account_id: Option<String>,
    pub status: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddPlannedExpenseInput {
    pub monthly_plan_id: String,
    pub label: String,
    pub category_id: Option<String>,
    pub expected_amount: f64,
    pub frequency: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePlannedExpenseInput {
    pub id: String,
    pub label: Option<String>,
    pub category_id: Option<String>,
    pub expected_amount: Option<f64>,
    pub frequency: Option<String>,
    pub actual_amount: Option<f64>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeletePlannedExpenseInput {
    pub id: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlannedExpenseDto {
    pub id: String,
    pub label: String,
    pub expected_amount: f64,
    pub actual_amount: f64,
    pub category_id: Option<String>,
    pub frequency: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddDebtAccountInput {
    pub name: String,
    pub r#type: String,
    pub principal: f64,
    pub interest_rate: f64,
    pub min_monthly_payment: f64,
    pub due_day: i32,
    pub start_date: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddPlannedSavingInput {
    pub monthly_plan_id: String,
    pub goal_id: Option<String>,
    pub expected_amount: f64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePlannedSavingInput {
    pub id: String,
    pub goal_id: Option<String>,
    pub expected_amount: Option<f64>,
    pub actual_amount: Option<f64>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeletePlannedSavingInput {
    pub id: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDebtAccountInput {
    pub id: String,
    pub name: Option<String>,
    pub r#type: Option<String>,
    pub principal: Option<f64>,
    pub interest_rate: Option<f64>,
    pub min_monthly_payment: Option<f64>,
    pub due_day: Option<i32>,
    pub current_balance: Option<f64>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteDebtAccountInput {
    pub id: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DebtAccountDto {
    pub id: String,
    pub name: String,
    pub r#type: String,
    pub principal: f64,
    pub interest_rate: f64,
    pub min_monthly_payment: f64,
    pub due_day: i32,
    pub current_balance: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DebtScheduleDto {
    pub id: String,
    pub debt_account_id: String,
    pub due_date: String,
    pub planned_payment: f64,
    pub planned_interest: f64,
    pub planned_principal: f64,
    pub is_paid: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlannedSavingDto {
    pub id: String,
    pub goal_id: Option<String>,
    pub expected_amount: f64,
    pub actual_amount: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanActualSummary {
    pub plan_id: String,
    pub planned_income: f64,
    pub actual_income: f64,
    pub planned_expenses: f64,
    pub actual_expenses: f64,
    pub planned_savings: f64,
    pub actual_savings: f64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateDebtScheduleInput {
    pub debt_account_id: String,
    pub months: Option<u32>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfirmDebtPaymentInput {
    pub schedule_id: String,
    pub account_id: Option<String>,
    pub category_id: Option<String>,
}

#[derive(Clone)]
pub struct PlanningService {
    db_path: std::path::PathBuf,
    key: Option<String>,
    user_id: String,
}

impl PlanningService {
    pub fn new(db_path: std::path::PathBuf, key: Option<String>, user_id: String) -> PlanningResult<Self> {
        let service = Self { db_path, key, user_id };
        service.bootstrap()?;
        Ok(service)
    }

    fn bootstrap(&self) -> PlanningResult<()> {
        let conn = self.conn()?;
        self.init_schema(&conn)?;
        Ok(())
    }

    fn init_schema(&self, conn: &Connection) -> PlanningResult<()> {
        // Check if MonthlyPlan table exists
        let table_exists: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='MonthlyPlan')",
                [],
                |row| row.get(0),
            )
            .unwrap_or(false);

        if table_exists {
            // Tables already exist, ensure user exists
            self.ensure_user_exists(conn)?;
            return Ok(());
        }

        // Create planning tables
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS "MonthlyPlan"(
                id TEXT PRIMARY KEY,
                user_id TEXT,
                month TEXT,
                total_planned_income REAL,
                total_planned_expenses REAL,
                total_planned_savings REAL,
                note TEXT
            );
            CREATE TABLE IF NOT EXISTS "PlannedIncome"(
                id TEXT PRIMARY KEY,
                user_id TEXT,
                monthly_plan_id TEXT,
                source_name TEXT,
                type TEXT,
                is_fixed INTEGER,
                expected_date TEXT,
                expected_amount REAL,
                actual_amount REAL,
                account_id TEXT,
                status TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS "PlannedExpense"(
                id TEXT PRIMARY KEY,
                user_id TEXT,
                monthly_plan_id TEXT,
                category_id TEXT,
                label TEXT,
                expected_amount REAL,
                actual_amount REAL,
                frequency TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS "PlannedSaving"(
                id TEXT PRIMARY KEY,
                user_id TEXT,
                monthly_plan_id TEXT,
                goal_id TEXT,
                expected_amount REAL,
                actual_amount REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS "DebtAccount"(
                id TEXT PRIMARY KEY,
                user_id TEXT,
                name TEXT,
                type TEXT,
                principal REAL,
                interest_rate REAL,
                min_monthly_payment REAL,
                due_day INTEGER,
                start_date TEXT,
                current_balance REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS "DebtPaymentSchedule"(
                id TEXT PRIMARY KEY,
                debt_account_id TEXT,
                due_date TEXT,
                planned_payment REAL,
                planned_interest REAL,
                planned_principal REAL,
                is_paid INTEGER DEFAULT 0,
                transaction_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            "#,
        )
        .map_err(|e| PlanningError::Database(format!("Failed to initialize planning schema: {}", e)))?;

        // Ensure user exists
        self.ensure_user_exists(conn)?;

        Ok(())
    }

    fn ensure_user_exists(&self, conn: &Connection) -> PlanningResult<()> {
        conn.execute(
            r#"INSERT OR IGNORE INTO "User" (id, default_currency, locale, week_starts_on, telemetry_opt_in, created_at, updated_at)
               VALUES (?1, 'USD', 'en-US', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"#,
            params![self.user_id],
        )
        .map_err(|e| PlanningError::Database(e.to_string()))?;
        Ok(())
    }

    fn conn(&self) -> PlanningResult<Connection> {
        let conn = Connection::open(&self.db_path)
            .map_err(|e| PlanningError::Database(e.to_string()))?;
        
        // Enable foreign keys
        conn.execute("PRAGMA foreign_keys = ON;", [])
            .map_err(|e| PlanningError::Database(format!("Failed to enable foreign keys: {}", e)))?;
        
        if let Some(key) = &self.key {
            conn.pragma_update(None, "key", key.as_str())
                .map_err(|err| PlanningError::Database(err.to_string()))?;
        }
        Ok(conn)
    }

    /// Update MonthlyPlan totals (total_planned_income, total_planned_expenses, total_planned_savings)
    /// by recalculating from PlannedIncome, PlannedExpense, and PlannedSaving tables
    fn update_plan_totals(&self, conn: &Connection, plan_id: &str) -> PlanningResult<()> {
        // Calculate totals from child tables
        let total_planned_income: f64 = conn
            .query_row(
                r#"SELECT COALESCE(SUM(expected_amount), 0) FROM "PlannedIncome" 
                   WHERE user_id = ?1 AND monthly_plan_id = ?2"#,
                params![self.user_id, plan_id],
                |row| row.get(0),
            )
            .unwrap_or(0.0);

        let total_planned_expenses: f64 = conn
            .query_row(
                r#"SELECT COALESCE(SUM(expected_amount), 0) FROM "PlannedExpense" 
                   WHERE user_id = ?1 AND monthly_plan_id = ?2"#,
                params![self.user_id, plan_id],
                |row| row.get(0),
            )
            .unwrap_or(0.0);

        let total_planned_savings: f64 = conn
            .query_row(
                r#"SELECT COALESCE(SUM(expected_amount), 0) FROM "PlannedSaving" 
                   WHERE user_id = ?1 AND monthly_plan_id = ?2"#,
                params![self.user_id, plan_id],
                |row| row.get(0),
            )
            .unwrap_or(0.0);

        // Update MonthlyPlan with calculated totals
        conn.execute(
            r#"UPDATE "MonthlyPlan" 
               SET total_planned_income = ?1, total_planned_expenses = ?2, total_planned_savings = ?3
               WHERE id = ?4 AND user_id = ?5"#,
            params![total_planned_income, total_planned_expenses, total_planned_savings, plan_id, self.user_id],
        )
        .map_err(|e| PlanningError::Database(format!("Failed to update plan totals: {}", e)))?;

        Ok(())
    }

    pub fn descriptor(&self) -> ServiceDescriptor {
        ServiceDescriptor::new("PlanningService", "sqlite")
    }

    pub fn create_monthly_plan(&self, input: CreateMonthlyPlanInput) -> PlanningResult<MonthlyPlanDto> {
        let id = Uuid::new_v4().to_string();
        let conn = self.conn()?;
        self.ensure_user_exists(&conn)?;
        conn.execute(
            r#"INSERT INTO "MonthlyPlan" (id, user_id, month, total_planned_income, total_planned_expenses, total_planned_savings, note)
               VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"#,
            params![
                id,
                self.user_id,
                input.month,
                input.total_planned_income.unwrap_or(0.0),
                input.total_planned_expenses.unwrap_or(0.0),
                input.total_planned_savings.unwrap_or(0.0),
                input.note
            ],
        )
        .map_err(|e| PlanningError::Database(e.to_string()))?;

        Ok(MonthlyPlanDto {
            id,
            month: input.month,
            total_planned_income: input.total_planned_income.unwrap_or(0.0),
            total_planned_expenses: input.total_planned_expenses.unwrap_or(0.0),
            total_planned_savings: input.total_planned_savings.unwrap_or(0.0),
            note: input.note,
        })
    }

    pub fn list_monthly_plans(&self) -> PlanningResult<Vec<MonthlyPlanDto>> {
        let conn = self.conn()?;
        let mut stmt = conn
            .prepare(
                r#"SELECT id, month, total_planned_income, total_planned_expenses, total_planned_savings, note
                   FROM "MonthlyPlan" WHERE user_id = ?1 ORDER BY month DESC"#,
            )
            .map_err(|e| PlanningError::Database(e.to_string()))?;
        let rows = stmt
            .query_map(params![self.user_id], |row| {
                Ok(MonthlyPlanDto {
                    id: row.get(0)?,
                    month: row.get(1)?,
                    total_planned_income: row.get::<_, f64>(2)?,
                    total_planned_expenses: row.get::<_, f64>(3)?,
                    total_planned_savings: row.get::<_, f64>(4)?,
                    note: row.get(5)?,
                })
            })
            .map_err(|e| PlanningError::Database(e.to_string()))?;
        let mut plans = Vec::new();
        for p in rows {
            plans.push(p.map_err(|e| PlanningError::Database(e.to_string()))?);
        }
        Ok(plans)
    }

    pub fn add_planned_income(&self, input: AddPlannedIncomeInput) -> PlanningResult<PlannedIncomeDto> {
        let id = Uuid::new_v4().to_string();
        let conn = self.conn()?;
        self.ensure_user_exists(&conn)?;
        conn.execute(
            r#"INSERT INTO "PlannedIncome" (id, user_id, monthly_plan_id, source_name, type, is_fixed, expected_date, expected_amount, actual_amount, account_id, status)
               VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 0, ?9, 'planned')"#,
            params![
                id,
                self.user_id,
                input.monthly_plan_id,
                input.source_name,
                input.r#type,
                input.is_fixed.unwrap_or(true) as i32,
                input.expected_date,
                input.expected_amount,
                input.account_id
            ],
        )
        .map_err(|e| PlanningError::Database(e.to_string()))?;

        // Update MonthlyPlan.total_planned_income to keep it in sync
        self.update_plan_totals(&conn, &input.monthly_plan_id)?;

        Ok(PlannedIncomeDto {
            id,
            source_name: input.source_name,
            r#type: input.r#type,
            expected_amount: input.expected_amount,
            actual_amount: 0.0,
            expected_date: input.expected_date,
            account_id: input.account_id,
            status: "planned".to_string(),
        })
    }

    pub fn list_incomes(&self, plan_id: &str) -> PlanningResult<Vec<PlannedIncomeDto>> {
        let conn = self.conn()?;
        let mut stmt = conn
            .prepare(
                r#"SELECT id, source_name, type, expected_amount, actual_amount, expected_date, account_id, status
                   FROM "PlannedIncome" WHERE user_id = ?1 AND monthly_plan_id = ?2
                   ORDER BY expected_date NULLS LAST, created_at DESC"#,
            )
            .map_err(|e| PlanningError::Database(e.to_string()))?;

        let mapped = stmt
            .query_map(params![self.user_id, plan_id], |row| {
                Ok(PlannedIncomeDto {
                    id: row.get(0)?,
                    source_name: row.get(1)?,
                    r#type: row.get(2)?,
                    expected_amount: row.get::<_, f64>(3)?,
                    actual_amount: row.get::<_, f64>(4)?,
                    expected_date: row.get(5)?,
                    account_id: row.get(6)?,
                    status: row.get(7)?,
                })
            })
            .map_err(|e| PlanningError::Database(e.to_string()))?;

        let mut incomes = Vec::new();
        for i in mapped {
            incomes.push(i.map_err(|e| PlanningError::Database(e.to_string()))?);
        }
        Ok(incomes)
    }

    pub fn update_income(&self, input: UpdatePlannedIncomeInput) -> PlanningResult<PlannedIncomeDto> {
        let conn = self.conn()?;
        let existing: (PlannedIncomeDto, String) = conn
            .query_row(
                r#"SELECT id, source_name, type, expected_amount, actual_amount, expected_date, account_id, status, monthly_plan_id
                   FROM "PlannedIncome" WHERE id = ?1 AND user_id = ?2"#,
                params![input.id, self.user_id],
                |row| {
                    Ok((
                        PlannedIncomeDto {
                            id: row.get(0)?,
                            source_name: row.get(1)?,
                            r#type: row.get(2)?,
                            expected_amount: row.get(3)?,
                            actual_amount: row.get(4)?,
                            expected_date: row.get(5)?,
                            account_id: row.get(6)?,
                            status: row.get(7)?,
                        },
                        row.get(8)?,
                    ))
                },
            )
            .optional()
            .map_err(|e| PlanningError::Database(e.to_string()))?
            .ok_or_else(|| PlanningError::Validation("income not found".into()))?;

        let (existing, monthly_plan_id) = existing;
        let updated = PlannedIncomeDto {
            id: existing.id.clone(),
            source_name: input.source_name.unwrap_or(existing.source_name),
            r#type: input.r#type.unwrap_or(existing.r#type),
            expected_amount: input.expected_amount.unwrap_or(existing.expected_amount),
            actual_amount: input.actual_amount.unwrap_or(existing.actual_amount),
            expected_date: input.expected_date.or(existing.expected_date),
            account_id: input.account_id.or(existing.account_id),
            status: input.status.unwrap_or(existing.status),
        };

        conn.execute(
            r#"UPDATE "PlannedIncome"
               SET source_name = ?1, type = ?2, expected_amount = ?3, actual_amount = ?4,
                   expected_date = ?5, account_id = ?6, status = ?7, is_fixed = COALESCE(?8, is_fixed)
               WHERE id = ?9 AND user_id = ?10"#,
            params![
                updated.source_name,
                updated.r#type,
                updated.expected_amount,
                updated.actual_amount,
                updated.expected_date,
                updated.account_id,
                updated.status,
                input.is_fixed.map(|b| if b { 1 } else { 0 }),
                updated.id,
                self.user_id
            ],
        )
        .map_err(|e| PlanningError::Database(e.to_string()))?;

        // Update MonthlyPlan totals if amount changed
        if input.expected_amount.is_some() && input.expected_amount != Some(existing.expected_amount) {
            self.update_plan_totals(&conn, &monthly_plan_id)?;
        }

        Ok(updated)
    }

    pub fn delete_income(&self, input: DeletePlannedIncomeInput) -> PlanningResult<()> {
        let conn = self.conn()?;
        // Get monthly_plan_id before deletion
        let monthly_plan_id: Option<String> = conn
            .query_row(
                r#"SELECT monthly_plan_id FROM "PlannedIncome" WHERE id = ?1 AND user_id = ?2"#,
                params![input.id, self.user_id],
                |row| row.get(0),
            )
            .optional()
            .map_err(|e| PlanningError::Database(e.to_string()))?;

        conn.execute(
            r#"DELETE FROM "PlannedIncome" WHERE id = ?1 AND user_id = ?2"#,
            params![input.id, self.user_id],
        )
        .map_err(|e| PlanningError::Database(e.to_string()))?;

        // Update MonthlyPlan totals after deletion
        if let Some(plan_id) = monthly_plan_id {
            self.update_plan_totals(&conn, &plan_id)?;
        }

        Ok(())
    }

    pub fn add_planned_expense(&self, input: AddPlannedExpenseInput) -> PlanningResult<PlannedExpenseDto> {
        let id = Uuid::new_v4().to_string();
        let conn = self.conn()?;
        self.ensure_user_exists(&conn)?;
        let frequency = input.frequency.clone().unwrap_or_else(|| "once".into());
        conn.execute(
            r#"INSERT INTO "PlannedExpense" (id, user_id, monthly_plan_id, category_id, label, expected_amount, actual_amount, frequency)
               VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, ?7)"#,
            params![
                id,
                self.user_id,
                input.monthly_plan_id,
                input.category_id,
                input.label,
                input.expected_amount,
                frequency
            ],
        )
        .map_err(|e| PlanningError::Database(e.to_string()))?;

        // Update MonthlyPlan.total_planned_expenses to keep it in sync
        self.update_plan_totals(&conn, &input.monthly_plan_id)?;

        Ok(PlannedExpenseDto {
            id,
            label: input.label,
            expected_amount: input.expected_amount,
            actual_amount: 0.0,
            category_id: input.category_id,
            frequency,
        })
    }

    pub fn list_expenses(&self, plan_id: &str) -> PlanningResult<Vec<PlannedExpenseDto>> {
        let conn = self.conn()?;
        let mut stmt = conn
            .prepare(
                r#"SELECT id, label, expected_amount, actual_amount, category_id, frequency
                   FROM "PlannedExpense" WHERE user_id = ?1 AND monthly_plan_id = ?2
                   ORDER BY created_at DESC"#,
            )
            .map_err(|e| PlanningError::Database(e.to_string()))?;

        let mapped = stmt
            .query_map(params![self.user_id, plan_id], |row| {
                Ok(PlannedExpenseDto {
                    id: row.get(0)?,
                    label: row.get(1)?,
                    expected_amount: row.get::<_, f64>(2)?,
                    actual_amount: row.get::<_, f64>(3)?,
                    category_id: row.get(4)?,
                    frequency: row.get(5)?,
                })
            })
            .map_err(|e| PlanningError::Database(e.to_string()))?;

        let mut items = Vec::new();
        for e in mapped {
            items.push(e.map_err(|err| PlanningError::Database(err.to_string()))?);
        }
        Ok(items)
    }

    pub fn update_expense(&self, input: UpdatePlannedExpenseInput) -> PlanningResult<PlannedExpenseDto> {
        let conn = self.conn()?;
        let existing: (PlannedExpenseDto, String) = conn
            .query_row(
                r#"SELECT id, label, expected_amount, actual_amount, category_id, frequency, monthly_plan_id
                   FROM "PlannedExpense" WHERE id = ?1 AND user_id = ?2"#,
                params![input.id, self.user_id],
                |row| {
                    Ok((
                        PlannedExpenseDto {
                            id: row.get(0)?,
                            label: row.get(1)?,
                            expected_amount: row.get(2)?,
                            actual_amount: row.get(3)?,
                            category_id: row.get(4)?,
                            frequency: row.get(5)?,
                        },
                        row.get(6)?,
                    ))
                },
            )
            .optional()
            .map_err(|e| PlanningError::Database(e.to_string()))?
            .ok_or_else(|| PlanningError::Validation("expense not found".into()))?;

        let (existing, monthly_plan_id) = existing;
        let updated = PlannedExpenseDto {
            id: existing.id.clone(),
            label: input.label.unwrap_or(existing.label),
            expected_amount: input.expected_amount.unwrap_or(existing.expected_amount),
            actual_amount: input.actual_amount.unwrap_or(existing.actual_amount),
            category_id: input.category_id.or(existing.category_id),
            frequency: input.frequency.unwrap_or(existing.frequency),
        };

        conn.execute(
            r#"UPDATE "PlannedExpense"
               SET label = ?1, expected_amount = ?2, actual_amount = ?3, category_id = ?4, frequency = ?5
               WHERE id = ?6 AND user_id = ?7"#,
            params![
                updated.label,
                updated.expected_amount,
                updated.actual_amount,
                updated.category_id,
                updated.frequency,
                updated.id,
                self.user_id
            ],
        )
        .map_err(|e| PlanningError::Database(e.to_string()))?;

        // Update MonthlyPlan totals if amount changed
        if input.expected_amount.is_some() && input.expected_amount != Some(existing.expected_amount) {
            self.update_plan_totals(&conn, &monthly_plan_id)?;
        }

        Ok(updated)
    }

    pub fn delete_expense(&self, input: DeletePlannedExpenseInput) -> PlanningResult<()> {
        let conn = self.conn()?;
        // Get monthly_plan_id before deletion
        let monthly_plan_id: Option<String> = conn
            .query_row(
                r#"SELECT monthly_plan_id FROM "PlannedExpense" WHERE id = ?1 AND user_id = ?2"#,
                params![input.id, self.user_id],
                |row| row.get(0),
            )
            .optional()
            .map_err(|e| PlanningError::Database(e.to_string()))?;

        conn.execute(
            r#"DELETE FROM "PlannedExpense" WHERE id = ?1 AND user_id = ?2"#,
            params![input.id, self.user_id],
        )
        .map_err(|e| PlanningError::Database(e.to_string()))?;

        // Update MonthlyPlan totals after deletion
        if let Some(plan_id) = monthly_plan_id {
            self.update_plan_totals(&conn, &plan_id)?;
        }

        Ok(())
    }

    pub fn add_debt_account(&self, input: AddDebtAccountInput) -> PlanningResult<DebtAccountDto> {
        if input.interest_rate < 0.0 || input.due_day < 1 || input.due_day > 31 {
            return Err(PlanningError::Validation("invalid debt input".into()));
        }
        let id = Uuid::new_v4().to_string();
        let conn = self.conn()?;
        self.ensure_user_exists(&conn)?;
        conn.execute(
            r#"INSERT INTO "DebtAccount" (id, user_id, name, type, principal, interest_rate, min_monthly_payment, due_day, start_date, current_balance)
               VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"#,
            params![
                id,
                self.user_id,
                input.name,
                input.r#type,
                input.principal,
                input.interest_rate,
                input.min_monthly_payment,
                input.due_day,
                input.start_date,
                input.principal
            ],
        )
        .map_err(|e| PlanningError::Database(e.to_string()))?;

        Ok(DebtAccountDto {
            id,
            name: input.name,
            r#type: input.r#type,
            principal: input.principal,
            interest_rate: input.interest_rate,
            min_monthly_payment: input.min_monthly_payment,
            due_day: input.due_day,
            current_balance: input.principal,
        })
    }

    pub fn list_debts(&self) -> PlanningResult<Vec<DebtAccountDto>> {
        let conn = self.conn()?;
        let mut stmt = conn
            .prepare(
                r#"SELECT id, name, type, principal, interest_rate, min_monthly_payment, due_day, current_balance
                   FROM "DebtAccount" WHERE user_id = ?1 ORDER BY created_at DESC"#,
            )
            .map_err(|e| PlanningError::Database(e.to_string()))?;
        let rows = stmt
            .query_map(params![self.user_id], |row| {
                Ok(DebtAccountDto {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    r#type: row.get(2)?,
                    principal: row.get(3)?,
                    interest_rate: row.get(4)?,
                    min_monthly_payment: row.get(5)?,
                    due_day: row.get(6)?,
                    current_balance: row.get(7)?,
                })
            })
            .map_err(|e| PlanningError::Database(e.to_string()))?;
        let mut debts = Vec::new();
        for d in rows {
            debts.push(d.map_err(|e| PlanningError::Database(e.to_string()))?);
        }
        Ok(debts)
    }

    pub fn add_planned_saving(&self, input: AddPlannedSavingInput) -> PlanningResult<PlannedSavingDto> {
        let id = Uuid::new_v4().to_string();
        let conn = self.conn()?;
        self.ensure_user_exists(&conn)?;
        conn.execute(
            r#"INSERT INTO "PlannedSaving" (id, user_id, monthly_plan_id, goal_id, expected_amount, actual_amount)
               VALUES (?1, ?2, ?3, ?4, ?5, 0)"#,
            params![
                id,
                self.user_id,
                input.monthly_plan_id,
                input.goal_id,
                input.expected_amount
            ],
        )
        .map_err(|e| PlanningError::Database(e.to_string()))?;

        // Update MonthlyPlan.total_planned_savings to keep it in sync
        self.update_plan_totals(&conn, &input.monthly_plan_id)?;

        Ok(PlannedSavingDto {
            id,
            goal_id: input.goal_id,
            expected_amount: input.expected_amount,
            actual_amount: 0.0,
        })
    }

    pub fn list_savings(&self, plan_id: &str) -> PlanningResult<Vec<PlannedSavingDto>> {
        let conn = self.conn()?;
        let mut stmt = conn
            .prepare(
                r#"SELECT id, goal_id, expected_amount, actual_amount
                   FROM "PlannedSaving" WHERE user_id = ?1 AND monthly_plan_id = ?2
                   ORDER BY created_at DESC"#,
            )
            .map_err(|e| PlanningError::Database(e.to_string()))?;

        let mapped = stmt
            .query_map(params![self.user_id, plan_id], |row| {
                Ok(PlannedSavingDto {
                    id: row.get(0)?,
                    goal_id: row.get(1)?,
                    expected_amount: row.get(2)?,
                    actual_amount: row.get(3)?,
                })
            })
            .map_err(|e| PlanningError::Database(e.to_string()))?;

        let mut items = Vec::new();
        for s in mapped {
            items.push(s.map_err(|err| PlanningError::Database(err.to_string()))?);
        }
        Ok(items)
    }

    pub fn update_saving(&self, input: UpdatePlannedSavingInput) -> PlanningResult<PlannedSavingDto> {
        let conn = self.conn()?;
        let existing: (PlannedSavingDto, String) = conn
            .query_row(
                r#"SELECT id, goal_id, expected_amount, actual_amount, monthly_plan_id FROM "PlannedSaving" WHERE id = ?1 AND user_id = ?2"#,
                params![input.id, self.user_id],
                |row| {
                    Ok((
                        PlannedSavingDto {
                            id: row.get(0)?,
                            goal_id: row.get(1)?,
                            expected_amount: row.get(2)?,
                            actual_amount: row.get(3)?,
                        },
                        row.get(4)?,
                    ))
                },
            )
            .optional()
            .map_err(|e| PlanningError::Database(e.to_string()))?
            .ok_or_else(|| PlanningError::Validation("saving not found".into()))?;

        let (existing, monthly_plan_id) = existing;
        let updated = PlannedSavingDto {
            id: existing.id.clone(),
            goal_id: input.goal_id.or(existing.goal_id),
            expected_amount: input.expected_amount.unwrap_or(existing.expected_amount),
            actual_amount: input.actual_amount.unwrap_or(existing.actual_amount),
        };

        conn.execute(
            r#"UPDATE "PlannedSaving"
               SET goal_id = ?1, expected_amount = ?2, actual_amount = ?3
               WHERE id = ?4 AND user_id = ?5"#,
            params![
                updated.goal_id,
                updated.expected_amount,
                updated.actual_amount,
                updated.id,
                self.user_id
            ],
        )
        .map_err(|e| PlanningError::Database(e.to_string()))?;

        // Update MonthlyPlan totals if amount changed
        if input.expected_amount.is_some() && input.expected_amount != Some(existing.expected_amount) {
            self.update_plan_totals(&conn, &monthly_plan_id)?;
        }

        Ok(updated)
    }

    pub fn delete_saving(&self, input: DeletePlannedSavingInput) -> PlanningResult<()> {
        let conn = self.conn()?;
        // Get monthly_plan_id before deletion
        let monthly_plan_id: Option<String> = conn
            .query_row(
                r#"SELECT monthly_plan_id FROM "PlannedSaving" WHERE id = ?1 AND user_id = ?2"#,
                params![input.id, self.user_id],
                |row| row.get(0),
            )
            .optional()
            .map_err(|e| PlanningError::Database(e.to_string()))?;

        conn.execute(
            r#"DELETE FROM "PlannedSaving" WHERE id = ?1 AND user_id = ?2"#,
            params![input.id, self.user_id],
        )
        .map_err(|e| PlanningError::Database(e.to_string()))?;

        // Update MonthlyPlan totals after deletion
        if let Some(plan_id) = monthly_plan_id {
            self.update_plan_totals(&conn, &plan_id)?;
        }

        Ok(())
    }

    pub fn update_debt(&self, input: UpdateDebtAccountInput) -> PlanningResult<DebtAccountDto> {
        let conn = self.conn()?;
        let existing: DebtAccountDto = conn
            .query_row(
                r#"SELECT id, name, type, principal, interest_rate, min_monthly_payment, due_day, current_balance
                   FROM "DebtAccount" WHERE id = ?1 AND user_id = ?2"#,
                params![input.id, self.user_id],
                |row| {
                    Ok(DebtAccountDto {
                        id: row.get(0)?,
                        name: row.get(1)?,
                        r#type: row.get(2)?,
                        principal: row.get(3)?,
                        interest_rate: row.get(4)?,
                        min_monthly_payment: row.get(5)?,
                        due_day: row.get(6)?,
                        current_balance: row.get(7)?,
                    })
                },
            )
            .optional()
            .map_err(|e| PlanningError::Database(e.to_string()))?
            .ok_or_else(|| PlanningError::Validation("debt not found".into()))?;

        let updated = DebtAccountDto {
            id: existing.id.clone(),
            name: input.name.unwrap_or(existing.name),
            r#type: input.r#type.unwrap_or(existing.r#type),
            principal: input.principal.unwrap_or(existing.principal),
            interest_rate: input.interest_rate.unwrap_or(existing.interest_rate),
            min_monthly_payment: input.min_monthly_payment.unwrap_or(existing.min_monthly_payment),
            due_day: input.due_day.unwrap_or(existing.due_day),
            current_balance: input.current_balance.unwrap_or(existing.current_balance),
        };

        conn.execute(
            r#"UPDATE "DebtAccount"
               SET name = ?1, type = ?2, principal = ?3, interest_rate = ?4,
                   min_monthly_payment = ?5, due_day = ?6, current_balance = ?7
               WHERE id = ?8 AND user_id = ?9"#,
            params![
                updated.name,
                updated.r#type,
                updated.principal,
                updated.interest_rate,
                updated.min_monthly_payment,
                updated.due_day,
                updated.current_balance,
                updated.id,
                self.user_id
            ],
        )
        .map_err(|e| PlanningError::Database(e.to_string()))?;

        Ok(updated)
    }

    pub fn delete_debt(&self, input: DeleteDebtAccountInput) -> PlanningResult<()> {
        let conn = self.conn()?;
        conn.execute(
            r#"DELETE FROM "DebtAccount" WHERE id = ?1 AND user_id = ?2"#,
            params![input.id, self.user_id],
        )
        .map_err(|e| PlanningError::Database(e.to_string()))?;
        Ok(())
    }

    pub fn generate_debt_schedule(
        &self,
        input: GenerateDebtScheduleInput,
    ) -> PlanningResult<Vec<DebtScheduleDto>> {
        let conn = self.conn()?;
        let debt: DebtAccountDto = conn
            .query_row(
                r#"SELECT id, name, type, principal, interest_rate, min_monthly_payment, due_day, current_balance
                   FROM "DebtAccount" WHERE id = ?1 AND user_id = ?2"#,
                params![input.debt_account_id, self.user_id],
                |row| {
                    Ok(DebtAccountDto {
                        id: row.get(0)?,
                        name: row.get(1)?,
                        r#type: row.get(2)?,
                        principal: row.get(3)?,
                        interest_rate: row.get(4)?,
                        min_monthly_payment: row.get(5)?,
                        due_day: row.get(6)?,
                        current_balance: row.get(7)?,
                    })
                },
            )
            .optional()
            .map_err(|e| PlanningError::Database(e.to_string()))?
            .ok_or_else(|| PlanningError::Validation("debt not found".into()))?;

        let months = input.months.unwrap_or(6);
        let mut schedules = Vec::new();
        let mut balance = debt.current_balance;
        let rate = debt.interest_rate / 12.0 / 100.0;

        let today = chrono::Utc::now().date_naive();
        let mut cursor_month = if today.day() > debt.due_day as u32 {
            next_month(&format!("{}-{:02}-01", today.year(), today.month()))
                .and_then(|s| chrono::NaiveDate::parse_from_str(&s, "%Y-%m-%d").ok())
                .unwrap_or(today)
        } else {
            chrono::NaiveDate::from_ymd_opt(today.year(), today.month(), 1).unwrap_or(today)
        };

        for _ in 0..months {
            let due_date = chrono::NaiveDate::from_ymd_opt(
                cursor_month.year(),
                cursor_month.month(),
                debt.due_day as u32,
            )
            .unwrap_or(cursor_month);
            // skip if schedule already exists
            let existing: Option<String> = conn
                .query_row(
                    r#"SELECT id FROM "DebtPaymentSchedule" WHERE debt_account_id = ?1 AND due_date = ?2"#,
                    params![debt.id, due_date.to_string()],
                    |row| row.get(0),
                )
                .optional()
                .map_err(|e| PlanningError::Database(e.to_string()))?;
            if existing.is_some() {
                cursor_month =
                    chrono::NaiveDate::from_ymd_opt(cursor_month.year(), cursor_month.month(), 1)
                        .unwrap_or(cursor_month)
                        .with_month(cursor_month.month() + 1)
                        .unwrap_or(cursor_month);
                continue;
            }

            let planned_interest = (balance * rate).max(0.0);
            let planned_payment = debt.min_monthly_payment;
            let planned_principal = (planned_payment - planned_interest).max(0.0);
            balance = (balance - planned_principal).max(0.0);

            let id = Uuid::new_v4().to_string();
            conn.execute(
                r#"INSERT INTO "DebtPaymentSchedule"
                   (id, debt_account_id, due_date, planned_payment, planned_interest, planned_principal, is_paid)
                   VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0)"#,
                params![
                    id,
                    debt.id,
                    due_date.to_string(),
                    planned_payment,
                    planned_interest,
                    planned_principal
                ],
            )
            .map_err(|e| PlanningError::Database(e.to_string()))?;

            // add reminder for the due date
            let _ = conn.execute(
                r#"INSERT INTO "Reminder"
                   (id, user_id, title, description, account_id, amount_cents, due_at, recurrence_rule, next_fire_at, channel, status)
                   VALUES (?1, ?2, ?3, ?4, NULL, ?5, ?6, NULL, ?6, 'toast', 'scheduled')"#,
                params![
                    Uuid::new_v4().to_string(),
                    self.user_id,
                    format!("Платеж по долгу: {}", debt.name),
                    format!("Оплата до {}", due_date),
                    (planned_payment * 100.0).round() as i64,
                    chrono::NaiveDateTime::new(due_date, chrono::NaiveTime::from_hms_opt(9, 0, 0).unwrap()).format("%Y-%m-%dT%H:%M:%SZ").to_string()
                ],
            );

            schedules.push(DebtScheduleDto {
                id,
                debt_account_id: debt.id.clone(),
                due_date: due_date.to_string(),
                planned_payment,
                planned_interest,
                planned_principal,
                is_paid: false,
            });

            cursor_month = next_month(&format!("{}-{:02}-01", cursor_month.year(), cursor_month.month()))
                .and_then(|s| chrono::NaiveDate::parse_from_str(&s, "%Y-%m-%d").ok())
                .unwrap_or(cursor_month);
        }

        Ok(schedules)
    }

    pub fn list_schedules(&self, debt_id: &str) -> PlanningResult<Vec<DebtScheduleDto>> {
        let conn = self.conn()?;
        let mut stmt = conn
            .prepare(
                r#"SELECT id, debt_account_id, due_date, planned_payment, planned_interest, planned_principal, is_paid
                   FROM "DebtPaymentSchedule" WHERE debt_account_id = ?1 ORDER BY due_date ASC"#,
            )
            .map_err(|e| PlanningError::Database(e.to_string()))?;
        let mapped = stmt
            .query_map(params![debt_id], |row| {
                Ok(DebtScheduleDto {
                    id: row.get(0)?,
                    debt_account_id: row.get(1)?,
                    due_date: row.get(2)?,
                    planned_payment: row.get(3)?,
                    planned_interest: row.get(4)?,
                    planned_principal: row.get(5)?,
                    is_paid: row.get::<_, i32>(6)? == 1,
                })
            })
            .map_err(|e| PlanningError::Database(e.to_string()))?;
        let mut items = Vec::new();
        for s in mapped {
            items.push(s.map_err(|err| PlanningError::Database(err.to_string()))?);
        }
        Ok(items)
    }

    pub fn confirm_debt_payment(
        &self,
        input: ConfirmDebtPaymentInput,
    ) -> PlanningResult<DebtScheduleDto> {
        let conn = self.conn()?;
        self.ensure_user_exists(&conn)?;
        let schedule: DebtScheduleDto = conn
            .query_row(
                r#"SELECT id, debt_account_id, due_date, planned_payment, planned_interest, planned_principal, is_paid
                   FROM "DebtPaymentSchedule" WHERE id = ?1"#,
                params![input.schedule_id],
                |row| {
                    Ok(DebtScheduleDto {
                        id: row.get(0)?,
                        debt_account_id: row.get(1)?,
                        due_date: row.get(2)?,
                        planned_payment: row.get(3)?,
                        planned_interest: row.get(4)?,
                        planned_principal: row.get(5)?,
                        is_paid: row.get::<_, i32>(6)? == 1,
                    })
                },
            )
            .optional()
            .map_err(|e| PlanningError::Database(e.to_string()))?
            .ok_or_else(|| PlanningError::Validation("schedule not found".into()))?;

        conn.execute(
            r#"UPDATE "DebtPaymentSchedule" SET is_paid = 1 WHERE id = ?1"#,
            params![input.schedule_id],
        )
        .map_err(|e| PlanningError::Database(e.to_string()))?;

        if let Some(account_id) = input.account_id.clone() {
            let txn_id = Uuid::new_v4().to_string();
            let amount_cents = (schedule.planned_payment * 100.0).round() as i64;
            let due_date = chrono::NaiveDate::parse_from_str(&schedule.due_date, "%Y-%m-%d")
                .unwrap_or_else(|_| chrono::Utc::now().date_naive());
            let _ = conn.execute(
                r#"INSERT INTO "Transaction" (id, user_id, account_id, category_id, type, amount_cents, currency, occurred_on, cleared)
                   VALUES (?1, ?2, ?3, ?4, 'expense', ?5, 'GBP', ?6, 1)"#,
                params![txn_id, self.user_id, account_id, input.category_id, amount_cents, due_date],
            );
            let _ = conn.execute(
                r#"UPDATE "DebtPaymentSchedule" SET transaction_id = ?1 WHERE id = ?2"#,
                params![txn_id, schedule.id],
            );
        }

        Ok(DebtScheduleDto { is_paid: true, ..schedule })
    }

    pub fn plan_vs_actual(&self, plan_id: &str) -> PlanningResult<PlanActualSummary> {
        let conn = self.conn()?;
        let plan: Option<(String, f64, f64)> = conn
            .query_row(
                r#"SELECT month, total_planned_income, total_planned_expenses FROM "MonthlyPlan" WHERE id = ?1 AND user_id = ?2"#,
                params![plan_id, self.user_id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .optional()
            .map_err(|e| PlanningError::Database(e.to_string()))?;

        let (month, planned_income, planned_expense) =
            plan.ok_or_else(|| PlanningError::Validation("plan not found".into()))?;

        // sum planned incomes/expenses for completeness
        let planned_income_detail: f64 = conn
            .query_row(
                r#"SELECT COALESCE(SUM(expected_amount),0) FROM "PlannedIncome" WHERE user_id = ?1 AND monthly_plan_id = ?2"#,
                params![self.user_id, plan_id],
                |row| row.get(0),
            )
            .unwrap_or(planned_income);
        let planned_expense_detail: f64 = conn
            .query_row(
                r#"SELECT COALESCE(SUM(expected_amount),0) FROM "PlannedExpense" WHERE user_id = ?1 AND monthly_plan_id = ?2"#,
                params![self.user_id, plan_id],
                |row| row.get(0),
            )
            .unwrap_or(planned_expense);
        let planned_savings: f64 = conn
            .query_row(
                r#"SELECT COALESCE(SUM(expected_amount),0) FROM "PlannedSaving" WHERE user_id = ?1 AND monthly_plan_id = ?2"#,
                params![self.user_id, plan_id],
                |row| row.get(0),
            )
            .unwrap_or(0.0);

        // Actuals from transaction table by month boundaries
        let start = month.clone();
        let end = next_month(&month)
            .ok_or_else(|| PlanningError::Validation("invalid month".into()))?;

        let actual_income: f64 = conn
            .query_row(
                r#"SELECT COALESCE(SUM(amount_cents)/100.0,0) FROM transaction
                   WHERE user_id = ?1 AND type = 'income' AND occurred_on >= ?2 AND occurred_on < ?3"#,
                params![self.user_id, start, end],
                |row| row.get(0),
            )
            .unwrap_or(0.0);
        let actual_expense: f64 = conn
            .query_row(
                r#"SELECT COALESCE(SUM(amount_cents)/100.0,0) FROM transaction
                   WHERE user_id = ?1 AND type = 'expense' AND occurred_on >= ?2 AND occurred_on < ?3"#,
                params![self.user_id, start, end],
                |row| row.get(0),
            )
            .unwrap_or(0.0);
        let actual_savings: f64 = conn
            .query_row(
                r#"SELECT COALESCE(SUM(actual_amount),0) FROM "PlannedSaving" WHERE user_id = ?1 AND monthly_plan_id = ?2"#,
                params![self.user_id, plan_id],
                |row| row.get(0),
            )
            .unwrap_or(0.0);

        Ok(PlanActualSummary {
            plan_id: plan_id.to_string(),
            planned_income: planned_income_detail,
            actual_income,
            planned_expenses: planned_expense_detail,
            actual_expenses: actual_expense,
            planned_savings,
            actual_savings,
        })
    }
}

fn next_month(month_str: &str) -> Option<String> {
    let date = chrono::NaiveDate::parse_from_str(month_str, "%Y-%m-%d").ok()?;
    let (y, m) = (date.year(), date.month());
    let next = if m == 12 {
        chrono::NaiveDate::from_ymd_opt(y + 1, 1, 1)?
    } else {
        chrono::NaiveDate::from_ymd_opt(y, m + 1, 1)?
    };
    Some(next.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;
    use std::env;

    fn service() -> PlanningService {
        let path_buf = env::temp_dir().join(format!("planning-{}.db", Uuid::new_v4()));
        {
            let conn = Connection::open(&path_buf).unwrap();
            conn.execute_batch(
                r#"
                CREATE TABLE "MonthlyPlan"(id TEXT PRIMARY KEY, user_id TEXT, month TEXT, total_planned_income REAL, total_planned_expenses REAL, total_planned_savings REAL, note TEXT);
                CREATE TABLE "PlannedIncome"(id TEXT PRIMARY KEY, user_id TEXT, monthly_plan_id TEXT, source_name TEXT, type TEXT, is_fixed INTEGER, expected_date TEXT, expected_amount REAL, actual_amount REAL, account_id TEXT, status TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
                CREATE TABLE "PlannedExpense"(id TEXT PRIMARY KEY, user_id TEXT, monthly_plan_id TEXT, category_id TEXT, label TEXT, expected_amount REAL, actual_amount REAL, frequency TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
                CREATE TABLE "PlannedSaving"(id TEXT PRIMARY KEY, user_id TEXT, monthly_plan_id TEXT, goal_id TEXT, expected_amount REAL, actual_amount REAL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
                CREATE TABLE "DebtPaymentSchedule"(id TEXT PRIMARY KEY, debt_account_id TEXT, due_date TEXT, planned_payment REAL, planned_interest REAL, planned_principal REAL, is_paid INTEGER DEFAULT 0, transaction_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
                "#,
            )
            .unwrap();
        }
        PlanningService::new(path_buf, None, "seed-user".to_string()).unwrap()
    }

    #[test]
    fn creates_plan_and_income() {
        let svc = service();
        let plan = svc
            .create_monthly_plan(CreateMonthlyPlanInput {
                month: "2025-12-01".into(),
                total_planned_income: Some(1000.0),
                total_planned_expenses: Some(800.0),
                total_planned_savings: Some(200.0),
                note: None,
            })
            .unwrap();
        assert_eq!(plan.month, "2025-12-01");
        let income = svc
            .add_planned_income(AddPlannedIncomeInput {
                monthly_plan_id: plan.id.clone(),
                source_name: "Salary".into(),
                r#type: "salary".into(),
                expected_amount: 1000.0,
                expected_date: Some("2025-12-05".into()),
                is_fixed: Some(true),
                account_id: None,
            })
            .unwrap();
        assert_eq!(income.expected_amount, 1000.0);

        let list = svc.list_monthly_plans().unwrap();
        assert_eq!(list.len(), 1);

        let exp = svc
            .add_planned_expense(AddPlannedExpenseInput {
                monthly_plan_id: plan.id.clone(),
                label: "Groceries".into(),
                category_id: None,
                expected_amount: 200.0,
                frequency: Some("monthly".into()),
            })
            .unwrap();
        assert_eq!(exp.expected_amount, 200.0);
        let incomes = svc.list_incomes(&plan.id).unwrap();
        assert_eq!(incomes.len(), 1);
        let expenses = svc.list_expenses(&plan.id).unwrap();
        assert_eq!(expenses.len(), 1);
    }
}
