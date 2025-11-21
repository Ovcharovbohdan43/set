use std::path::PathBuf;

use chrono::{DateTime, Duration, Utc};
use rusqlite::{params, Connection};
use uuid::Uuid;

use crate::services::ServiceDescriptor;

use super::{
    AddContributionInput, CreateGoalInput, GoalDto, GoalResult, GoalService, GoalServiceError,
    GoalStatus, UpdateGoalInput, UpdateGoalStatusInput,
};

const DEFAULT_USER_ID: &str = "seed-user";

pub struct SqliteGoalService {
    db_path: PathBuf,
    db_key: Option<String>,
    user_id: String,
}

impl SqliteGoalService {
    pub fn new(
        db_path: PathBuf,
        db_key: Option<String>,
        user_id: Option<String>,
    ) -> GoalResult<Self> {
        let service = Self {
            db_path,
            db_key,
            user_id: user_id.unwrap_or_else(|| DEFAULT_USER_ID.to_string()),
        };
        Ok(service)
    }

    fn connection(&self) -> GoalResult<Connection> {
        let conn = Connection::open(&self.db_path)
            .map_err(|err| GoalServiceError::Database(err.to_string()))?;

        if let Err(err) = conn.execute("PRAGMA foreign_keys = ON;", []) {
            return Err(GoalServiceError::Database(err.to_string()));
        }

        if let Some(key) = &self.db_key {
            if let Err(err) = conn.pragma_update(None, "key", key) {
                tracing::warn!(error = %err, "Failed to apply SQLCipher key; continuing without encryption");
            }
        }

        Ok(conn)
    }

    fn calculate_current(&self, conn: &Connection, goal_id: &str) -> GoalResult<i64> {
        let current: i64 = conn
            .query_row(
                r#"
                SELECT COALESCE(SUM(amount_cents), 0)
                FROM "Transaction"
                WHERE user_id = ? 
                  AND goal_id = ?
                  AND type IN ('income', 'transfer')
                "#,
                params![self.user_id, goal_id],
                |row| row.get(0),
            )
            .unwrap_or(0);

        Ok(current)
    }

    fn calculate_projection(
        &self,
        target_cents: i64,
        current_cents: i64,
        target_date: Option<&str>,
    ) -> (f64, Option<String>) {
        if target_cents <= 0 {
            return (0.0, None);
        }

        let progress = (current_cents as f64 / target_cents as f64) * 100.0;

        if let Some(target_date_str) = target_date {
            if let Ok(target) = DateTime::parse_from_rfc3339(target_date_str) {
                let now = Utc::now();
                let target_utc = target.with_timezone(&Utc);
                let days_remaining = (target_utc - now).num_days();

                if days_remaining > 0 && current_cents < target_cents {
                    let remaining = target_cents - current_cents;
                    let daily_rate = remaining as f64 / days_remaining as f64;
                    let projected_date = now + Duration::days((remaining as f64 / daily_rate.max(1.0)) as i64);
                    return (progress, Some(projected_date.to_rfc3339()));
                }
            }
        }

        (progress, None)
    }

    fn fetch_goal_row(&self, conn: &Connection, id: &str) -> GoalResult<GoalRow> {
        let row = conn
            .query_row(
                r#"
                SELECT 
                    g.id,
                    g.user_id,
                    g.name,
                    g.target_cents,
                    g.current_cents,
                    g.target_date,
                    g.category_id,
                    c.name as category_name,
                    g.priority,
                    g.status,
                    g.created_at,
                    g.updated_at
                FROM "Goal" g
                LEFT JOIN "Category" c ON g.category_id = c.id
                WHERE g.id = ? AND g.user_id = ?
                "#,
                params![id, self.user_id],
                |row| {
                    Ok(GoalRow {
                        id: row.get(0)?,
                        user_id: row.get(1)?,
                        name: row.get(2)?,
                        target_cents: row.get(3)?,
                        current_cents: row.get(4)?,
                        target_date: row.get(5)?,
                        category_id: row.get(6)?,
                        category_name: row.get(7)?,
                        priority: row.get(8)?,
                        status: row.get(9)?,
                        created_at: row.get(10)?,
                        updated_at: row.get(11)?,
                    })
                },
            )
            .map_err(|err| {
                if let rusqlite::Error::QueryReturnedNoRows = err {
                    GoalServiceError::NotFound(format!("Goal {} not found", id))
                } else {
                    GoalServiceError::Database(err.to_string())
                }
            })?;

        Ok(row)
    }

