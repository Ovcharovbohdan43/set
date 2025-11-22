use std::path::PathBuf;

use chrono::{DateTime, Utc};
use rusqlite::{params, params_from_iter, Connection, ToSql};
use uuid::Uuid;

use crate::services::ServiceDescriptor;

use super::{
    BudgetDto, BudgetEntryDto, BudgetPeriod, BudgetResult, BudgetService, BudgetServiceError,
    BudgetStatus, BudgetType, CreateBudgetInput, RecordSnapshotInput, UpdateBudgetInput,
};

const DEFAULT_USER_ID: &str = "seed-user";

pub struct SqliteBudgetService {
    db_path: PathBuf,
    db_key: Option<String>,
    user_id: String,
}

impl SqliteBudgetService {
    pub fn new(
        db_path: PathBuf,
        db_key: Option<String>,
        user_id: Option<String>,
    ) -> BudgetResult<Self> {
        let service = Self {
            db_path,
            db_key,
            user_id: user_id.unwrap_or_else(|| DEFAULT_USER_ID.to_string()),
        };
        Ok(service)
    }

    fn connection(&self) -> BudgetResult<Connection> {
        let conn = Connection::open(&self.db_path)
            .map_err(|err| BudgetServiceError::Database(err.to_string()))?;

        if let Err(err) = conn.execute("PRAGMA foreign_keys = ON;", []) {
            return Err(BudgetServiceError::Database(err.to_string()));
        }

        if let Some(key) = &self.db_key {
            if let Err(err) = conn.pragma_update(None, "key", key) {
                tracing::warn!(error = %err, "Failed to apply SQLCipher key; continuing without encryption");
            }
        }

        Ok(conn)
    }

    fn calculate_spent(&self, conn: &Connection, budget_id: &str) -> BudgetResult<i64> {
        let budget = self.fetch_budget_row(conn, budget_id)?;
        let categories = parse_categories(budget.category_id.clone());

        let spent: i64 = if categories.is_empty() {
            conn.query_row(
                r#"
                SELECT COALESCE(SUM(amount_cents), 0)
                FROM "Transaction"
                WHERE user_id = ? 
                  AND type = 'expense'
                  AND occurred_on >= ? 
                  AND occurred_on < ?
                "#,
                params![self.user_id, budget.start_date, budget.end_date],
                |row| row.get(0),
            )
            .unwrap_or(0)
        } else {
            let placeholders = format!("({})", std::iter::repeat("?").take(categories.len()).collect::<Vec<_>>().join(","));
            let sql = format!(
                r#"
                SELECT COALESCE(SUM(amount_cents), 0)
                FROM "Transaction"
                WHERE user_id = ? 
                  AND type = 'expense'
                  AND occurred_on >= ? 
                  AND occurred_on < ?
                  AND category_id IN {}
                "#,
                placeholders
            );

            let mut params: Vec<Box<dyn ToSql>> =
                vec![Box::new(self.user_id.clone()), Box::new(budget.start_date.clone()), Box::new(budget.end_date.clone())];
            for cat in categories {
                params.push(Box::new(cat));
            }
            let sqlite_params = params_from_iter(params.iter().map(|p| &**p));
            conn.query_row(&sql, sqlite_params, |row| row.get(0))
                .unwrap_or(0)
        };

        Ok(spent)
    }

    fn calculate_progress(
        &self,
        amount_cents: i64,
        spent_cents: i64,
        alert_threshold: f64,
    ) -> (f64, BudgetStatus) {
        if amount_cents <= 0 {
            return (0.0, BudgetStatus::Normal);
        }

        let raw_progress = (spent_cents as f64 / amount_cents as f64) * 100.0;
        let progress = raw_progress.clamp(0.0, 100.0);
        let threshold_percent = alert_threshold * 100.0;

        let status = if progress >= 100.0 {
            BudgetStatus::Over
        } else if progress >= threshold_percent {
            BudgetStatus::AtRisk
        } else {
            BudgetStatus::Normal
        };

        (progress, status)
    }

