#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod logging;
mod scheduler;
mod secrets;
mod services;
mod state;

use std::{env, io};

use services::{
    ServiceRegistry, SqliteBudgetService, SqliteDashboardService, SqliteGoalService,
    SqliteReminderService, SqliteReportService, SqliteSettingsService, SqliteSyncService,
    SqliteTransactionService,
};
use state::PathState;
use tauri::Manager;
use scheduler::ReminderScheduler;

#[allow(clippy::needless_borrow)]
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let app_handle = app.handle();
            let paths = PathState::initialize(&app_handle)?;
            logging::init_logging(&app_handle, paths.logs_dir())?;

            let service_name = app.config().identifier.clone();
            let secrets = secrets::load_or_create(&service_name, paths.secrets_file())
                .map_err(|err| tauri::Error::Io(io::Error::other(err.to_string())))?;

            let database_url = paths.database_url(secrets.sqlcipher_key())?;
            env::set_var("DATABASE_URL", &database_url);
            env::set_var(
                "PF_APP_DB_PATH",
                paths.db_path().to_string_lossy().to_string(),
            );

            let transaction_service = SqliteTransactionService::new(
                paths.db_path().to_path_buf(),
                Some(secrets.sqlcipher_key().to_string()),
                None,
            )
            .map_err(|err| tauri::Error::Io(io::Error::other(err.to_string())))?;

            let dashboard_service = SqliteDashboardService::new(
                paths.db_path().to_path_buf(),
                Some(secrets.sqlcipher_key().to_string()),
                None,
            )
            .map_err(|err| tauri::Error::Io(io::Error::other(err.to_string())))?;

            let budget_service = SqliteBudgetService::new(
                paths.db_path().to_path_buf(),
                Some(secrets.sqlcipher_key().to_string()),
                None,
            )
            .map_err(|err| tauri::Error::Io(io::Error::other(err.to_string())))?;

            let goal_service = SqliteGoalService::new(
                paths.db_path().to_path_buf(),
                Some(secrets.sqlcipher_key().to_string()),
                None,
            )
            .map_err(|err| tauri::Error::Io(io::Error::other(err.to_string())))?;

            let reminder_service = SqliteReminderService::new(
                paths.db_path().to_path_buf(),
                Some(secrets.sqlcipher_key().to_string()),
                None,
            )
            .map_err(|err| tauri::Error::Io(io::Error::other(err.to_string())))?;

            // Create a second instance for scheduler (lightweight, only stores path and key)
            let reminder_service_for_scheduler = SqliteReminderService::new(
                paths.db_path().to_path_buf(),
                Some(secrets.sqlcipher_key().to_string()),
                None,
            )
            .map_err(|err| tauri::Error::Io(io::Error::other(err.to_string())))?;

            let report_service = SqliteReportService::new(
                paths.db_path().to_path_buf(),
                Some(secrets.sqlcipher_key().to_string()),
                None,
            )
            .map_err(|err| tauri::Error::Io(io::Error::other(err.to_string())))?;

            let settings_service = SqliteSettingsService::new(
                paths.db_path().to_path_buf(),
                Some(secrets.sqlcipher_key().to_string()),
                None,
            )
            .map_err(|err| tauri::Error::Io(io::Error::other(err.to_string())))?;

            let sync_service = SqliteSyncService::new(
                paths.db_path().to_path_buf(),
                Some(secrets.sqlcipher_key().to_string()),
                std::env::var("PF_SYNC_ENDPOINT").ok(),
            )
            .map_err(|err| tauri::Error::Io(io::Error::other(err.to_string())))?;

            let services = ServiceRegistry::builder()
                .with_transaction(transaction_service)
                .with_dashboard(dashboard_service)
                .with_budget(budget_service)
                .with_goal(goal_service)
                .with_reminder(reminder_service)
                .with_report(report_service)
                .with_settings(settings_service)
                .with_sync(sync_service)
                .build();
            let app_state = state::AppState::new(paths, secrets, services, database_url);
            app.manage(app_state);

            let app_name = app
                .config()
                .product_name
                .clone()
                .unwrap_or_else(|| app.package_info().name.clone());

            tracing::info!(app = %app_name, "Tauri shell initialized");

            // Start reminder scheduler
            let app_handle_clone = app.handle().clone();
            let reminder_service_arc = std::sync::Arc::new(reminder_service_for_scheduler);
            let scheduler = ReminderScheduler::new(reminder_service_arc, app_handle_clone);
            tauri::async_runtime::spawn(async move {
                scheduler.start_polling().await;
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::ping,
            commands::list_accounts,
            commands::list_categories,
            commands::list_transactions,
            commands::create_transaction,
            commands::update_transaction,
            commands::delete_transaction,
            commands::import_transactions,
            commands::get_dashboard_snapshot,
            commands::list_budgets,
            commands::get_budget,
            commands::create_budget,
            commands::update_budget,
            commands::delete_budget,
            commands::record_snapshot,
            commands::list_goals,
            commands::get_goal,
            commands::create_goal,
            commands::update_goal,
            commands::update_goal_status,
            commands::add_contribution,
            commands::delete_goal,
            commands::list_reminders,
            commands::get_reminder,
            commands::create_reminder,
            commands::update_reminder,
            commands::delete_reminder,
            commands::snooze_reminder,
            commands::get_due_reminders,
            commands::mark_reminder_sent,
            commands::get_monthly_report,
            commands::get_spending_by_category,
            commands::get_monthly_trend,
            commands::invalidate_report_cache,
            commands::export_report_csv,
            commands::export_report_json,
            commands::export_report_encrypted_json,
            commands::export_chart_png,
            commands::get_user_settings,
            commands::update_user_settings,
            commands::update_category_order,
            commands::read_import_file,
            commands::decrypt_encrypted_json,
            commands::sync_upload,
            commands::sync_download
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
