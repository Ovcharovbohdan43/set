use tauri::{async_runtime::spawn_blocking, State};

use crate::{
    services::{
        BudgetDto, BudgetEntryDto, CreateBudgetInput, RecordSnapshotInput, UpdateBudgetInput,
    },
    state::AppState,
};

#[tauri::command]
pub async fn list_budgets(state: State<'_, AppState>) -> Result<Vec<BudgetDto>, String> {
    let service = state.services().budget();
    spawn_blocking(move || service.list_budgets())
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn get_budget(state: State<'_, AppState>, id: String) -> Result<BudgetDto, String> {
    let service = state.services().budget();
    spawn_blocking(move || service.get_budget(&id))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn create_budget(
    state: State<'_, AppState>,
    payload: CreateBudgetInput,
) -> Result<BudgetDto, String> {
    let service = state.services().budget();
    spawn_blocking(move || service.create_budget(payload))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn update_budget(
    state: State<'_, AppState>,
    payload: UpdateBudgetInput,
) -> Result<BudgetDto, String> {
    let service = state.services().budget();
    spawn_blocking(move || service.update_budget(payload))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn delete_budget(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let service = state.services().budget();
    spawn_blocking(move || service.delete_budget(&id))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn record_snapshot(
    state: State<'_, AppState>,
    payload: RecordSnapshotInput,
) -> Result<BudgetEntryDto, String> {
    let service = state.services().budget();
    spawn_blocking(move || service.record_snapshot(payload))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}
