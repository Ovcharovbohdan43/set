mod sqlite;

pub use sqlite::SqliteTransactionService;

use rusqlite;
use serde::{Deserialize, Serialize};
use thiserror::Error;

use super::ServiceDescriptor;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountDto {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub account_type: String,
    pub currency: String,
    pub balance_cents: i64,
    pub available_balance_cents: Option<i64>,
    pub color_token: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryDto {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub category_type: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TransactionDto {
    pub id: String,
    pub account_id: String,
    pub account_name: String,
    pub category_id: Option<String>,
    pub category_name: Option<String>,
    #[serde(rename = "type")]
    pub kind: TransactionKind,
    pub amount_cents: i64,
    pub currency: String,
    pub occurred_on: String,
    pub cleared: bool,
    pub notes: Option<String>,
    pub tags: Vec<String>,
    pub goal_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransactionQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub account_id: Option<String>,
    pub category_id: Option<String>,
    pub search: Option<String>,
}

impl Default for TransactionQuery {
    fn default() -> Self {
        Self {
            limit: Some(50),
            offset: Some(0),
            account_id: None,
            category_id: None,
            search: None,
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTransactionInput {
    #[serde(default)]
    pub id: Option<String>,
    pub account_id: String,
    pub category_id: Option<String>,
    #[serde(rename = "type")]
    pub kind: TransactionKind,
    pub amount_cents: i64,
    pub currency: String,
    #[serde(rename = "occurredOn")]
    pub occurred_on: String,
    pub notes: Option<String>,
    pub tags: Option<Vec<String>>,
    #[serde(default)]
    pub cleared: bool,
    pub goal_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTransactionInput {
    pub id: String,
    pub account_id: String,
    pub category_id: Option<String>,
    #[serde(rename = "type")]
    pub kind: TransactionKind,
    pub amount_cents: i64,
    pub currency: String,
    #[serde(rename = "occurredOn")]
    pub occurred_on: String,
    pub notes: Option<String>,
    pub tags: Option<Vec<String>>,
    #[serde(default)]
    pub cleared: bool,
    pub goal_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportTransactionsInput {
    pub items: Vec<CreateTransactionInput>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum TransactionKind {
    Income,
    Expense,
    Transfer,
}

impl TransactionKind {
    pub fn as_str(&self) -> &'static str {
        match self {
            TransactionKind::Income => "income",
            TransactionKind::Expense => "expense",
            TransactionKind::Transfer => "transfer",
        }
    }

    pub fn balance_delta(&self, amount: i64) -> i64 {
        match self {
            TransactionKind::Income => amount,
            TransactionKind::Expense => -amount,
            TransactionKind::Transfer => 0,
        }
    }
}

#[derive(Debug, Error)]
pub enum TransactionServiceError {
    #[error("database error: {0}")]
    Database(String),
    #[error("not found: {0}")]
    NotFound(String),
    #[error("validation error: {0}")]
    Validation(String),
    #[error("internal error: {0}")]
    Internal(String),
}

pub type TransactionResult<T> = Result<T, TransactionServiceError>;

impl From<rusqlite::Error> for TransactionServiceError {
    fn from(err: rusqlite::Error) -> Self {
        TransactionServiceError::Database(err.to_string())
    }
}

pub trait TransactionService: Send + Sync {
    fn descriptor(&self) -> ServiceDescriptor;
    fn list_accounts(&self, include_balances: bool) -> TransactionResult<Vec<AccountDto>>;
    fn list_categories(&self) -> TransactionResult<Vec<CategoryDto>>;
    fn list_transactions(&self, query: TransactionQuery) -> TransactionResult<Vec<TransactionDto>>;
    fn create_transaction(
        &self,
        input: CreateTransactionInput,
    ) -> TransactionResult<TransactionDto>;
    fn update_transaction(
        &self,
        input: UpdateTransactionInput,
    ) -> TransactionResult<TransactionDto>;
    fn delete_transaction(&self, id: &str) -> TransactionResult<()>;
    fn import_transactions(
        &self,
        items: Vec<CreateTransactionInput>,
    ) -> TransactionResult<Vec<TransactionDto>>;
}
