use tauri::{async_runtime::spawn_blocking, State};

use crate::{
    services::{
        CreateReminderInput, ReminderDto, SnoozeReminderInput, UpdateReminderInput,
    },
    state::AppState,
};

#[tauri::command]
pub async fn list_reminders(state: State<'_, AppState>) -> Result<Vec<ReminderDto>, String> {
    let service = state.services().reminder();
    spawn_blocking(move || service.list_reminders())
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn get_reminder(
    state: State<'_, AppState>,
    id: String,
) -> Result<ReminderDto, String> {
    let service = state.services().reminder();
    spawn_blocking(move || service.get_reminder(&id))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn create_reminder(
    state: State<'_, AppState>,
    payload: CreateReminderInput,
) -> Result<ReminderDto, String> {
    let service = state.services().reminder();
    spawn_blocking(move || service.create_reminder(payload))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn update_reminder(
    state: State<'_, AppState>,
    payload: UpdateReminderInput,
) -> Result<ReminderDto, String> {
    let service = state.services().reminder();
    spawn_blocking(move || service.update_reminder(payload))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn delete_reminder(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    let service = state.services().reminder();
    spawn_blocking(move || service.delete_reminder(&id))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn snooze_reminder(
    state: State<'_, AppState>,
    payload: SnoozeReminderInput,
) -> Result<ReminderDto, String> {
    let service = state.services().reminder();
    spawn_blocking(move || service.snooze_reminder(payload))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn get_due_reminders(state: State<'_, AppState>) -> Result<Vec<ReminderDto>, String> {
    let service = state.services().reminder();
    spawn_blocking(move || service.get_due_reminders())
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn mark_reminder_sent(
    state: State<'_, AppState>,
    id: String,
) -> Result<ReminderDto, String> {
    let service = state.services().reminder();
    spawn_blocking(move || service.mark_reminder_sent(&id))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

