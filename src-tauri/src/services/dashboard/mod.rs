use std::{collections::HashMap, path::PathBuf};

use chrono::{Datelike, Duration, Local, NaiveDate, NaiveDateTime, Timelike};
use rusqlite::{params, params_from_iter, Connection, ToSql};
use serde::Serialize;
use thiserror::Error;

use crate::services::ServiceDescriptor;

const DEFAULT_USER_ID: &str = "seed-user";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardSnapshot {
    pub currency: String,
    pub net_worth_cents: i64,
    pub net_worth_delta_cents: i64,
    pub cash_flow_cents: i64,
    pub cash_flow_previous_cents: i64,
    pub budget_total_cents: i64,
    pub budget_spent_cents: i64,
    pub weekly_spending: Vec<WeeklySpendingPoint>,
    pub accounts: Vec<AccountHighlight>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WeeklySpendingPoint {
    pub date: String,
    pub amount_cents: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountHighlight {
    pub id: String,
    pub name: String,
    pub balance_cents: i64,
    pub account_type: Option<String>,
    pub color_token: Option<String>,
}

#[derive(Debug, Error)]
pub enum DashboardServiceError {
    #[error("database error: {0}")]
    Database(String),
    #[error("internal error: {0}")]
    Internal(String),
}

pub type DashboardResult<T> = Result<T, DashboardServiceError>;

impl From<rusqlite::Error> for DashboardServiceError {
    fn from(value: rusqlite::Error) -> Self {
        DashboardServiceError::Database(value.to_string())
    }
}

pub trait DashboardService: Send + Sync {
    fn descriptor(&self) -> ServiceDescriptor;
    fn snapshot(&self) -> DashboardResult<DashboardSnapshot>;
}

pub struct SqliteDashboardService {
    db_path: PathBuf,
    db_key: Option<String>,
    user_id: String,
}

impl SqliteDashboardService {
    pub fn new(
        db_path: PathBuf,
        db_key: Option<String>,
        user_id: Option<String>,
    ) -> DashboardResult<Self> {
        Ok(Self {
            db_path,
            db_key,
            user_id: user_id.unwrap_or_else(|| DEFAULT_USER_ID.to_string()),
        })
    }

    fn connection(&self) -> DashboardResult<Connection> {
        let conn = Connection::open(&self.db_path)?;
        conn.execute("PRAGMA foreign_keys = ON;", [])?;
        if let Some(key) = &self.db_key {
            if let Err(err) = conn.pragma_update(None, "key", key) {
                tracing::warn!(error = %err, "Failed to apply SQLCipher key for dashboard service");
            }
        }
        Ok(conn)
    }

    fn currency(&self, conn: &Connection) -> DashboardResult<String> {
        let value: Option<String> = conn
            .query_row(
                r#"SELECT default_currency FROM "User" WHERE id = ?"#,
                params![self.user_id],
                |row| row.get(0),
            )
            .optional()?;

        Ok(value.unwrap_or_else(|| "USD".to_string()))
    }

    fn net_worth(&self, conn: &Connection) -> DashboardResult<i64> {
        // Активы: cash/checking/savings/investment/wallet. Всё остальное считаем пассивами.
        let (assets, liabilities): (i64, i64) = conn
            .query_row(
                r#"
                SELECT
                  COALESCE(SUM(CASE WHEN type IN ('cash','checking','savings','investment','wallet') THEN balance_cents ELSE 0 END), 0) as assets,
                  COALESCE(SUM(CASE WHEN type NOT IN ('cash','checking','savings','investment','wallet') THEN balance_cents ELSE 0 END), 0)  as liabilities
                FROM "Account"
                WHERE user_id = ?
                "#,
                params![self.user_id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .unwrap_or((0, 0));

        Ok(assets - liabilities.abs())
    }

    fn net_worth_delta(&self, conn: &Connection) -> DashboardResult<i64> {
        let delta: i64 = conn
            .query_row(
                r#"
                SELECT COALESCE(SUM(CASE 
                    WHEN type = 'income' THEN amount_cents 
                    WHEN type = 'expense' THEN -amount_cents 
                    ELSE 0 END), 0)
                FROM "Transaction"
                WHERE user_id = ? AND datetime(occurred_on) >= datetime('now', '-7 days')
            "#,
                params![self.user_id],
                |row| row.get(0),
            )
            .unwrap_or(0);
        Ok(delta)
    }

    fn cash_flow(&self, conn: &Connection) -> DashboardResult<(i64, i64)> {
        // Берём 30 полных дней, локальная тайм-зона, [start, end)
        let today = Local::now().date_naive();
        let current_start = start_of_day(today - Duration::days(29));
        let current_end = start_of_day(today + Duration::days(1));
        let previous_start = start_of_day(today - Duration::days(59));
        let previous_end = start_of_day(today - Duration::days(29));

        let current: i64 = conn
            .query_row(
                r#"
                SELECT COALESCE(SUM(CASE 
                    WHEN type = 'income' THEN amount_cents 
                    WHEN type = 'expense' THEN -amount_cents 
                    ELSE 0 END), 0)
                FROM "Transaction"
                WHERE user_id = ? 
                  AND datetime(occurred_on) >= datetime(?)
                  AND datetime(occurred_on) <  datetime(?)
            "#,
                params![
                    self.user_id,
                    format_iso_start(current_start),
                    format_iso_start(current_end)
                ],
                |row| row.get(0),
            )
            .unwrap_or(0);

        let previous: i64 = conn
            .query_row(
                r#"
                SELECT COALESCE(SUM(CASE 
                    WHEN type = 'income' THEN amount_cents 
                    WHEN type = 'expense' THEN -amount_cents 
                    ELSE 0 END), 0)
                FROM "Transaction"
                WHERE user_id = ?
                  AND datetime(occurred_on) >= datetime(?)
                  AND datetime(occurred_on) <  datetime(?)
            "#,
                params![
                    self.user_id,
                    format_iso_start(previous_start),
                    format_iso_start(previous_end)
                ],
                |row| row.get(0),
            )
            .unwrap_or(0);

        Ok((current, previous))
    }

    fn budget_summary(&self, conn: &Connection) -> DashboardResult<(i64, i64)> {
        let mut stmt = conn.prepare(
            r#"
            SELECT id, amount_cents, start_date, end_date, category_id
            FROM "Budget"
            WHERE user_id = ?
              AND datetime('now', 'localtime') >= datetime(start_date)
              AND datetime('now', 'localtime') < datetime(end_date)
        "#,
        )?;

        let mut rows = stmt.query(params![self.user_id.clone()])?;
        let mut total = 0i64;
        let mut spent = 0i64;

        while let Some(row) = rows.next()? {
            let amount: i64 = row.get(1)?;
            let start: String = row.get(2)?;
            let end: String = row.get(3)?;
            let category_id: Option<String> = row.get(4)?;
            let categories = parse_categories(category_id.clone());

            total += amount;

            let period_spent: i64 = if categories.is_empty() {
                conn.query_row(
                    r#"
                    SELECT COALESCE(SUM(amount_cents), 0)
                    FROM "Transaction"
                    WHERE user_id = ?
                      AND type = 'expense'
                      AND datetime(occurred_on) >= datetime(?)
                      AND datetime(occurred_on) <  datetime(?)
                "#,
                    params![self.user_id, start, end],
                    |r| r.get(0),
                )
                .unwrap_or(0)
            } else {
                let placeholders = format!("({})", std::iter::repeat("?").take(categories.len()).collect::<Vec<_>>().join(","));
                let mut sql = format!(
                    r#"
                    SELECT COALESCE(SUM(amount_cents), 0)
                    FROM "Transaction"
                    WHERE user_id = ?
                      AND type = 'expense'
                      AND datetime(occurred_on) >= datetime(?)
                      AND datetime(occurred_on) <  datetime(?)
                      AND category_id IN {}
                "#,
                    placeholders
                );
                let mut params: Vec<Box<dyn ToSql>> =
                    vec![Box::new(self.user_id.clone()), Box::new(start), Box::new(end)];
                for cat in categories {
                    params.push(Box::new(cat));
                }
                let sqlite_params = params_from_iter(params.iter().map(|p| &**p));
                conn.query_row(&sql, sqlite_params, |r| r.get(0)).unwrap_or(0)
            };

            spent += period_spent;
        }

        Ok((total, spent))
    }

    fn weekly_spending(&self, conn: &Connection) -> DashboardResult<Vec<WeeklySpendingPoint>> {
        let today = Local::now().date_naive();
        let week_start = start_of_week_sunday(today);
        let week_end = week_start + Duration::days(7);

        let mut stmt = conn.prepare(
            r#"
            SELECT strftime('%Y-%m-%d', datetime(occurred_on, 'localtime')) as day,
                   COALESCE(SUM(amount_cents), 0) as total
            FROM "Transaction"
            WHERE user_id = ?
              AND type = 'expense'
              AND datetime(occurred_on) >= datetime(?)
              AND datetime(occurred_on) <  datetime(?)
            GROUP BY day
        "#,
        )?;
        let mut rows = stmt.query(params![
            self.user_id.clone(),
            format_iso_start(start_of_day(week_start)),
            format_iso_start(start_of_day(week_end))
        ])?;
        let mut totals_by_day: HashMap<String, i64> = HashMap::new();
        while let Some(row) = rows.next()? {
            let day: String = row.get(0)?;
            let total: i64 = row.get(1)?;
            totals_by_day.insert(day, total);
        }

        Ok(build_weekly_series(week_start, &totals_by_day))
    }

    fn account_highlights(&self, conn: &Connection) -> DashboardResult<Vec<AccountHighlight>> {
        let mut stmt = conn.prepare(
            r#"
            SELECT id, name, type, color_token, balance_cents
            FROM "Account"
            WHERE user_id = ?
            ORDER BY abs(balance_cents) DESC
            LIMIT 4
        "#,
        )?;

        let rows = stmt
            .query_map(params![self.user_id.clone()], |row| {
                Ok(AccountHighlight {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    account_type: row.get(2).ok(),
                    color_token: row.get(3).ok(),
                    balance_cents: row.get(4)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(rows)
    }
}

fn build_weekly_series(
    week_start: NaiveDate,
    totals_by_day: &HashMap<String, i64>,
) -> Vec<WeeklySpendingPoint> {
    let mut series = Vec::with_capacity(7);
    for offset in 0..7 {
        let date = week_start + Duration::days(offset);
        let key = date.format("%Y-%m-%d").to_string();
        let amount = *totals_by_day.get(&key).unwrap_or(&0);
        series.push(WeeklySpendingPoint {
            date: key,
            amount_cents: amount,
        });
    }
    series
}

fn start_of_day(date: NaiveDate) -> NaiveDateTime {
    date.and_hms_opt(0, 0, 0).unwrap()
}

fn format_iso_start(date: NaiveDateTime) -> String {
    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}",
        date.year(),
        date.month(),
        date.day(),
        date.hour(),
        date.minute(),
        date.second()
    )
}

fn start_of_week_sunday(today: NaiveDate) -> NaiveDate {
    let days_from_sunday = today.weekday().num_days_from_sunday() as i64;
    today - Duration::days(days_from_sunday)
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

impl DashboardService for SqliteDashboardService {
    fn descriptor(&self) -> ServiceDescriptor {
        ServiceDescriptor::new("DashboardService", "sqlite")
    }

    fn snapshot(&self) -> DashboardResult<DashboardSnapshot> {
        let conn = self.connection()?;
        let currency = self.currency(&conn)?;
        let net_worth = self.net_worth(&conn)?;
        let net_delta = self.net_worth_delta(&conn)?;
        let (cash_flow, cash_prev) = self.cash_flow(&conn)?;
        let (budget_total, budget_spent) = self.budget_summary(&conn)?;
        let weekly = self.weekly_spending(&conn)?;
        let accounts = self.account_highlights(&conn)?;

        Ok(DashboardSnapshot {
            currency,
            net_worth_cents: net_worth,
            net_worth_delta_cents: net_delta,
            cash_flow_cents: cash_flow,
            cash_flow_previous_cents: cash_prev,
            budget_total_cents: budget_total,
            budget_spent_cents: budget_spent,
            weekly_spending: weekly,
            accounts,
        })
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fills_weekly_series_with_zeroes() {
        let week_start = NaiveDate::from_ymd_opt(2025, 1, 1).unwrap();
        let map = HashMap::from([
            ("2025-01-01".to_string(), 1200),
            ("2025-01-06".to_string(), 8300),
        ]);
        let series = build_weekly_series(week_start, &map);
        assert_eq!(series.len(), 7);
        assert_eq!(series[0].date, "2025-01-01");
        assert_eq!(series[0].amount_cents, 1200);
        assert_eq!(series[1].date, "2025-01-02");
        assert_eq!(series[1].amount_cents, 0);
        assert_eq!(series[5].date, "2025-01-06");
        assert_eq!(series[5].amount_cents, 8300);
        assert_eq!(series[6].date, "2025-01-07");
        assert_eq!(series[6].amount_cents, 0);
    }
}
