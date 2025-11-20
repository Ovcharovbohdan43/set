use std::{
    io,
    path::{Path, PathBuf},
};

use serde::Serialize;
use tauri::{AppHandle, Manager};
use url::Url;
use urlencoding::encode;

use crate::{secrets::AppSecrets, services::ServiceRegistry};

#[derive(Debug, Clone)]
pub struct PathState {
    data_dir: PathBuf,
    storage_dir: PathBuf,
    attachments_dir: PathBuf,
    logs_dir: PathBuf,
    exports_dir: PathBuf,
    db_path: PathBuf,
    secrets_file: PathBuf,
}

impl PathState {
    pub fn initialize(app: &AppHandle) -> tauri::Result<Self> {
        let resolver = app.path();
        let data_dir = resolver
            .app_data_dir()?
            .join(app.package_info().name.clone())
            .join("FinanceApp");

        let storage_dir = data_dir.join("storage");
        let attachments_dir = storage_dir.join("attachments");
        let logs_dir = storage_dir.join("logs");
        let exports_dir = storage_dir.join("exports");
        let db_path = storage_dir.join("app.db");
        let secrets_file = data_dir.join("config").join("secrets.json");

        std::fs::create_dir_all(&storage_dir)?;
        std::fs::create_dir_all(&attachments_dir)?;
        std::fs::create_dir_all(&logs_dir)?;
        std::fs::create_dir_all(&exports_dir)?;
        if let Some(parent) = secrets_file.parent() {
            std::fs::create_dir_all(parent)?;
        }

        Ok(Self {
            data_dir,
            storage_dir,
            attachments_dir,
            logs_dir,
            exports_dir,
            db_path,
            secrets_file,
        })
    }

    pub fn db_path(&self) -> &Path {
        &self.db_path
    }

    pub fn logs_dir(&self) -> &Path {
        &self.logs_dir
    }

    pub fn secrets_file(&self) -> &Path {
        &self.secrets_file
    }

    pub fn database_url(&self, key: &str) -> tauri::Result<String> {
        let mut url = Url::from_file_path(&self.db_path).map_err(|_| {
            tauri::Error::Io(io::Error::other("failed to build SQLCipher database URL"))
        })?;

        let encoded_key = encode(key);
        let query = format!(
            "cipher=sqlcipher&kdf_iter=256000&cipher_page_size=1024&mode=rwc&cache=shared&key={}",
            encoded_key
        );
        url.set_query(Some(&query));

        Ok(url.to_string())
    }

    pub fn summary(&self) -> PathSummary {
        PathSummary {
            data: self.data_dir.to_string_lossy().to_string(),
            storage: self.storage_dir.to_string_lossy().to_string(),
            attachments: self.attachments_dir.to_string_lossy().to_string(),
            logs: self.logs_dir.to_string_lossy().to_string(),
            exports: self.exports_dir.to_string_lossy().to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PathSummary {
    pub data: String,
    pub storage: String,
    pub attachments: String,
    pub logs: String,
    pub exports: String,
}

pub struct AppState {
    paths: PathState,
    #[allow(dead_code)]
    secrets: AppSecrets,
    services: ServiceRegistry,
    #[allow(dead_code)]
    database_url: String,
}

impl AppState {
    pub fn new(
        paths: PathState,
        secrets: AppSecrets,
        services: ServiceRegistry,
        database_url: String,
    ) -> Self {
        Self {
            paths,
            secrets,
            services,
            database_url,
        }
    }

    pub fn paths(&self) -> &PathState {
        &self.paths
    }

    #[allow(dead_code)]
    pub fn secrets(&self) -> &AppSecrets {
        &self.secrets
    }

    pub fn services(&self) -> &ServiceRegistry {
        &self.services
    }

    #[allow(dead_code)]
    pub fn database_url(&self) -> &str {
        &self.database_url
    }
}