    fn fetch_budget_row(&self, conn: &Connection, id: &str) -> BudgetResult<BudgetRow> {
        let row = conn
            .query_row(
                r#"
                SELECT 
                    b.id,
                    b.user_id,
                    b.name,
                    b.period,
                    b.type,
                    b.category_id,
                    c.name as category_name,
                    b.amount_cents,
                    b.start_date,
                    b.end_date,
                    b.rollover,
                    b.alert_threshold,
                    b.created_at
                FROM "Budget" b
                LEFT JOIN "Category" c ON b.category_id = c.id
                WHERE b.id = ? AND b.user_id = ?
                "#,
                params![id, self.user_id],
                |row| {
                    Ok(BudgetRow {
                        id: row.get(0)?,
                        user_id: row.get(1)?,
                        name: row.get(2)?,
                        period: row.get(3)?,
                        budget_type: row.get(4)?,
                        category_id: row.get(5)?,
                        category_name: row.get(6)?,
                        amount_cents: row.get(7)?,
                        start_date: row.get(8)?,
                        end_date: row.get(9)?,
                        rollover: row.get(10)?,
                        alert_threshold: row.get(11)?,
                        created_at: row.get(12)?,
                    })
                },
            )
            .map_err(|err| {
                if let rusqlite::Error::QueryReturnedNoRows = err {
                    BudgetServiceError::NotFound(format!("Budget {} not found", id))
                } else {
                    BudgetServiceError::Database(err.to_string())
                }
            })?;

        Ok(row)
    }

    fn row_to_dto(&self, conn: &Connection, row: BudgetRow) -> BudgetResult<BudgetDto> {
        let spent = self.calculate_spent(conn, &row.id)?;
        let remaining = (row.amount_cents - spent).max(0);
        let (progress_percent, status) =
            self.calculate_progress(row.amount_cents, spent, row.alert_threshold);

        let period = match row.period.as_str() {
            "weekly" => BudgetPeriod::Weekly,
            "monthly" => BudgetPeriod::Monthly,
            "quarterly" => BudgetPeriod::Quarterly,
            "yearly" => BudgetPeriod::Yearly,
            _ => return Err(BudgetServiceError::Validation("Invalid period".to_string())),
        };

        let budget_type = match row.budget_type.as_str() {
            "envelope" => BudgetType::Envelope,
            "overall" => BudgetType::Overall,
            _ => {
                return Err(BudgetServiceError::Validation(
                    "Invalid budget type".to_string(),
                ))
            }
        };

        Ok(BudgetDto {
            id: row.id,
            user_id: row.user_id,
            name: row.name,
            period,
            budget_type,
            category_id: row.category_id,
            category_name: row.category_name,
            amount_cents: row.amount_cents,
            start_date: row.start_date,
            end_date: row.end_date,
            rollover: row.rollover,
            alert_threshold: row.alert_threshold,
            spent_cents: spent,
            remaining_cents: remaining,
            progress_percent,
            status,
            created_at: row.created_at,
        })
    }
}

struct BudgetRow {
    id: String,
    user_id: String,
    name: String,
    period: String,
    budget_type: String,
    category_id: Option<String>,
    category_name: Option<String>,
    amount_cents: i64,
    start_date: String,
    end_date: String,
    rollover: bool,
    alert_threshold: f64,
    created_at: String,
}

impl BudgetService for SqliteBudgetService {
    fn descriptor(&self) -> ServiceDescriptor {
        ServiceDescriptor::new("BudgetService", "sqlite")
    }

