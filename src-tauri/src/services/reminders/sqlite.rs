use std::path::PathBuf;

use chrono::{DateTime, Duration, Utc};
use rusqlite::{params, Connection};
use uuid::Uuid;

use crate::services::ServiceDescriptor;

    use super::{
        CreateReminderInput, DismissReminderInput, ReminderChannel, ReminderDto, ReminderResult,
        ReminderService, ReminderServiceError, ReminderStatus, SnoozeReminderInput,
        UpdateReminderInput,
    };

const DEFAULT_USER_ID: &str = "seed-user";

pub struct SqliteReminderService {
    db_path: PathBuf,
    db_key: Option<String>,
    user_id: String,
}

impl SqliteReminderService {
    pub fn new(
        db_path: PathBuf,
        db_key: Option<String>,
        user_id: Option<String>,
    ) -> ReminderResult<Self> {
        let service = Self {
            db_path,
            db_key,
            user_id: user_id.unwrap_or_else(|| DEFAULT_USER_ID.to_string()),
        };
        Ok(service)
    }

    fn connection(&self) -> ReminderResult<Connection> {
        let conn = Connection::open(&self.db_path)
            .map_err(|err| ReminderServiceError::Database(err.to_string()))?;

        if let Err(err) = conn.execute("PRAGMA foreign_keys = ON;", []) {
            return Err(ReminderServiceError::Database(err.to_string()));
        }

        if let Some(key) = &self.db_key {
            if let Err(err) = conn.pragma_update(None, "key", key) {
                tracing::warn!(error = %err, "Failed to apply SQLCipher key; continuing without encryption");
            }
        }

        Ok(conn)
    }

    fn calculate_next_fire_at(
        &self,
        due_at: &str,
        recurrence_rule: Option<&str>,
    ) -> ReminderResult<Option<String>> {
        let due = DateTime::parse_from_rfc3339(due_at)
            .map_err(|err| ReminderServiceError::Validation(format!("Invalid due_at: {}", err)))?
            .with_timezone(&Utc);

        let now = Utc::now();

        // If due_at is in the future, that's the next fire
        if due > now {
            return Ok(Some(due.to_rfc3339()));
        }

        // If there's a recurrence rule, calculate next occurrence
        if let Some(rule) = recurrence_rule {
            // Simple daily recurrence for now (can be extended with full RRULE parsing)
            if rule == "DAILY" || rule.starts_with("FREQ=DAILY") {
                let mut next = due;
                while next <= now {
                    next += Duration::days(1);
                }
                return Ok(Some(next.to_rfc3339()));
            }
            // Weekly
            if rule == "WEEKLY" || rule.starts_with("FREQ=WEEKLY") {
                let mut next = due;
                while next <= now {
                    next += Duration::days(7);
                }
                return Ok(Some(next.to_rfc3339()));
            }
            // Monthly
            if rule == "MONTHLY" || rule.starts_with("FREQ=MONTHLY") {
                let mut next = due;
                while next <= now {
                    // Approximate month as 30 days
                    next += Duration::days(30);
                }
                return Ok(Some(next.to_rfc3339()));
            }
        }

        // No recurrence and past due - no next fire
        Ok(None)
    }

    fn fetch_reminder_row(&self, conn: &Connection, id: &str) -> ReminderResult<ReminderRow> {
        let row = conn
            .query_row(
                r#"
                SELECT 
                    r.id,
                    r.user_id,
                    r.title,
                    r.description,
                    r.account_id,
                    a.name as account_name,
                    r.amount_cents,
                    r.due_at,
                    r.recurrence_rule,
                    r.next_fire_at,
                    r.channel,
                    r.snooze_minutes,
                    r.last_triggered_at,
                    r.status,
                    r.created_at
                FROM "Reminder" r
                LEFT JOIN "Account" a ON r.account_id = a.id
                WHERE r.id = ? AND r.user_id = ?
                "#,
                params![id, self.user_id],
                |row| {
                    Ok(ReminderRow {
                        id: row.get(0)?,
                        user_id: row.get(1)?,
                        title: row.get(2)?,
                        description: row.get(3)?,
                        account_id: row.get(4)?,
                        account_name: row.get(5)?,
                        amount_cents: row.get(6)?,
                        due_at: row.get(7)?,
                        recurrence_rule: row.get(8)?,
                        next_fire_at: row.get(9)?,
                        channel: row.get(10)?,
                        snooze_minutes: row.get(11)?,
                        last_triggered_at: row.get(12)?,
                        status: row.get(13)?,
                        created_at: row.get(14)?,
                    })
                },
            )
            .map_err(|err| {
                if let rusqlite::Error::QueryReturnedNoRows = err {
                    ReminderServiceError::NotFound(format!("Reminder {} not found", id))
                } else {
                    ReminderServiceError::Database(err.to_string())
                }
            })?;

        Ok(row)
    }

