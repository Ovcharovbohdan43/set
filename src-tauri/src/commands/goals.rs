use tauri::{async_runtime::spawn_blocking, State};

use crate::{
    services::{
        AddContributionInput, CreateGoalInput, GoalDto, UpdateGoalInput, UpdateGoalStatusInput,
    },
    state::AppState,
};

#[tauri::command]
pub async fn list_goals(state: State<'_, AppState>) -> Result<Vec<GoalDto>, String> {
    let service = state.services().goal();
    spawn_blocking(move || service.list_goals())
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn get_goal(state: State<'_, AppState>, id: String) -> Result<GoalDto, String> {
    let service = state.services().goal();
    spawn_blocking(move || service.get_goal(&id))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn create_goal(
    state: State<'_, AppState>,
    payload: CreateGoalInput,
) -> Result<GoalDto, String> {
    let service = state.services().goal();
    spawn_blocking(move || service.create_goal(payload))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn update_goal(
    state: State<'_, AppState>,
    payload: UpdateGoalInput,
) -> Result<GoalDto, String> {
    let service = state.services().goal();
    spawn_blocking(move || service.update_goal(payload))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn update_goal_status(
    state: State<'_, AppState>,
    payload: UpdateGoalStatusInput,
) -> Result<GoalDto, String> {
    let service = state.services().goal();
    spawn_blocking(move || service.update_goal_status(payload))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn add_contribution(
    state: State<'_, AppState>,
    payload: AddContributionInput,
) -> Result<GoalDto, String> {
    let service = state.services().goal();
    spawn_blocking(move || service.add_contribution(payload))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn delete_goal(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let service = state.services().goal();
    spawn_blocking(move || service.delete_goal(&id))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

