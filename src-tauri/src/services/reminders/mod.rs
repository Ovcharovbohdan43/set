mod sqlite;

pub use sqlite::SqliteReminderService;

use rusqlite;
use serde::{Deserialize, Serialize};
use thiserror::Error;

use super::ServiceDescriptor;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReminderDto {
    pub id: String,
    pub user_id: String,
    pub title: String,
    pub description: Option<String>,
    pub account_id: Option<String>,
    pub account_name: Option<String>,
    pub amount_cents: Option<i64>,
    pub due_at: String,
    pub recurrence_rule: Option<String>,
    pub next_fire_at: Option<String>,
    pub channel: ReminderChannel,
    pub snooze_minutes: Option<i32>,
    pub last_triggered_at: Option<String>,
    pub status: ReminderStatus,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ReminderChannel {
    Toast,
    InApp,
    Email,
}

impl ReminderChannel {
    pub fn as_str(&self) -> &'static str {
        match self {
            ReminderChannel::Toast => "toast",
            ReminderChannel::InApp => "in_app",
            ReminderChannel::Email => "email",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ReminderStatus {
    Scheduled,
    Sent,
    Snoozed,
    Dismissed,
}

impl ReminderStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            ReminderStatus::Scheduled => "scheduled",
            ReminderStatus::Sent => "sent",
            ReminderStatus::Snoozed => "snoozed",
            ReminderStatus::Dismissed => "dismissed",
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub struct ReminderLogDto {
    pub id: String,
    pub reminder_id: String,
    pub action: String,
    pub metadata: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateReminderInput {
    pub title: String,
    pub description: Option<String>,
    pub account_id: Option<String>,
    pub amount_cents: Option<i64>,
    pub due_at: String,
    pub recurrence_rule: Option<String>,
    pub channel: Option<ReminderChannel>,
    pub snooze_minutes: Option<i32>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateReminderInput {
    pub id: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub account_id: Option<String>,
    pub amount_cents: Option<i64>,
    pub due_at: Option<String>,
    pub recurrence_rule: Option<String>,
    pub channel: Option<ReminderChannel>,
    pub snooze_minutes: Option<i32>,
    pub status: Option<ReminderStatus>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SnoozeReminderInput {
    pub id: String,
    pub snooze_minutes: i32,
}

#[derive(Debug, Error)]
pub enum ReminderServiceError {
    #[error("database error: {0}")]
    Database(String),
    #[error("not found: {0}")]
    NotFound(String),
    #[error("validation error: {0}")]
    Validation(String),
    #[error("internal error: {0}")]
    Internal(String),
}

pub type ReminderResult<T> = Result<T, ReminderServiceError>;

impl From<rusqlite::Error> for ReminderServiceError {
    fn from(err: rusqlite::Error) -> Self {
        ReminderServiceError::Database(err.to_string())
    }
}

pub trait ReminderService: Send + Sync {
    fn descriptor(&self) -> ServiceDescriptor;
    fn list_reminders(&self) -> ReminderResult<Vec<ReminderDto>>;
    fn get_reminder(&self, id: &str) -> ReminderResult<ReminderDto>;
    fn create_reminder(&self, input: CreateReminderInput) -> ReminderResult<ReminderDto>;
    fn update_reminder(&self, input: UpdateReminderInput) -> ReminderResult<ReminderDto>;
    fn delete_reminder(&self, id: &str) -> ReminderResult<()>;
    fn snooze_reminder(&self, input: SnoozeReminderInput) -> ReminderResult<ReminderDto>;
    fn get_due_reminders(&self) -> ReminderResult<Vec<ReminderDto>>;
    fn mark_reminder_sent(&self, id: &str) -> ReminderResult<ReminderDto>;
}