    fn row_to_dto(&self, row: ReminderRow) -> ReminderResult<ReminderDto> {
        let channel = match row.channel.as_str() {
            "toast" => ReminderChannel::Toast,
            "in_app" => ReminderChannel::InApp,
            "email" => ReminderChannel::Email,
            _ => {
                return Err(ReminderServiceError::Validation(
                    "Invalid channel".to_string(),
                ))
            }
        };

        let status = match row.status.as_str() {
            "scheduled" => ReminderStatus::Scheduled,
            "sent" => ReminderStatus::Sent,
            "snoozed" => ReminderStatus::Snoozed,
            "dismissed" => ReminderStatus::Dismissed,
            _ => {
                return Err(ReminderServiceError::Validation(
                    "Invalid status".to_string(),
                ))
            }
        };

        Ok(ReminderDto {
            id: row.id,
            user_id: row.user_id,
            title: row.title,
            description: row.description,
            account_id: row.account_id,
            account_name: row.account_name,
            amount_cents: row.amount_cents,
            due_at: row.due_at,
            recurrence_rule: row.recurrence_rule,
            next_fire_at: row.next_fire_at,
            channel,
            snooze_minutes: row.snooze_minutes,
            last_triggered_at: row.last_triggered_at,
            status,
            created_at: row.created_at,
        })
    }

    fn log_action(
        &self,
        conn: &Connection,
        reminder_id: &str,
        action: &str,
        metadata: Option<&str>,
    ) -> ReminderResult<()> {
        let id = Uuid::new_v4().to_string();
        conn.execute(
            r#"
            INSERT INTO "ReminderLog" (id, reminder_id, action, metadata, created_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            "#,
            params![id, reminder_id, action, metadata],
        )
        .map_err(|err| ReminderServiceError::Database(err.to_string()))?;
        Ok(())
    }
}

struct ReminderRow {
    id: String,
    user_id: String,
    title: String,
    description: Option<String>,
    account_id: Option<String>,
    account_name: Option<String>,
    amount_cents: Option<i64>,
    due_at: String,
    recurrence_rule: Option<String>,
    next_fire_at: Option<String>,
    channel: String,
    snooze_minutes: Option<i32>,
    last_triggered_at: Option<String>,
    status: String,
    created_at: String,
}

impl ReminderService for SqliteReminderService {
    fn descriptor(&self) -> ServiceDescriptor {
        ServiceDescriptor::new("ReminderService", "sqlite")
    }

