use std::fs;

use serde::{Deserialize, Serialize};
use tauri::{async_runtime::spawn_blocking, State};

use crate::state::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportFileResult {
    pub contents: String,
    pub format: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadImportFilePayload {
    pub file_path: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DecryptEncryptedJsonPayload {
    pub file_path: String,
}

#[tauri::command]
pub async fn read_import_file(
    _state: State<'_, AppState>,
    payload: ReadImportFilePayload,
) -> Result<ImportFileResult, String> {
    let file_path = payload.file_path.clone();

    spawn_blocking(move || {
        // Read file contents
        let contents = fs::read_to_string(&file_path)
            .map_err(|e| format!("Failed to read file: {}", e))?;

        // Determine format from file extension
        let format = if file_path.ends_with(".csv") {
            "csv"
        } else if file_path.ends_with(".json") {
            "json"
        } else {
            return Err("Unsupported file format. Only CSV and JSON are supported.".to_string());
        };

        Ok(ImportFileResult {
            contents,
            format: format.to_string(),
        })
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn decrypt_encrypted_json(
    _state: State<'_, AppState>,
    payload: DecryptEncryptedJsonPayload,
) -> Result<String, String> {
    let file_path = payload.file_path.clone();

    spawn_blocking(move || {
        // Read encrypted JSON file
        let contents = fs::read_to_string(&file_path)
            .map_err(|e| format!("Failed to read encrypted JSON file: {}", e))?;

        // Parse encrypted JSON wrapper
        let encrypted_wrapper: serde_json::Value = serde_json::from_str(&contents)
            .map_err(|e| format!("Failed to parse encrypted JSON: {}", e))?;

        // Verify encrypted flag
        let is_encrypted = encrypted_wrapper
            .get("encrypted")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

        if !is_encrypted {
            return Err("File is not marked as encrypted".to_string());
        }

        // Decode base64 data
        let encoded_data = encrypted_wrapper
            .get("data")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "Missing encrypted data field".to_string())?;

        // Verify checksum
        let expected_checksum = encrypted_wrapper
            .get("checksum")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "Missing checksum field".to_string())?;

        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        let mut hasher = DefaultHasher::new();
        encoded_data.hash(&mut hasher);
        let calculated_checksum = format!("{:x}", hasher.finish());

        if calculated_checksum != expected_checksum {
            return Err("Checksum verification failed - file may be corrupted or tampered".to_string());
        }

        // Decode base64
        use base64::{Engine as _, engine::general_purpose};
        let decoded_bytes = general_purpose::STANDARD
            .decode(encoded_data)
            .map_err(|e| format!("Failed to decode base64 data: {}", e))?;

        // Return decrypted JSON string
        String::from_utf8(decoded_bytes)
            .map_err(|e| format!("Failed to convert decrypted data to string: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

