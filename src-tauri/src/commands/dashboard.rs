use tauri::{async_runtime::spawn_blocking, State};

use crate::{services::DashboardSnapshot, state::AppState};

#[tauri::command]
pub async fn get_dashboard_snapshot(
    state: State<'_, AppState>,
) -> Result<DashboardSnapshot, String> {
    let service = state.services().dashboard();
    spawn_blocking(move || service.snapshot())
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}
