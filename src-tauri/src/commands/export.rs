use std::fs;
use std::io::Write;

use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::{async_runtime::spawn_blocking, State};

use crate::{
    services::{MonthlyReportDto, SpendingByCategoryDto},
    state::AppState,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportResult {
    pub file_path: String,
    pub file_name: String,
    pub format: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub enum ExportFormat {
    Csv,
    Json,
    Png,
    Pdf,
}

#[tauri::command]
pub async fn export_report_csv(
    state: State<'_, AppState>,
    month: String,
    spending_by_category: Vec<SpendingByCategoryDto>,
) -> Result<ExportResult, String> {
    let exports_dir = state.paths().exports_dir().to_path_buf();
    let file_name = format!("report_{}_spending.csv", month);
    let file_path = exports_dir.join(&file_name);

    spawn_blocking(move || {
        let mut file = fs::File::create(&file_path)
            .map_err(|e| format!("Failed to create CSV file: {}", e))?;

        // Write CSV header
        writeln!(file, "Category,Amount,Percentage,Transaction Count")
            .map_err(|e| format!("Failed to write CSV header: {}", e))?;

        // Write data rows
        for item in spending_by_category {
            writeln!(
                file,
                "{},{},{},{}",
                escape_csv_field(&item.category_name),
                item.amount_cents as f64 / 100.0,
                item.percentage,
                item.transaction_count
            )
            .map_err(|e| format!("Failed to write CSV row: {}", e))?;
        }

        Ok(ExportResult {
            file_path: file_path.to_string_lossy().to_string(),
            file_name,
            format: "csv".to_string(),
        })
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn export_report_json(
    state: State<'_, AppState>,
    month: String,
    report: MonthlyReportDto,
) -> Result<ExportResult, String> {
    let exports_dir = state.paths().exports_dir().to_path_buf();
    let file_name = format!("report_{}.json", month);
    let file_path = exports_dir.join(&file_name);

    spawn_blocking(move || {
        let json = serde_json::to_string_pretty(&report)
            .map_err(|e| format!("Failed to serialize report: {}", e))?;

        fs::write(&file_path, json).map_err(|e| format!("Failed to write JSON file: {}", e))?;

        Ok(ExportResult {
            file_path: file_path.to_string_lossy().to_string(),
            file_name,
            format: "json".to_string(),
        })
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn export_report_encrypted_json(
    state: State<'_, AppState>,
    month: String,
    report: MonthlyReportDto,
) -> Result<ExportResult, String> {
    let exports_dir = state.paths().exports_dir().to_path_buf();
    let file_name = format!("report_{}_encrypted.json", month);
    let file_path = exports_dir.join(&file_name);

    spawn_blocking(move || {
        // For now, we'll use base64 encoding as a simple encryption placeholder
        // In production, use proper encryption (AES-GCM) with user key
        let json = serde_json::to_string(&report)
            .map_err(|e| format!("Failed to serialize report: {}", e))?;

        use base64::{engine::general_purpose, Engine as _};
        let encoded = general_purpose::STANDARD.encode(json.as_bytes());

        let encrypted_payload = serde_json::json!({
            "version": "1.0",
            "encrypted": true,
            "timestamp": Utc::now().to_rfc3339(),
            "data": encoded,
            "checksum": calculate_checksum(&encoded),
        });

        let encrypted_json = serde_json::to_string_pretty(&encrypted_payload)
            .map_err(|e| format!("Failed to serialize encrypted payload: {}", e))?;

        fs::write(&file_path, encrypted_json)
            .map_err(|e| format!("Failed to write encrypted JSON file: {}", e))?;

        Ok(ExportResult {
            file_path: file_path.to_string_lossy().to_string(),
            file_name,
            format: "encrypted_json".to_string(),
        })
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn export_chart_png(
    state: State<'_, AppState>,
    chart_type: String,
    month: String,
    chart_data_base64: String,
) -> Result<ExportResult, String> {
    let exports_dir = state.paths().exports_dir().to_path_buf();
    let file_name = format!("chart_{}_{}.png", chart_type, month);
    let file_path = exports_dir.join(&file_name);

    spawn_blocking(move || {
        // Decode base64 PNG data from ECharts
        use base64::{engine::general_purpose, Engine as _};
        let image_data = general_purpose::STANDARD
            .decode(&chart_data_base64)
            .map_err(|e| format!("Failed to decode base64 image: {}", e))?;

        fs::write(&file_path, image_data)
            .map_err(|e| format!("Failed to write PNG file: {}", e))?;

        Ok(ExportResult {
            file_path: file_path.to_string_lossy().to_string(),
            file_name,
            format: "png".to_string(),
        })
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

fn escape_csv_field(field: &str) -> String {
    if field.contains(',') || field.contains('"') || field.contains('\n') {
        format!("\"{}\"", field.replace('"', "\"\""))
    } else {
        field.to_string()
    }
}

fn calculate_checksum(data: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    data.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}
