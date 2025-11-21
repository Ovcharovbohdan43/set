mod sqlite;

pub use sqlite::SqliteBudgetService;

use rusqlite;
use serde::{Deserialize, Serialize};
use thiserror::Error;

use super::ServiceDescriptor;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BudgetDto {
    pub id: String,
    pub user_id: String,
    pub name: String,
    pub period: BudgetPeriod,
    pub budget_type: BudgetType,
    pub category_id: Option<String>,
    pub category_name: Option<String>,
    pub amount_cents: i64,
    pub start_date: String,
    pub end_date: String,
    pub rollover: bool,
    pub alert_threshold: f64,
    pub spent_cents: i64,
    pub remaining_cents: i64,
    pub progress_percent: f64,
    pub status: BudgetStatus,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum BudgetPeriod {
    Weekly,
    Monthly,
    Quarterly,
    Yearly,
}

impl BudgetPeriod {
    pub fn as_str(&self) -> &'static str {
        match self {
            BudgetPeriod::Weekly => "weekly",
            BudgetPeriod::Monthly => "monthly",
            BudgetPeriod::Quarterly => "quarterly",
            BudgetPeriod::Yearly => "yearly",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum BudgetType {
    Envelope,
    Overall,
}

impl BudgetType {
    pub fn as_str(&self) -> &'static str {
        match self {
            BudgetType::Envelope => "envelope",
            BudgetType::Overall => "overall",
        }
    }
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum BudgetStatus {
    Normal,
    AtRisk,
    Over,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBudgetInput {
    pub name: String,
    pub period: BudgetPeriod,
    pub budget_type: BudgetType,
    pub category_id: Option<String>,
    pub amount_cents: i64,
    pub start_date: String,
    pub end_date: String,
    pub rollover: bool,
    pub alert_threshold: Option<f64>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateBudgetInput {
    pub id: String,
    pub name: Option<String>,
    pub period: Option<BudgetPeriod>,
    pub budget_type: Option<BudgetType>,
    pub category_id: Option<String>,
    pub amount_cents: Option<i64>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub rollover: Option<bool>,
    pub alert_threshold: Option<f64>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BudgetEntryDto {
    pub id: String,
    pub budget_id: String,
    pub actual_cents: i64,
    pub projected_cents: i64,
    pub snapshot_date: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordSnapshotInput {
    pub budget_id: String,
    pub actual_cents: i64,
    pub projected_cents: i64,
    pub snapshot_date: String,
}

#[derive(Debug, Error)]
pub enum BudgetServiceError {
    #[error("database error: {0}")]
    Database(String),
    #[error("not found: {0}")]
    NotFound(String),
    #[error("validation error: {0}")]
    Validation(String),
    #[error("internal error: {0}")]
    Internal(String),
}

pub type BudgetResult<T> = Result<T, BudgetServiceError>;

impl From<rusqlite::Error> for BudgetServiceError {
    fn from(err: rusqlite::Error) -> Self {
        BudgetServiceError::Database(err.to_string())
    }
}

pub trait BudgetService: Send + Sync {
    fn descriptor(&self) -> ServiceDescriptor;
    fn list_budgets(&self) -> BudgetResult<Vec<BudgetDto>>;
    fn get_budget(&self, id: &str) -> BudgetResult<BudgetDto>;
    fn create_budget(&self, input: CreateBudgetInput) -> BudgetResult<BudgetDto>;
    fn update_budget(&self, input: UpdateBudgetInput) -> BudgetResult<BudgetDto>;
    fn delete_budget(&self, id: &str) -> BudgetResult<()>;
    fn record_snapshot(&self, input: RecordSnapshotInput) -> BudgetResult<BudgetEntryDto>;
    #[allow(dead_code)]
    fn calculate_budget_progress(&self, budget_id: &str) -> BudgetResult<(i64, i64, f64, BudgetStatus)>;
}

