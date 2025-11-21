use tauri::{async_runtime::spawn_blocking, State};

use crate::{
    services::{SyncDownloadInput, SyncDownloadResult, SyncUploadInput, SyncUploadResult},
    state::AppState,
};

#[tauri::command(rename = "syncUpload")]
pub async fn sync_upload(
    state: State<'_, AppState>,
    input: SyncUploadInput,
) -> Result<SyncUploadResult, String> {
    let service = state.services().sync();
    spawn_blocking(move || {
        service.upload(input).map_err(|err| {
            tracing::error!(error = %err, "Sync upload failed");
            err.to_string()
        })
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command(rename = "syncDownload")]
pub async fn sync_download(
    state: State<'_, AppState>,
    input: SyncDownloadInput,
) -> Result<SyncDownloadResult, String> {
    let service = state.services().sync();
    spawn_blocking(move || {
        service.download(input).map_err(|err| {
            tracing::error!(error = %err, "Sync download failed");
            err.to_string()
        })
    })
    .await
    .map_err(|err| err.to_string())?
}
