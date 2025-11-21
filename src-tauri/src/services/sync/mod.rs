use std::path::PathBuf;

use base64::engine::general_purpose::STANDARD as Base64;
use base64::Engine;
use chrono::{SecondsFormat, Utc};
use hmac::{Hmac, Mac};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use thiserror::Error;

use crate::services::ServiceDescriptor;

type HmacSha256 = Hmac<Sha256>;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncDelta {
    pub entity: String,
    pub version: String,
    pub checksum: String,
    pub payload: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncEnvelope {
    pub cursor: String,
    pub deltas: Vec<SyncDelta>,
    pub encrypted_payload: String,
    pub signature: String,
    pub jwt_used: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncUploadInput {
    pub cursor: Option<String>,
    pub jwt: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncUploadResult {
    pub envelope: SyncEnvelope,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncConflict {
    pub entity: String,
    pub id: String,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncDownloadInput {
    pub cursor: Option<String>,
    pub jwt: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncDownloadResult {
    pub envelope: SyncEnvelope,
    pub applied: usize,
    pub conflicts: Vec<SyncConflict>,
}

#[derive(Debug, Error)]
pub enum SyncServiceError {
    #[error("database error: {0}")]
    Database(String),
    #[error("internal error: {0}")]
    Internal(String),
    #[error("unavailable: {0}")]
    Unavailable(String),
}

pub type SyncServiceResult<T> = Result<T, SyncServiceError>;

impl From<rusqlite::Error> for SyncServiceError {
    fn from(err: rusqlite::Error) -> Self {
        SyncServiceError::Database(err.to_string())
    }
}

pub trait SyncService: Send + Sync {
    fn descriptor(&self) -> ServiceDescriptor;
    fn upload(&self, input: SyncUploadInput) -> SyncServiceResult<SyncUploadResult>;
    fn download(&self, input: SyncDownloadInput) -> SyncServiceResult<SyncDownloadResult>;
}

#[derive(Clone)]
pub struct SqliteSyncService {
    db_path: PathBuf,
    key: Option<String>,
    remote_base_url: Option<String>,
}

impl SqliteSyncService {
    pub fn new(
        db_path: PathBuf,
        key: Option<String>,
        remote_base_url: Option<String>,
    ) -> SyncServiceResult<Self> {
        let service = Self {
            db_path,
            key,
            remote_base_url,
        };
        service.bootstrap()?;
        Ok(service)
    }

    fn bootstrap(&self) -> SyncServiceResult<()> {
        let mut conn = self.conn()?;
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS sync_state (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                entity_name TEXT NOT NULL,
                last_local_change DATETIME,
                last_remote_cursor TEXT,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, entity_name)
            );
            ",
        )?;
        Ok(())
    }

    fn conn(&self) -> SyncServiceResult<Connection> {
        let mut conn = Connection::open(&self.db_path)?;
        if let Some(key) = &self.key {
            conn.pragma_update(None, "key", key.as_str())
                .map_err(|err| SyncServiceError::Internal(err.to_string()))?;
        }
        Ok(conn)
    }

    fn now_iso() -> String {
        Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true)
    }

    fn checksum_for(payload: &serde_json::Value) -> String {
        let mut mac = HmacSha256::new_from_slice(b"sync-local").expect("hmac init");
        mac.update(payload.to_string().as_bytes());
        Base64.encode(mac.finalize().into_bytes())
    }

    fn signature(secret: &str, body: &str) -> String {
        let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).unwrap_or_else(|_| {
            HmacSha256::new_from_slice(b"sync-default").expect("hmac init fallback")
        });
        mac.update(body.as_bytes());
        Base64.encode(mac.finalize().into_bytes())
    }

    fn snapshot_entities(&self, conn: &Connection) -> SyncServiceResult<Vec<SyncDelta>> {
        let entities = vec![
            ("transaction", "select count(*), max(updated_at) from transaction"),
            ("budget", "select count(*), max(start_date) from budget"),
            ("goal", "select count(*), max(updated_at) from goal"),
            ("reminder", "select count(*), max(updated_at) from reminder"),
            ("report_cache", "select count(*), max(updated_at) from report_cache"),
            ("sync_state", "select count(*), max(updated_at) from sync_state"),
        ];

        let mut deltas = Vec::new();
        for (entity, query) in entities {
            let (count, raw_updated) = match conn.prepare(query) {
                Ok(mut stmt) => {
                    let mut rows = stmt.query([])?;
                    let row = rows.next()?;
                    if let Some(row) = row {
                        (row.get(0)?, row.get(1)?)
                    } else {
                        (0_i64, None)
                    }
                }
                Err(_) => (0_i64, None),
            };

            let last_updated = raw_updated.unwrap_or_else(|| "1970-01-01T00:00:00Z".to_string());
            let payload = serde_json::json!({
                "count": count,
                "lastUpdated": last_updated,
                "remoteBase": self.remote_base_url.clone().unwrap_or_else(|| "local".into()),
            });
            deltas.push(SyncDelta {
                entity: entity.to_string(),
                version: Self::now_iso(),
                checksum: Self::checksum_for(&payload),
                payload,
            });
        }

        Ok(deltas)
    }

    fn persist_state(&self, conn: &Connection, cursor: &str, deltas: &[SyncDelta]) -> SyncServiceResult<()> {
        for delta in deltas {
            conn.execute(
                "
                INSERT INTO sync_state (id, user_id, entity_name, last_local_change, last_remote_cursor, updated_at)
                VALUES (?1, ?2, ?3, ?4, ?5, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id, entity_name) DO UPDATE SET
                    last_local_change = excluded.last_local_change,
                    last_remote_cursor = excluded.last_remote_cursor,
                    updated_at = CURRENT_TIMESTAMP
                ",
                params![
                    format!("{}-{}", delta.entity, "local"),
                    "local-user",
                    delta.entity,
                    cursor,
                    cursor
                ],
            )?;
        }
        Ok(())
    }

    fn build_envelope(&self, cursor: String, deltas: Vec<SyncDelta>, jwt: Option<String>) -> SyncEnvelope {
        let encrypted_payload = {
            let serialized = serde_json::to_vec(&deltas).unwrap_or_default();
            Base64.encode(serialized)
        };
        let signature_secret = jwt.clone().unwrap_or_else(|| "local-dev".to_string());
        let signature = Self::signature(&signature_secret, &encrypted_payload);

        SyncEnvelope {
            cursor,
            deltas,
            encrypted_payload,
            signature,
            jwt_used: jwt.is_some(),
        }
    }
}

impl SyncService for SqliteSyncService {
    fn descriptor(&self) -> ServiceDescriptor {
        ServiceDescriptor::new("SyncService", "sqlite")
    }

    fn upload(&self, input: SyncUploadInput) -> SyncServiceResult<SyncUploadResult> {
        let cursor = input.cursor.unwrap_or_else(Self::now_iso);
        let mut conn = self.conn()?;
        let deltas = self.snapshot_entities(&conn)?;
        self.persist_state(&conn, &cursor, &deltas)?;

        let envelope = self.build_envelope(cursor, deltas, input.jwt);
        Ok(SyncUploadResult { envelope })
    }

    fn download(&self, input: SyncDownloadInput) -> SyncServiceResult<SyncDownloadResult> {
        let cursor = input.cursor.unwrap_or_else(Self::now_iso);
        let mut conn = self.conn()?;
        let deltas = self.snapshot_entities(&conn)?;
        self.persist_state(&conn, &cursor, &deltas)?;

        let envelope = self.build_envelope(cursor.clone(), deltas.clone(), input.jwt.clone());
        Ok(SyncDownloadResult {
            envelope,
            applied: deltas.len(),
            conflicts: Vec::new(),
        })
    }
}

#[cfg(test)]
mod tests {
    use rusqlite::params;
    use tempfile::NamedTempFile;

    use super::*;

    fn seed_db(path: &PathBuf) {
        let conn = Connection::open(path).expect("open test db");
        conn.execute_batch(
            "
            CREATE TABLE \"transaction\" (id TEXT PRIMARY KEY, updated_at DATETIME);
            CREATE TABLE goal (id TEXT PRIMARY KEY, updated_at DATETIME);
            CREATE TABLE reminder (id TEXT PRIMARY KEY, updated_at DATETIME);
            CREATE TABLE budget (id TEXT PRIMARY KEY, start_date DATETIME);
            CREATE TABLE report_cache (id TEXT PRIMARY KEY, updated_at DATETIME);
            CREATE TABLE sync_state (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                entity_name TEXT NOT NULL,
                last_local_change DATETIME,
                last_remote_cursor TEXT,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, entity_name)
            );
            ",
        )
        .unwrap();
        conn.execute(
            r#"INSERT INTO "transaction" (id, updated_at) VALUES (?1, datetime('now'))"#,
            params!["t1"],
        )
        .unwrap();
    }

    #[test]
    fn upload_generates_deltas() {
        let tmp = NamedTempFile::new().unwrap();
        let path = tmp.path().to_path_buf();
        seed_db(&path);

        let service = SqliteSyncService::new(path, None, None).unwrap();
        let result = service
            .upload(SyncUploadInput {
                cursor: None,
                jwt: Some("secret".into()),
            })
            .unwrap();

        assert!(!result.envelope.deltas.is_empty());
        assert!(result.envelope.jwt_used);
        assert!(!result.envelope.encrypted_payload.is_empty());
        assert!(!result.envelope.signature.is_empty());
    }

    #[test]
    fn download_updates_state() {
        let tmp = NamedTempFile::new().unwrap();
        let path = tmp.path().to_path_buf();
        seed_db(&path);

        let service = SqliteSyncService::new(path, None, None).unwrap();
        let result = service
            .download(SyncDownloadInput {
                cursor: Some("cursor-1".into()),
                jwt: None,
            })
            .unwrap();

        assert_eq!(result.applied, result.envelope.deltas.len());
        let conn = service.conn().unwrap();
        let count: i64 = conn
            .query_row("select count(*) from sync_state", [], |row| row.get(0))
            .unwrap();
        assert!(count >= 1);
    }
}
