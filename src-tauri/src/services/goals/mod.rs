mod sqlite;

pub use sqlite::SqliteGoalService;

use rusqlite;
use serde::{Deserialize, Serialize};
use thiserror::Error;

use super::ServiceDescriptor;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GoalDto {
    pub id: String,
    pub user_id: String,
    pub name: String,
    pub target_cents: i64,
    pub current_cents: i64,
    pub target_date: Option<String>,
    pub category_id: Option<String>,
    pub category_name: Option<String>,
    pub priority: i32,
    pub status: GoalStatus,
    pub progress_percent: f64,
    pub days_remaining: Option<i64>,
    pub projected_completion_date: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum GoalStatus {
    Active,
    Paused,
    Achieved,
    Abandoned,
}

impl GoalStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            GoalStatus::Active => "active",
            GoalStatus::Paused => "paused",
            GoalStatus::Achieved => "achieved",
            GoalStatus::Abandoned => "abandoned",
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateGoalInput {
    pub name: String,
    pub target_cents: i64,
    pub target_date: Option<String>,
    pub category_id: Option<String>,
    pub priority: Option<i32>,
    pub status: Option<GoalStatus>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateGoalInput {
    pub id: String,
    pub name: Option<String>,
    pub target_cents: Option<i64>,
    pub target_date: Option<String>,
    pub category_id: Option<String>,
    pub priority: Option<i32>,
    pub status: Option<GoalStatus>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateGoalStatusInput {
    pub id: String,
    pub status: GoalStatus,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddContributionInput {
    pub goal_id: String,
    pub amount_cents: i64,
}

#[derive(Debug, Error)]
pub enum GoalServiceError {
    #[error("database error: {0}")]
    Database(String),
    #[error("not found: {0}")]
    NotFound(String),
    #[error("validation error: {0}")]
    Validation(String),
    #[error("internal error: {0}")]
    Internal(String),
}

pub type GoalResult<T> = Result<T, GoalServiceError>;

impl From<rusqlite::Error> for GoalServiceError {
    fn from(err: rusqlite::Error) -> Self {
        GoalServiceError::Database(err.to_string())
    }
}

pub trait GoalService: Send + Sync {
    fn descriptor(&self) -> ServiceDescriptor;
    fn list_goals(&self) -> GoalResult<Vec<GoalDto>>;
    fn get_goal(&self, id: &str) -> GoalResult<GoalDto>;
    fn create_goal(&self, input: CreateGoalInput) -> GoalResult<GoalDto>;
    fn update_goal(&self, input: UpdateGoalInput) -> GoalResult<GoalDto>;
    fn update_goal_status(&self, input: UpdateGoalStatusInput) -> GoalResult<GoalDto>;
    fn add_contribution(&self, input: AddContributionInput) -> GoalResult<GoalDto>;
    fn delete_goal(&self, id: &str) -> GoalResult<()>;
    #[allow(dead_code)]
    fn calculate_projection(&self, goal_id: &str) -> GoalResult<(f64, Option<String>)>;
}