    fn row_to_dto(&self, conn: &Connection, row: GoalRow) -> GoalResult<GoalDto> {
        let current = self.calculate_current(conn, &row.id)?;
        let (progress_percent, projected_completion_date) =
            self.calculate_projection(row.target_cents, current, row.target_date.as_deref());

        let days_remaining = if let Some(target_date_str) = &row.target_date {
            if let Ok(target) = DateTime::parse_from_rfc3339(target_date_str) {
                let now = Utc::now();
                let target_utc = target.with_timezone(&Utc);
                let days = (target_utc - now).num_days();
                if days > 0 {
                    Some(days)
                } else {
                    None
                }
            } else {
                None
            }
        } else {
            None
        };

        let status = match row.status.as_str() {
            "active" => GoalStatus::Active,
            "paused" => GoalStatus::Paused,
            "achieved" => GoalStatus::Achieved,
            "abandoned" => GoalStatus::Abandoned,
            _ => return Err(GoalServiceError::Validation("Invalid status".to_string())),
        };

        Ok(GoalDto {
            id: row.id,
            user_id: row.user_id,
            name: row.name,
            target_cents: row.target_cents,
            current_cents: current,
            target_date: row.target_date,
            category_id: row.category_id,
            category_name: row.category_name,
            priority: row.priority,
            status,
            progress_percent,
            days_remaining,
            projected_completion_date,
            created_at: row.created_at,
            updated_at: row.updated_at,
        })
    }
}

struct GoalRow {
    id: String,
    user_id: String,
    name: String,
    target_cents: i64,
    current_cents: i64,
    target_date: Option<String>,
    category_id: Option<String>,
    category_name: Option<String>,
    priority: i32,
    status: String,
    created_at: String,
    updated_at: String,
}

impl GoalService for SqliteGoalService {
    fn descriptor(&self) -> ServiceDescriptor {
        ServiceDescriptor::new("GoalService", "sqlite")
    }

