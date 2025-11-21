use tauri::{async_runtime::spawn_blocking, State};

use crate::{
    services::{MonthlyReportDto, MonthlyTrendDto, SpendingByCategoryDto},
    state::AppState,
};

#[tauri::command]
pub async fn get_monthly_report(
    state: State<'_, AppState>,
    month: String,
) -> Result<MonthlyReportDto, String> {
    let service = state.services().report();
    spawn_blocking(move || service.get_monthly_report(&month))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn get_spending_by_category(
    state: State<'_, AppState>,
    start_date: String,
    end_date: String,
) -> Result<Vec<SpendingByCategoryDto>, String> {
    let service = state.services().report();
    spawn_blocking(move || service.get_spending_by_category(&start_date, &end_date))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn get_monthly_trend(
    state: State<'_, AppState>,
    months: i32,
) -> Result<Vec<MonthlyTrendDto>, String> {
    let service = state.services().report();
    spawn_blocking(move || service.get_monthly_trend(months))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn invalidate_report_cache(
    state: State<'_, AppState>,
    key_prefix: Option<String>,
) -> Result<(), String> {
    let service = state.services().report();
    spawn_blocking(move || service.invalidate_cache(key_prefix.as_deref()))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