    fn list_reminders(&self) -> ReminderResult<Vec<ReminderDto>> {
        let conn = self.connection()?;

        let mut stmt = conn
            .prepare(
                r#"
                SELECT 
                    r.id,
                    r.user_id,
                    r.title,
                    r.description,
                    r.account_id,
                    a.name as account_name,
                    r.amount_cents,
                    r.due_at,
                    r.recurrence_rule,
                    r.next_fire_at,
                    r.channel,
                    r.snooze_minutes,
                    r.last_triggered_at,
                    r.status,
                    r.created_at
                FROM "Reminder" r
                LEFT JOIN "Account" a ON r.account_id = a.id
                WHERE r.user_id = ?
                ORDER BY r.next_fire_at ASC NULLS LAST, r.created_at DESC
                "#,
            )
            .map_err(|err| ReminderServiceError::Database(err.to_string()))?;

        let rows = stmt
            .query_map(params![self.user_id], |row| {
                Ok(ReminderRow {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    title: row.get(2)?,
                    description: row.get(3)?,
                    account_id: row.get(4)?,
                    account_name: row.get(5)?,
                    amount_cents: row.get(6)?,
                    due_at: row.get(7)?,
                    recurrence_rule: row.get(8)?,
                    next_fire_at: row.get(9)?,
                    channel: row.get(10)?,
                    snooze_minutes: row.get(11)?,
                    last_triggered_at: row.get(12)?,
                    status: row.get(13)?,
                    created_at: row.get(14)?,
                })
            })
            .map_err(|err| ReminderServiceError::Database(err.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|err| ReminderServiceError::Database(err.to_string()))?;

        drop(stmt);

        let mut reminders = Vec::new();
        for row in rows {
            reminders.push(self.row_to_dto(row)?);
        }

        Ok(reminders)
    }

    fn get_reminder(&self, id: &str) -> ReminderResult<ReminderDto> {
        let conn = self.connection()?;
        let row = self.fetch_reminder_row(&conn, id)?;
        self.row_to_dto(row)
    }

    fn create_reminder(&self, input: CreateReminderInput) -> ReminderResult<ReminderDto> {
        let due_at = DateTime::parse_from_rfc3339(&input.due_at)
            .map_err(|err| ReminderServiceError::Validation(format!("Invalid due_at: {}", err)))?
            .with_timezone(&Utc);

        let now = Utc::now();
        if due_at <= now && input.recurrence_rule.is_none() {
            return Err(ReminderServiceError::Validation(
                "due_at must be in the future for non-recurring reminders".to_string(),
            ));
        }

        let conn = self.connection()?;
        let id = Uuid::new_v4().to_string();
        let channel = input.channel.unwrap_or(ReminderChannel::Toast);
        let next_fire_at =
            self.calculate_next_fire_at(&input.due_at, input.recurrence_rule.as_deref())?;

        conn.execute(
            r#"
            INSERT INTO "Reminder" (
                id, user_id, title, description, account_id, amount_cents,
                due_at, recurrence_rule, next_fire_at, channel, snooze_minutes,
                status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', CURRENT_TIMESTAMP)
            "#,
            params![
                id,
                self.user_id,
                input.title,
                input.description,
                input.account_id,
                input.amount_cents,
                input.due_at,
                input.recurrence_rule,
                next_fire_at,
                channel.as_str(),
                input.snooze_minutes.unwrap_or(0)
            ],
        )
        .map_err(|err| ReminderServiceError::Database(err.to_string()))?;

        self.log_action(&conn, &id, "created", None)?;

        self.get_reminder(&id)
    }

    fn update_reminder(&self, input: UpdateReminderInput) -> ReminderResult<ReminderDto> {
        let conn = self.connection()?;
        let existing = self.fetch_reminder_row(&conn, &input.id)?;

        let title = input.title.unwrap_or(existing.title);
        let description = input.description.or(existing.description);
        let account_id = input.account_id.or(existing.account_id);
        let amount_cents = input.amount_cents.or(existing.amount_cents);
        let due_at = input.due_at.unwrap_or(existing.due_at);
        let recurrence_rule = input.recurrence_rule.or(existing.recurrence_rule);
        let channel = input
            .channel
            .map(|c| c.as_str().to_string())
            .unwrap_or(existing.channel);
        let snooze_minutes = input
            .snooze_minutes
            .unwrap_or(existing.snooze_minutes.unwrap_or(0));
        let status = input
            .status
            .map(|s| s.as_str().to_string())
            .unwrap_or(existing.status);

        let next_fire_at = self.calculate_next_fire_at(&due_at, recurrence_rule.as_deref())?;

        conn.execute(
            r#"
            UPDATE "Reminder"
            SET title = ?, description = ?, account_id = ?, amount_cents = ?,
                due_at = ?, recurrence_rule = ?, next_fire_at = ?, channel = ?,
                snooze_minutes = ?, status = ?
            WHERE id = ? AND user_id = ?
            "#,
            params![
                title,
                description,
                account_id,
                amount_cents,
                due_at,
                recurrence_rule,
                next_fire_at,
                channel,
                snooze_minutes,
                status,
                input.id,
                self.user_id
            ],
        )
        .map_err(|err| ReminderServiceError::Database(err.to_string()))?;

        self.log_action(&conn, &input.id, "updated", None)?;

        self.get_reminder(&input.id)
    }

    fn delete_reminder(&self, id: &str) -> ReminderResult<()> {
        let conn = self.connection()?;

        let rows_affected = conn
            .execute(
                "DELETE FROM \"Reminder\" WHERE id = ? AND user_id = ?",
                params![id, self.user_id],
            )
            .map_err(|err| ReminderServiceError::Database(err.to_string()))?;

        if rows_affected == 0 {
            return Err(ReminderServiceError::NotFound(format!(
                "Reminder {} not found",
                id
            )));
        }

        Ok(())
    }

    fn snooze_reminder(&self, input: SnoozeReminderInput) -> ReminderResult<ReminderDto> {
        if input.snooze_minutes <= 0 {
            return Err(ReminderServiceError::Validation(
                "snooze_minutes must be positive".to_string(),
            ));
        }

        let conn = self.connection()?;
        let reminder = self.fetch_reminder_row(&conn, &input.id)?;

        let now = Utc::now();
        let next_fire = if let Some(current_next) = reminder.next_fire_at {
            let current = DateTime::parse_from_rfc3339(&current_next)
                .map_err(|err| {
                    ReminderServiceError::Validation(format!("Invalid next_fire_at: {}", err))
                })?
                .with_timezone(&Utc);
            (current.max(now) + Duration::minutes(input.snooze_minutes as i64)).to_rfc3339()
        } else {
            (now + Duration::minutes(input.snooze_minutes as i64)).to_rfc3339()
        };

        conn.execute(
            r#"
            UPDATE "Reminder"
            SET next_fire_at = ?, due_at = ?, status = 'snoozed', snooze_minutes = ?
            WHERE id = ? AND user_id = ?
            "#,
            params![
                next_fire,
                next_fire,
                input.snooze_minutes,
                input.id,
                self.user_id
            ],
        )
        .map_err(|err| ReminderServiceError::Database(err.to_string()))?;

        self.log_action(
            &conn,
            &input.id,
            "snoozed",
            Some(&format!("{} minutes", input.snooze_minutes)),
        )?;

        self.get_reminder(&input.id)
    }

    fn dismiss_reminder(&self, input: DismissReminderInput) -> ReminderResult<ReminderDto> {
        let conn = self.connection()?;
        self.fetch_reminder_row(&conn, &input.id)?;

        conn.execute(
            r#"
            UPDATE "Reminder"
            SET status = 'dismissed', next_fire_at = NULL
            WHERE id = ? AND user_id = ?
            "#,
            params![input.id, self.user_id],
        )
        .map_err(|err| ReminderServiceError::Database(err.to_string()))?;

        self.log_action(&conn, &input.id, "dismissed", None)?;

        self.get_reminder(&input.id)
    }

    fn get_due_reminders(&self) -> ReminderResult<Vec<ReminderDto>> {
        let conn = self.connection()?;
        let now = Utc::now().to_rfc3339();

        let mut stmt = conn
            .prepare(
                r#"
                SELECT 
                    r.id,
                    r.user_id,
                    r.title,
                    r.description,
                    r.account_id,
                    a.name as account_name,
                    r.amount_cents,
                    r.due_at,
                    r.recurrence_rule,
                    r.next_fire_at,
                    r.channel,
                    r.snooze_minutes,
                    r.last_triggered_at,
                    r.status,
                    r.created_at
                FROM "Reminder" r
                LEFT JOIN "Account" a ON r.account_id = a.id
                WHERE r.user_id = ? 
                  AND r.status IN ('scheduled','snoozed')
                  AND r.next_fire_at IS NOT NULL
                  AND r.next_fire_at <= ?
                ORDER BY r.next_fire_at ASC
                "#,
            )
            .map_err(|err| ReminderServiceError::Database(err.to_string()))?;

        let rows = stmt
            .query_map(params![self.user_id, now], |row| {
                Ok(ReminderRow {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    title: row.get(2)?,
                    description: row.get(3)?,
                    account_id: row.get(4)?,
                    account_name: row.get(5)?,
                    amount_cents: row.get(6)?,
                    due_at: row.get(7)?,
                    recurrence_rule: row.get(8)?,
                    next_fire_at: row.get(9)?,
                    channel: row.get(10)?,
                    snooze_minutes: row.get(11)?,
                    last_triggered_at: row.get(12)?,
                    status: row.get(13)?,
                    created_at: row.get(14)?,
                })
            })
            .map_err(|err| ReminderServiceError::Database(err.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|err| ReminderServiceError::Database(err.to_string()))?;

        drop(stmt);

        let mut reminders = Vec::new();
        for row in rows {
            reminders.push(self.row_to_dto(row)?);
        }

        Ok(reminders)
    }

    fn mark_reminder_sent(&self, id: &str) -> ReminderResult<ReminderDto> {
        let conn = self.connection()?;
        let reminder = self.fetch_reminder_row(&conn, id)?;

        let now = Utc::now().to_rfc3339();
        let next_fire_at = if reminder.recurrence_rule.is_some() {
            self.calculate_next_fire_at(&reminder.due_at, reminder.recurrence_rule.as_deref())?
        } else {
            None
        };

        conn.execute(
            r#"
            UPDATE "Reminder"
            SET status = 'sent', last_triggered_at = ?, next_fire_at = ?
            WHERE id = ? AND user_id = ?
            "#,
            params![now, next_fire_at, id, self.user_id],
        )
        .map_err(|err| ReminderServiceError::Database(err.to_string()))?;

        self.log_action(&conn, id, "sent", None)?;

        // If recurring, reset status to scheduled for next occurrence
        if next_fire_at.is_some() {
            conn.execute(
                r#"
                UPDATE "Reminder"
                SET status = 'scheduled'
                WHERE id = ? AND user_id = ?
                "#,
                params![id, self.user_id],
            )
            .map_err(|err| ReminderServiceError::Database(err.to_string()))?;
        }

        self.get_reminder(id)
    }
}