    fn list_budgets(&self) -> BudgetResult<Vec<BudgetDto>> {
        let conn = self.connection()?;

        let mut stmt = conn
            .prepare(
                r#"
                SELECT 
                    b.id,
                    b.user_id,
                    b.name,
                    b.period,
                    b.type,
                    b.category_id,
                    c.name as category_name,
                    b.amount_cents,
                    b.start_date,
                    b.end_date,
                    b.rollover,
                    b.alert_threshold,
                    b.created_at
                FROM "Budget" b
                LEFT JOIN "Category" c ON b.category_id = c.id
                WHERE b.user_id = ?
                ORDER BY b.created_at DESC
                "#,
            )
            .map_err(|err| BudgetServiceError::Database(err.to_string()))?;

        let rows = stmt
            .query_map(params![self.user_id], |row| {
                Ok(BudgetRow {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    name: row.get(2)?,
                    period: row.get(3)?,
                    budget_type: row.get(4)?,
                    category_id: row.get(5)?,
                    category_name: row.get(6)?,
                    amount_cents: row.get(7)?,
                    start_date: row.get(8)?,
                    end_date: row.get(9)?,
                    rollover: row.get(10)?,
                    alert_threshold: row.get(11)?,
                    created_at: row.get(12)?,
                })
            })
            .map_err(|err| BudgetServiceError::Database(err.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|err| BudgetServiceError::Database(err.to_string()))?;

        drop(stmt);

        let mut budgets = Vec::new();
        for row in rows {
            budgets.push(self.row_to_dto(&conn, row)?);
        }

        Ok(budgets)
    }

    fn get_budget(&self, id: &str) -> BudgetResult<BudgetDto> {
        let conn = self.connection()?;
        let row = self.fetch_budget_row(&conn, id)?;
        self.row_to_dto(&conn, row)
    }

    fn create_budget(&self, input: CreateBudgetInput) -> BudgetResult<BudgetDto> {
        if input.amount_cents < 0 {
            return Err(BudgetServiceError::Validation(
                "Amount must be non-negative".to_string(),
            ));
        }

        if input.alert_threshold.is_some()
            && (input.alert_threshold.unwrap() < 0.0 || input.alert_threshold.unwrap() > 1.0)
        {
            return Err(BudgetServiceError::Validation(
                "Alert threshold must be between 0 and 1".to_string(),
            ));
        }

        let start_date = DateTime::parse_from_rfc3339(&input.start_date)
            .map_err(|err| BudgetServiceError::Validation(format!("Invalid start_date: {}", err)))?
            .with_timezone(&Utc);

        let end_date = DateTime::parse_from_rfc3339(&input.end_date)
            .map_err(|err| BudgetServiceError::Validation(format!("Invalid end_date: {}", err)))?
            .with_timezone(&Utc);

        if end_date <= start_date {
            return Err(BudgetServiceError::Validation(
                "end_date must be after start_date".to_string(),
            ));
        }

        let conn = self.connection()?;
        let id = Uuid::new_v4().to_string();
        let alert_threshold = input.alert_threshold.unwrap_or(0.8);

        conn.execute(
            r#"
            INSERT INTO "Budget" (
                id, user_id, name, period, type, category_id, amount_cents,
                start_date, end_date, rollover, alert_threshold, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            "#,
            params![
                id,
                self.user_id,
                input.name,
                input.period.as_str(),
                input.budget_type.as_str(),
                input.category_id,
                input.amount_cents,
                input.start_date,
                input.end_date,
                input.rollover,
                alert_threshold
            ],
        )
        .map_err(|err| BudgetServiceError::Database(err.to_string()))?;

        self.get_budget(&id)
    }

    fn update_budget(&self, input: UpdateBudgetInput) -> BudgetResult<BudgetDto> {
        let conn = self.connection()?;
        let existing = self.fetch_budget_row(&conn, &input.id)?;

        let name = input.name.unwrap_or(existing.name);
        let period = input
            .period
            .map(|p| p.as_str().to_string())
            .unwrap_or(existing.period);
        let budget_type = input
            .budget_type
            .map(|t| t.as_str().to_string())
            .unwrap_or(existing.budget_type);
        let category_id = input.category_id.or(existing.category_id);
        let amount_cents = input.amount_cents.unwrap_or(existing.amount_cents);
        let start_date = input.start_date.unwrap_or(existing.start_date);
        let end_date = input.end_date.unwrap_or(existing.end_date);
        let rollover = input.rollover.unwrap_or(existing.rollover);
        let alert_threshold = input.alert_threshold.unwrap_or(existing.alert_threshold);

        if amount_cents < 0 {
            return Err(BudgetServiceError::Validation(
                "Amount must be non-negative".to_string(),
            ));
        }

        if !(0.0..=1.0).contains(&alert_threshold) {
            return Err(BudgetServiceError::Validation(
                "Alert threshold must be between 0 and 1".to_string(),
            ));
        }

        conn.execute(
            r#"
            UPDATE "Budget"
            SET name = ?, period = ?, type = ?, category_id = ?, amount_cents = ?,
                start_date = ?, end_date = ?, rollover = ?, alert_threshold = ?
            WHERE id = ? AND user_id = ?
            "#,
            params![
                name,
                period,
                budget_type,
                category_id,
                amount_cents,
                start_date,
                end_date,
                rollover,
                alert_threshold,
                input.id,
                self.user_id
            ],
        )
        .map_err(|err| BudgetServiceError::Database(err.to_string()))?;

        self.get_budget(&input.id)
    }

    fn delete_budget(&self, id: &str) -> BudgetResult<()> {
        let conn = self.connection()?;

        let rows_affected = conn
            .execute(
                "DELETE FROM \"Budget\" WHERE id = ? AND user_id = ?",
                params![id, self.user_id],
            )
            .map_err(|err| BudgetServiceError::Database(err.to_string()))?;

        if rows_affected == 0 {
            return Err(BudgetServiceError::NotFound(format!(
                "Budget {} not found",
                id
            )));
        }

        Ok(())
    }

    fn record_snapshot(&self, input: RecordSnapshotInput) -> BudgetResult<BudgetEntryDto> {
        let conn = self.connection()?;

        // Verify budget exists
        self.fetch_budget_row(&conn, &input.budget_id)?;

        let id = Uuid::new_v4().to_string();

        conn.execute(
            r#"
            INSERT INTO "BudgetEntry" (id, budget_id, actual_cents, projected_cents, snapshot_date, created_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(budget_id, snapshot_date) DO UPDATE SET
                actual_cents = excluded.actual_cents,
                projected_cents = excluded.projected_cents
            "#,
            params![
                id,
                input.budget_id,
                input.actual_cents,
                input.projected_cents,
                input.snapshot_date
            ],
        )
        .map_err(|err| BudgetServiceError::Database(err.to_string()))?;

        let entry = conn
            .query_row(
                r#"
                SELECT id, budget_id, actual_cents, projected_cents, snapshot_date, created_at
                FROM "BudgetEntry"
                WHERE budget_id = ? AND snapshot_date = ?
                "#,
                params![input.budget_id, input.snapshot_date],
                |row| {
                    Ok(BudgetEntryDto {
                        id: row.get(0)?,
                        budget_id: row.get(1)?,
                        actual_cents: row.get(2)?,
                        projected_cents: row.get(3)?,
                        snapshot_date: row.get(4)?,
                        created_at: row.get(5)?,
                    })
                },
            )
            .map_err(|err| BudgetServiceError::Database(err.to_string()))?;

        Ok(entry)
    }

    fn calculate_budget_progress(
        &self,
        budget_id: &str,
    ) -> BudgetResult<(i64, i64, f64, BudgetStatus)> {
        let conn = self.connection()?;
        let budget = self.fetch_budget_row(&conn, budget_id)?;
        let spent = self.calculate_spent(&conn, budget_id)?;
        let remaining = (budget.amount_cents - spent).max(0);
        let (progress_percent, status) =
            self.calculate_progress(budget.amount_cents, spent, budget.alert_threshold);

        Ok((spent, remaining, progress_percent, status))
    }
}

fn parse_categories(value: Option<String>) -> Vec<String> {
    value
        .unwrap_or_default()
        .split(',')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_progress_normal() {
        let service = SqliteBudgetService {
            db_path: PathBuf::from(":memory:"),
            db_key: None,
            user_id: "test".to_string(),
        };

        let (progress, status) = service.calculate_progress(10000, 5000, 0.8);
        assert_eq!(progress, 50.0);
        assert_eq!(status, BudgetStatus::Normal);
    }

    #[test]
    fn test_calculate_progress_at_risk() {
        let service = SqliteBudgetService {
            db_path: PathBuf::from(":memory:"),
            db_key: None,
            user_id: "test".to_string(),
        };

        let (progress, status) = service.calculate_progress(10000, 8500, 0.8);
        assert_eq!(progress, 85.0);
        assert_eq!(status, BudgetStatus::AtRisk);
    }

    #[test]
    fn test_calculate_progress_over() {
        let service = SqliteBudgetService {
            db_path: PathBuf::from(":memory:"),
            db_key: None,
            user_id: "test".to_string(),
        };

        let (progress, status) = service.calculate_progress(10000, 11000, 0.8);
        assert!((progress - 110.0).abs() < 0.01);
        assert_eq!(status, BudgetStatus::Over);
    }

    #[test]
    fn test_calculate_progress_zero_target() {
        let service = SqliteBudgetService {
            db_path: PathBuf::from(":memory:"),
            db_key: None,
            user_id: "test".to_string(),
        };

        let (progress, status) = service.calculate_progress(0, 1000, 0.8);
        assert_eq!(progress, 0.0);
        assert_eq!(status, BudgetStatus::Normal);
    }
}
