use serde::Deserialize;
use tauri::{async_runtime::spawn_blocking, State};

use crate::{
    services::{
        AccountDto, CategoryDto, CreateTransactionInput, ImportTransactionsInput, TransactionDto,
        TransactionQuery, UpdateTransactionInput,
    },
    state::AppState,
};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListAccountsPayload {
    #[serde(default = "default_include_balances")]
    pub include_balances: bool,
}

fn default_include_balances() -> bool {
    true
}

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct DeleteTransactionPayload {
    pub id: String,
}

#[tauri::command]
pub async fn list_accounts(
    state: State<'_, AppState>,
    payload: Option<ListAccountsPayload>,
) -> Result<Vec<AccountDto>, String> {
    let include = payload
        .map(|p| p.include_balances)
        .unwrap_or_else(default_include_balances);
    let service = state.services().transaction();
    spawn_blocking(move || service.list_accounts(include))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn list_categories(state: State<'_, AppState>) -> Result<Vec<CategoryDto>, String> {
    let service = state.services().transaction();
    spawn_blocking(move || service.list_categories())
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn list_transactions(
    state: State<'_, AppState>,
    payload: Option<TransactionQuery>,
) -> Result<Vec<TransactionDto>, String> {
    let query = payload.unwrap_or_default();
    let service = state.services().transaction();
    spawn_blocking(move || service.list_transactions(query))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn create_transaction(
    state: State<'_, AppState>,
    payload: CreateTransactionInput,
) -> Result<TransactionDto, String> {
    let service = state.services().transaction();
    spawn_blocking(move || service.create_transaction(payload))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn update_transaction(
    state: State<'_, AppState>,
    payload: UpdateTransactionInput,
) -> Result<TransactionDto, String> {
    let service = state.services().transaction();
    spawn_blocking(move || service.update_transaction(payload))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn delete_transaction(
    state: State<'_, AppState>,
    payload: DeleteTransactionPayload,
) -> Result<(), String> {
    let service = state.services().transaction();
    spawn_blocking(move || service.delete_transaction(&payload.id))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn import_transactions(
    state: State<'_, AppState>,
    payload: ImportTransactionsInput,
) -> Result<Vec<TransactionDto>, String> {
    let service = state.services().transaction();
    spawn_blocking(move || service.import_transactions(payload.items))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}
