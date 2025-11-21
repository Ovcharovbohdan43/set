use tauri::{async_runtime::spawn_blocking, State};

use crate::{
    services::{UpdateCategoryOrderInput, UpdateUserSettingsInput, UserSettingsDto},
    state::AppState,
};

#[tauri::command]
pub async fn get_user_settings(state: State<'_, AppState>) -> Result<UserSettingsDto, String> {
    let service = state.services().settings();
    spawn_blocking(move || {
        service.get_user_settings().map_err(|err| {
            tracing::error!(error = %err, "Failed to get user settings");
            err.to_string()
        })
    })
    .await
    .map_err(|err| {
        tracing::error!(error = %err, "Failed to spawn blocking task for get_user_settings");
        err.to_string()
    })?
}

#[tauri::command]
pub async fn update_user_settings(
    state: State<'_, AppState>,
    input: UpdateUserSettingsInput,
) -> Result<UserSettingsDto, String> {
    let service = state.services().settings();
    spawn_blocking(move || {
        service.update_user_settings(input).map_err(|err| {
            tracing::error!(error = %err, "Failed to update user settings");
            err.to_string()
        })
    })
    .await
    .map_err(|err| {
        tracing::error!(error = %err, "Failed to spawn blocking task for update_user_settings");
        err.to_string()
    })?
}

#[tauri::command]
pub async fn update_category_order(
    state: State<'_, AppState>,
    input: UpdateCategoryOrderInput,
) -> Result<(), String> {
    let service = state.services().settings();
    spawn_blocking(move || service.update_category_order(input))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

