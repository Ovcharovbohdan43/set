use std::path::PathBuf;

use chrono::{DateTime, Datelike, NaiveDate, Utc};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::services::ServiceDescriptor;

const DEFAULT_USER_ID: &str = "seed-user";
const CACHE_TTL_MINUTES: i64 = 30;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MonthlyReportDto {
    pub month: String,
    pub spending_by_category: Vec<CategorySpending>,
    pub trend_line: Vec<TrendPoint>,
    pub income_vs_expense: IncomeVsExpense,
    pub budget_summaries: Vec<BudgetSummary>,
    pub forecast: Option<Forecast>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CategorySpending {
    pub category_id: Option<String>,
    pub category_name: String,
    pub amount_cents: i64,
    pub percentage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrendPoint {
    pub date: String,
    pub income_cents: i64,
    pub expense_cents: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IncomeVsExpense {
    pub income_cents: i64,
    pub expense_cents: i64,
    pub net_cents: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BudgetSummary {
    pub budget_id: String,
    pub budget_name: String,
    pub target_cents: i64,
    pub spent_cents: i64,
    pub progress_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Forecast {
    pub next_month_income: i64,
    pub next_month_expense: i64,
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpendingByCategoryDto {
    pub category_id: Option<String>,
    pub category_name: String,
    pub amount_cents: i64,
    pub percentage: f64,
    pub transaction_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MonthlyTrendDto {
    pub month: String,
    pub income_cents: i64,
    pub expense_cents: i64,
    pub net_cents: i64,
}

#[derive(Debug, Error)]
pub enum ReportServiceError {
    #[error("database error: {0}")]
    Database(String),
    #[error("internal error: {0}")]
    Internal(String),
    #[error("cache error: {0}")]
    Cache(String),
}

pub type ReportResult<T> = Result<T, ReportServiceError>;

impl From<rusqlite::Error> for ReportServiceError {
    fn from(value: rusqlite::Error) -> Self {
        ReportServiceError::Database(value.to_string())
    }
}

pub trait ReportService: Send + Sync {
    fn descriptor(&self) -> ServiceDescriptor;
    fn get_monthly_report(&self, month: &str) -> ReportResult<MonthlyReportDto>;
    fn get_spending_by_category(
        &self,
        start_date: &str,
        end_date: &str,
    ) -> ReportResult<Vec<SpendingByCategoryDto>>;
    fn get_monthly_trend(
        &self,
        months: i32,
    ) -> ReportResult<Vec<MonthlyTrendDto>>;
    fn invalidate_cache(&self, key_prefix: Option<&str>) -> ReportResult<()>;
}

pub struct SqliteReportService {
    db_path: PathBuf,
    db_key: Option<String>,
    user_id: String,
}

impl SqliteReportService {
    pub fn new(
        db_path: PathBuf,
        db_key: Option<String>,
        user_id: Option<String>,
    ) -> ReportResult<Self> {
        Ok(Self {
            db_path,
            db_key,
            user_id: user_id.unwrap_or_else(|| DEFAULT_USER_ID.to_string()),
        })
    }

    fn connection(&self) -> ReportResult<Connection> {
        let conn = Connection::open(&self.db_path)?;
        conn.execute("PRAGMA foreign_keys = ON;", [])?;
        if let Some(key) = &self.db_key {
            if let Err(err) = conn.pragma_update(None, "key", key) {
                tracing::warn!(error = %err, "Failed to apply SQLCipher key for report service");
            }
        }
        Ok(conn)
    }

    fn get_cache_key(&self, report_type: &str, params: &str) -> String {
        format!("{}:{}:{}", report_type, self.user_id, params)
    }

    fn get_cached<T: for<'de> Deserialize<'de>>(
        &self,
        conn: &Connection,
        key: &str,
    ) -> ReportResult<Option<T>> {
        let now = Utc::now();
        let row: Option<(String, DateTime<Utc>)> = conn
            .query_row(
                r#"
                SELECT payload, expires_at
                FROM "ReportCache"
                WHERE user_id = ? AND key = ? AND expires_at > ?
                "#,
                params![self.user_id, key, now],
                |row| {
                    Ok((
                        row.get::<_, String>(0)?,
                        row.get::<_, DateTime<Utc>>(1)?,
                    ))
                },
            )
            .optional()?;

        if let Some((payload, _)) = row {
            let value: T = serde_json::from_str(&payload)
                .map_err(|e| ReportServiceError::Cache(format!("Failed to deserialize cache: {}", e)))?;
            Ok(Some(value))
        } else {
            Ok(None)
        }
    }

    fn set_cache<T: Serialize>(
        &self,
        conn: &Connection,
        key: &str,
        value: &T,
        ttl_minutes: i64,
    ) -> ReportResult<()> {
        let payload = serde_json::to_string(value)
            .map_err(|e| ReportServiceError::Cache(format!("Failed to serialize cache: {}", e)))?;
        let expires_at = Utc::now() + chrono::Duration::minutes(ttl_minutes);

        conn.execute(
            r#"
            INSERT OR REPLACE INTO "ReportCache" (id, user_id, key, payload, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            "#,
            params![
                uuid::Uuid::new_v4().to_string(),
                self.user_id,
                key,
                payload,
                expires_at,
                Utc::now()
            ],
        )?;
        Ok(())
    }

    fn spending_by_category(
        &self,
        conn: &Connection,
        start_date: &str,
        end_date: &str,
    ) -> ReportResult<Vec<SpendingByCategoryDto>> {
        let mut stmt = conn.prepare(
            r#"
            SELECT 
                t.category_id,
                COALESCE(c.name, 'Uncategorized') as category_name,
                SUM(t.amount_cents) as amount_cents,
                COUNT(*) as transaction_count
            FROM "Transaction" t
            LEFT JOIN "Category" c ON t.category_id = c.id
            WHERE t.user_id = ? 
              AND t.type = 'expense'
              AND DATE(t.occurred_on) >= ? 
              AND DATE(t.occurred_on) <= ?
            GROUP BY t.category_id, c.name
            ORDER BY amount_cents DESC
            "#,
        )?;

        let rows = stmt.query_map(
            params![self.user_id, start_date, end_date],
            |row| {
                Ok(SpendingByCategoryDto {
                    category_id: row.get(0)?,
                    category_name: row.get(1)?,
                    amount_cents: row.get(2)?,
                    percentage: 0.0, // Will calculate below
                    transaction_count: row.get(3)?,
                })
            },
        )?;

        let mut results: Vec<SpendingByCategoryDto> = rows
            .collect::<Result<Vec<_>, _>>()?;

        let total: i64 = results.iter().map(|r| r.amount_cents).sum();
        if total > 0 {
            for item in &mut results {
                item.percentage = (item.amount_cents as f64 / total as f64) * 100.0;
            }
        }

        Ok(results)
    }

    fn monthly_trend(
        &self,
        conn: &Connection,
        months: i32,
    ) -> ReportResult<Vec<MonthlyTrendDto>> {
        let start_date = Utc::now().date_naive() - chrono::Duration::days((months * 30) as i64);
        
        let mut stmt = conn.prepare(
            r#"
            SELECT 
                strftime('%Y-%m', occurred_on) as month,
                SUM(CASE WHEN type = 'income' THEN amount_cents ELSE 0 END) as income_cents,
                SUM(CASE WHEN type = 'expense' THEN amount_cents ELSE 0 END) as expense_cents
            FROM "Transaction"
            WHERE user_id = ? 
              AND DATE(occurred_on) >= ?
            GROUP BY strftime('%Y-%m', occurred_on)
            ORDER BY month ASC
            "#,
        )?;

        let rows = stmt.query_map(
            params![self.user_id, start_date],
            |row| {
                let income: i64 = row.get(1)?;
                let expense: i64 = row.get(2)?;
                Ok(MonthlyTrendDto {
                    month: row.get(0)?,
                    income_cents: income,
                    expense_cents: expense,
                    net_cents: income - expense,
                })
            },
        )?;

        Ok(rows.collect::<Result<Vec<_>, _>>()?)
    }

    fn calculate_forecast(
        &self,
        conn: &Connection,
    ) -> ReportResult<Option<Forecast>> {
        let trend = self.monthly_trend(conn, 3)?;
        
        if trend.len() < 2 {
            return Ok(None);
        }

        // Simple linear regression for next month forecast
        let recent = &trend[trend.len().saturating_sub(3)..];
        let avg_income: f64 = recent.iter().map(|t| t.income_cents as f64).sum::<f64>() / recent.len() as f64;
        let avg_expense: f64 = recent.iter().map(|t| t.expense_cents as f64).sum::<f64>() / recent.len() as f64;

        // Calculate confidence based on variance
        let income_variance: f64 = recent.iter()
            .map(|t| (t.income_cents as f64 - avg_income).powi(2))
            .sum::<f64>() / recent.len() as f64;
        let expense_variance: f64 = recent.iter()
            .map(|t| (t.expense_cents as f64 - avg_expense).powi(2))
            .sum::<f64>() / recent.len() as f64;
        
        let confidence = (1.0 - (income_variance + expense_variance) / (avg_income + avg_expense + 1.0)).max(0.0).min(1.0);

        Ok(Some(Forecast {
            next_month_income: avg_income as i64,
            next_month_expense: avg_expense as i64,
            confidence,
        }))
    }
}

trait OptionalRowExt<T> {
    fn optional(self) -> Result<Option<T>, rusqlite::Error>;
}

impl<T> OptionalRowExt<T> for Result<T, rusqlite::Error> {
    fn optional(self) -> Result<Option<T>, rusqlite::Error> {
        match self {
            Ok(value) => Ok(Some(value)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(other) => Err(other),
        }
    }
}

impl ReportService for SqliteReportService {
    fn descriptor(&self) -> ServiceDescriptor {
        ServiceDescriptor::new("ReportService", "sqlite")
    }

    fn get_monthly_report(&self, month: &str) -> ReportResult<MonthlyReportDto> {
        let conn = self.connection()?;
        let cache_key = self.get_cache_key("monthly_report", month);

        // Try cache first
        if let Some(cached) = self.get_cached::<MonthlyReportDto>(&conn, &cache_key)? {
            return Ok(cached);
        }

        // Parse month (YYYY-MM)
        let start_date = format!("{}-01", month);
        let end_date = NaiveDate::parse_from_str(&start_date, "%Y-%m-%d")
            .map_err(|e| ReportServiceError::Internal(format!("Invalid month format: {}", e)))?
            .with_day(1)
            .and_then(|d| d.checked_add_months(chrono::Months::new(1)))
            .and_then(|d| d.checked_sub_days(chrono::Days::new(1)))
            .ok_or_else(|| ReportServiceError::Internal("Failed to calculate end date".to_string()))?
            .format("%Y-%m-%d")
            .to_string();

        let spending = self.spending_by_category(&conn, &start_date, &end_date)?;
        let trend = self.monthly_trend(&conn, 12)?;
        let forecast = self.calculate_forecast(&conn)?;

        // Calculate income vs expense for the month
        let income: i64 = conn.query_row(
            r#"
            SELECT COALESCE(SUM(amount_cents), 0)
            FROM "Transaction"
            WHERE user_id = ? 
              AND type = 'income'
              AND strftime('%Y-%m', occurred_on) = ?
            "#,
            params![self.user_id, month],
            |row| row.get(0),
        )?;

        let expense: i64 = conn.query_row(
            r#"
            SELECT COALESCE(SUM(amount_cents), 0)
            FROM "Transaction"
            WHERE user_id = ? 
              AND type = 'expense'
              AND strftime('%Y-%m', occurred_on) = ?
            "#,
            params![self.user_id, month],
            |row| row.get(0),
        )?;

        // Get budget summaries
        let mut budget_stmt = conn.prepare(
            r#"
            SELECT b.id, b.name, b.amount_cents,
                   COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount_cents ELSE 0 END), 0) as spent_cents
            FROM "Budget" b
            LEFT JOIN "Transaction" t ON t.category_id = b.category_id 
                AND DATE(t.occurred_on) >= DATE(b.start_date) 
                AND DATE(t.occurred_on) <= DATE(b.end_date)
            WHERE b.user_id = ?
              AND strftime('%Y-%m', b.start_date) = ?
            GROUP BY b.id, b.name, b.amount_cents
            "#,
        )?;

        let budget_rows = budget_stmt.query_map(
            params![self.user_id, month],
            |row| {
                let target: i64 = row.get(2)?;
                let spent: i64 = row.get(3)?;
                Ok(BudgetSummary {
                    budget_id: row.get(0)?,
                    budget_name: row.get(1)?,
                    target_cents: target,
                    spent_cents: spent,
                    progress_percent: if target > 0 {
                        (spent as f64 / target as f64) * 100.0
                    } else {
                        0.0
                    },
                })
            },
        )?;

        let budget_summaries: Vec<BudgetSummary> = budget_rows.collect::<Result<Vec<_>, _>>()?;

        // Filter trend to relevant months
        let trend_filtered: Vec<TrendPoint> = trend
            .iter()
            .map(|t| TrendPoint {
                date: t.month.clone(),
                income_cents: t.income_cents,
                expense_cents: t.expense_cents,
            })
            .collect();

        let report = MonthlyReportDto {
            month: month.to_string(),
            spending_by_category: spending
                .iter()
                .map(|s| CategorySpending {
                    category_id: s.category_id.clone(),
                    category_name: s.category_name.clone(),
                    amount_cents: s.amount_cents,
                    percentage: s.percentage,
                })
                .collect(),
            trend_line: trend_filtered,
            income_vs_expense: IncomeVsExpense {
                income_cents: income,
                expense_cents: expense,
                net_cents: income - expense,
            },
            budget_summaries,
            forecast,
        };

        // Cache the result
        self.set_cache(&conn, &cache_key, &report, CACHE_TTL_MINUTES)?;

        Ok(report)
    }

    fn get_spending_by_category(
        &self,
        start_date: &str,
        end_date: &str,
    ) -> ReportResult<Vec<SpendingByCategoryDto>> {
        let conn = self.connection()?;
        let cache_key = self.get_cache_key("spending_by_category", &format!("{}:{}", start_date, end_date));

        if let Some(cached) = self.get_cached::<Vec<SpendingByCategoryDto>>(&conn, &cache_key)? {
            return Ok(cached);
        }

        let result = self.spending_by_category(&conn, start_date, end_date)?;
        self.set_cache(&conn, &cache_key, &result, CACHE_TTL_MINUTES)?;
        Ok(result)
    }

    fn get_monthly_trend(
        &self,
        months: i32,
    ) -> ReportResult<Vec<MonthlyTrendDto>> {
        let conn = self.connection()?;
        let cache_key = self.get_cache_key("monthly_trend", &months.to_string());

        if let Some(cached) = self.get_cached::<Vec<MonthlyTrendDto>>(&conn, &cache_key)? {
            return Ok(cached);
        }

        let result = self.monthly_trend(&conn, months)?;
        self.set_cache(&conn, &cache_key, &result, CACHE_TTL_MINUTES)?;
        Ok(result)
    }

    fn invalidate_cache(&self, key_prefix: Option<&str>) -> ReportResult<()> {
        let conn = self.connection()?;
        
        if let Some(prefix) = key_prefix {
            conn.execute(
                r#"
                DELETE FROM "ReportCache"
                WHERE user_id = ? AND key LIKE ?
                "#,
                params![self.user_id, format!("{}%", prefix)],
            )?;
        } else {
            conn.execute(
                r#"
                DELETE FROM "ReportCache"
                WHERE user_id = ?
                "#,
                params![self.user_id],
            )?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cache_key_generation() {
        let service = SqliteReportService::new(
            PathBuf::from(":memory:"),
            None,
            Some("test-user".to_string()),
        ).unwrap();
        
        let key = service.get_cache_key("monthly_report", "2025-01");
        assert_eq!(key, "monthly_report:test-user:2025-01");
    }
}

