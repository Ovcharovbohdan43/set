use std::{
    fs::{self, OpenOptions},
    path::Path,
    sync::OnceLock,
};

use tauri::AppHandle;
use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::{fmt, EnvFilter};

static GUARD: OnceLock<WorkerGuard> = OnceLock::new();

pub fn init_logging(app: &AppHandle, logs_dir: &Path) -> tauri::Result<()> {
    fs::create_dir_all(logs_dir)?;
    let log_path = logs_dir.join("app.log");

    let file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_path)?;

    let (writer, guard) = tracing_appender::non_blocking(file);
    GUARD.set(guard).ok();

    let env_filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    fmt()
        .with_env_filter(env_filter)
        .json()
        .with_writer(writer)
        .init();

    let app_name = app
        .config()
        .product_name
        .clone()
        .unwrap_or_else(|| app.package_info().name.clone());

    tracing::info!(app = %app_name, "Structured logging initialized");

    Ok(())
}