    fn list_goals(&self) -> GoalResult<Vec<GoalDto>> {
        let conn = self.connection()?;

        let mut stmt = conn
            .prepare(
                r#"
                SELECT 
                    g.id,
                    g.user_id,
                    g.name,
                    g.target_cents,
                    g.current_cents,
                    g.target_date,
                    g.category_id,
                    c.name as category_name,
                    g.priority,
                    g.status,
                    g.created_at,
                    g.updated_at
                FROM "Goal" g
                LEFT JOIN "Category" c ON g.category_id = c.id
                WHERE g.user_id = ?
                ORDER BY g.priority DESC, g.created_at DESC
                "#,
            )
            .map_err(|err| GoalServiceError::Database(err.to_string()))?;

        let rows = stmt
            .query_map(params![self.user_id], |row| {
                Ok(GoalRow {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    name: row.get(2)?,
                    target_cents: row.get(3)?,
                    current_cents: row.get(4)?,
                    target_date: row.get(5)?,
                    category_id: row.get(6)?,
                    category_name: row.get(7)?,
                    priority: row.get(8)?,
                    status: row.get(9)?,
                    created_at: row.get(10)?,
                    updated_at: row.get(11)?,
                })
            })
            .map_err(|err| GoalServiceError::Database(err.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|err| GoalServiceError::Database(err.to_string()))?;

        drop(stmt);

        let mut goals = Vec::new();
        for row in rows {
            goals.push(self.row_to_dto(&conn, row)?);
        }

        Ok(goals)
    }

    fn get_goal(&self, id: &str) -> GoalResult<GoalDto> {
        let conn = self.connection()?;
        let row = self.fetch_goal_row(&conn, id)?;
        self.row_to_dto(&conn, row)
    }

    fn create_goal(&self, input: CreateGoalInput) -> GoalResult<GoalDto> {
        if input.target_cents < 0 {
            return Err(GoalServiceError::Validation(
                "Target amount must be non-negative".to_string(),
            ));
        }

        let conn = self.connection()?;
        let id = Uuid::new_v4().to_string();
        let status = input.status.unwrap_or(GoalStatus::Active);
        let priority = input.priority.unwrap_or(0);

        conn.execute(
            r#"
            INSERT INTO "Goal" (
                id, user_id, name, target_cents, current_cents, target_date,
                category_id, priority, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            "#,
            params![
                id,
                self.user_id,
                input.name,
                input.target_cents,
                input.target_date,
                input.category_id,
                priority,
                status.as_str()
            ],
        )
        .map_err(|err| GoalServiceError::Database(err.to_string()))?;

        self.get_goal(&id)
    }

    fn update_goal(&self, input: UpdateGoalInput) -> GoalResult<GoalDto> {
        let conn = self.connection()?;
        let existing = self.fetch_goal_row(&conn, &input.id)?;

        let name = input.name.unwrap_or(existing.name);
        let target_cents = input.target_cents.unwrap_or(existing.target_cents);
        let target_date = input.target_date.or(existing.target_date);
        let category_id = input.category_id.or(existing.category_id);
        let priority = input.priority.unwrap_or(existing.priority);
        let status = input
            .status
            .map(|s| s.as_str().to_string())
            .unwrap_or(existing.status);

        if target_cents < 0 {
            return Err(GoalServiceError::Validation(
                "Target amount must be non-negative".to_string(),
            ));
        }

        conn.execute(
            r#"
            UPDATE "Goal"
            SET name = ?, target_cents = ?, target_date = ?, category_id = ?,
                priority = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
            "#,
            params![
                name,
                target_cents,
                target_date,
                category_id,
                priority,
                status,
                input.id,
                self.user_id
            ],
        )
        .map_err(|err| GoalServiceError::Database(err.to_string()))?;

        self.get_goal(&input.id)
    }

    fn update_goal_status(&self, input: UpdateGoalStatusInput) -> GoalResult<GoalDto> {
        let conn = self.connection()?;

        conn.execute(
            r#"
            UPDATE "Goal"
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
            "#,
            params![input.status.as_str(), input.id, self.user_id],
        )
        .map_err(|err| GoalServiceError::Database(err.to_string()))?;

        self.get_goal(&input.id)
    }

    fn add_contribution(&self, input: AddContributionInput) -> GoalResult<GoalDto> {
        if input.amount_cents <= 0 {
            return Err(GoalServiceError::Validation(
                "Contribution amount must be positive".to_string(),
            ));
        }

        let conn = self.connection()?;
        let goal = self.fetch_goal_row(&conn, &input.goal_id)?;

        let new_current = goal.current_cents + input.amount_cents;

        conn.execute(
            r#"
            UPDATE "Goal"
            SET current_cents = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
            "#,
            params![new_current, input.goal_id, self.user_id],
        )
        .map_err(|err| GoalServiceError::Database(err.to_string()))?;

        // Auto-achieve if target reached
        if new_current >= goal.target_cents {
            conn.execute(
                r#"
                UPDATE "Goal"
                SET status = 'achieved', updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND user_id = ? AND status != 'achieved'
                "#,
                params![input.goal_id, self.user_id],
            )
            .map_err(|err| GoalServiceError::Database(err.to_string()))?;
        }

        self.get_goal(&input.goal_id)
    }

    fn delete_goal(&self, id: &str) -> GoalResult<()> {
        let conn = self.connection()?;

        let rows_affected = conn
            .execute(
                "DELETE FROM \"Goal\" WHERE id = ? AND user_id = ?",
                params![id, self.user_id],
            )
            .map_err(|err| GoalServiceError::Database(err.to_string()))?;

        if rows_affected == 0 {
            return Err(GoalServiceError::NotFound(format!("Goal {} not found", id)));
        }

        Ok(())
    }

    fn calculate_projection(&self, goal_id: &str) -> GoalResult<(f64, Option<String>)> {
        let conn = self.connection()?;
        let goal = self.fetch_goal_row(&conn, goal_id)?;
        let current = self.calculate_current(&conn, goal_id)?;
        let (progress, projected) = self.calculate_projection(
            goal.target_cents,
            current,
            goal.target_date.as_deref(),
        );
        Ok((progress, projected))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_projection() {
        let service = SqliteGoalService {
            db_path: PathBuf::from(":memory:"),
            db_key: None,
            user_id: "test".to_string(),
        };

        let (progress, _) = service.calculate_projection(10000, 5000, None);
        assert!((progress - 50.0).abs() < 0.01);
    }

    #[test]
    fn test_calculate_projection_zero_target() {
        let service = SqliteGoalService {
            db_path: PathBuf::from(":memory:"),
            db_key: None,
            user_id: "test".to_string(),
        };

        let (progress, projected) = service.calculate_projection(0, 1000, None);
        assert_eq!(progress, 0.0);
        assert_eq!(projected, None);
    }
}

