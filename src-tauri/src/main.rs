#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod logging;
mod secrets;
mod services;
mod state;

use std::{env, io};

use services::{ServiceRegistry, SqliteTransactionService};
use state::PathState;
use tauri::Manager;

#[allow(clippy::needless_borrow)]
fn main() {
    tauri::Builder::default()
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

            let services = ServiceRegistry::builder()
                .with_transaction(transaction_service)
                .build();
            let app_state = state::AppState::new(paths, secrets, services, database_url);
            app.manage(app_state);

            let app_name = app
                .config()
                .product_name
                .clone()
                .unwrap_or_else(|| app.package_info().name.clone());

            tracing::info!(app = %app_name, "Tauri shell initialized");

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
            commands::import_transactions
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
