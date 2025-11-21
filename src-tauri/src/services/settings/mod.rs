mod sqlite;

pub use sqlite::SqliteSettingsService;

use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::services::ServiceDescriptor;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserSettingsDto {
    pub id: String,
    pub email: Option<String>,
    pub display_name: Option<String>,
    pub default_currency: String,
    pub locale: String,
    pub week_starts_on: i32,
    pub telemetry_opt_in: bool,
    pub theme_preference: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserSettingsInput {
    pub default_currency: Option<String>,
    pub locale: Option<String>,
    pub week_starts_on: Option<i32>,
    pub telemetry_opt_in: Option<bool>,
    pub theme_preference: Option<String>,
    pub display_name: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCategoryOrderInput {
    pub category_ids: Vec<String>,
}

#[derive(Debug, Error)]
pub enum SettingsServiceError {
    #[error("database error: {0}")]
    Database(String),
    #[error("not found: {0}")]
    NotFound(String),
    #[error("validation error: {0}")]
    Validation(String),
    #[error("internal error: {0}")]
    Internal(String),
}

pub type SettingsResult<T> = Result<T, SettingsServiceError>;

impl From<rusqlite::Error> for SettingsServiceError {
    fn from(err: rusqlite::Error) -> Self {
        SettingsServiceError::Database(err.to_string())
    }
}

pub trait SettingsService: Send + Sync {
    fn descriptor(&self) -> ServiceDescriptor;
    fn get_user_settings(&self) -> SettingsResult<UserSettingsDto>;
    fn update_user_settings(&self, input: UpdateUserSettingsInput) -> SettingsResult<UserSettingsDto>;
    fn update_category_order(&self, input: UpdateCategoryOrderInput) -> SettingsResult<()>;
}

