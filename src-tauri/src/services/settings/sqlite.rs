use std::path::PathBuf;

use rusqlite::{params, Connection};

use crate::services::ServiceDescriptor;

use super::{
    SettingsResult, SettingsService, SettingsServiceError, UpdateCategoryOrderInput,
    UpdateUserSettingsInput, UserSettingsDto,
};

const DEFAULT_USER_ID: &str = "seed-user";

pub struct SqliteSettingsService {
    db_path: PathBuf,
    db_key: Option<String>,
    user_id: String,
}

impl SqliteSettingsService {
    pub fn new(
        db_path: PathBuf,
        db_key: Option<String>,
        user_id: Option<String>,
    ) -> SettingsResult<Self> {
        let service = Self {
            db_path,
            db_key,
            user_id: user_id.unwrap_or_else(|| DEFAULT_USER_ID.to_string()),
        };
        service.bootstrap()?;
        Ok(service)
    }

    fn connection(&self) -> SettingsResult<Connection> {
        let conn = Connection::open(&self.db_path)
            .map_err(|err| {
                tracing::error!(error = %err, path = %self.db_path.display(), "Failed to open database connection");
                SettingsServiceError::Database(format!("Failed to open database: {}", err))
            })?;

        if let Err(err) = conn.execute("PRAGMA foreign_keys = ON;", []) {
            tracing::error!(error = %err, "Failed to enable foreign keys");
            return Err(SettingsServiceError::Database(format!(
                "Failed to enable foreign keys: {}",
                err
            )));
        }

        if let Some(key) = &self.db_key {
            // Align behavior with transaction service: if SQLCipher is unavailable, log and continue unencrypted
            if let Err(err) = conn.pragma_update(None, "key", key) {
                tracing::warn!(error = %err, "Failed to apply SQLCipher key for settings service; continuing without encryption");
            }
        }

        Ok(conn)
    }

    fn bootstrap(&self) -> SettingsResult<()> {
        let conn = self.connection()?;

        // Ensure schema exists (first-run) using the canonical migration
        self.init_schema(&conn)?;
        // Ensure schema is upgraded to latest shape
        self.ensure_theme_column(&conn)?;

        // Ensure default user exists after schema is ready
        self.ensure_user_exists(&conn)?;

        Ok(())
    }

    fn init_schema(&self, conn: &Connection) -> SettingsResult<()> {
        // Skip if schema already present
        let table_exists: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='User')",
                [],
                |row| row.get(0),
            )
            .unwrap_or(false);

        if table_exists {
            return Ok(());
        }

        conn.execute_batch(include_str!(
            "../../../../prisma/migrations/20251120193838_init/migration.sql"
        ))
        .map_err(|err| {
            tracing::error!(error = %err, "Failed to initialize settings schema from migration");
            SettingsServiceError::Database(format!("Failed to initialize schema: {}", err))
        })?;

        Ok(())
    }

    fn ensure_theme_column(&self, conn: &Connection) -> SettingsResult<()> {
        // Add theme_preference if missing (handles existing DBs created before the column was added)
        let has_column: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM pragma_table_info('User') WHERE name = 'theme_preference')",
                [],
                |row| row.get(0),
            )
            .unwrap_or(false);

        if !has_column {
            conn.execute(
                r#"ALTER TABLE "User" ADD COLUMN theme_preference TEXT DEFAULT 'auto'"#,
                [],
            )
            .map_err(|err| {
                SettingsServiceError::Database(format!(
                    "Failed to add theme_preference column: {}",
                    err
                ))
            })?;
        }

        Ok(())
    }

    fn ensure_user_exists(&self, conn: &Connection) -> SettingsResult<()> {
        let exists: bool = conn
            .query_row(
                r#"SELECT EXISTS(SELECT 1 FROM "User" WHERE id = ?)"#,
                params![self.user_id],
                |row| row.get(0),
            )
            .unwrap_or(false);

        if !exists {
            // Use INSERT OR IGNORE to handle race conditions
            conn.execute(
                r#"INSERT OR IGNORE INTO "User" (id, default_currency, locale, week_starts_on, telemetry_opt_in, theme_preference, created_at, updated_at) VALUES (?, 'USD', 'en-US', 1, 0, 'auto', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"#,
                params![self.user_id],
            )
            .map_err(|err| SettingsServiceError::Database(format!("Failed to create user: {}", err)))?;

            // Verify user was created (or already exists)
            let verify_exists: bool = conn
                .query_row(
                    r#"SELECT EXISTS(SELECT 1 FROM "User" WHERE id = ?)"#,
                    params![self.user_id],
                    |row| row.get(0),
                )
                .unwrap_or(false);

            if !verify_exists {
                return Err(SettingsServiceError::Database(
                    "Failed to create user: user still does not exist after insert".to_string(),
                ));
            }
        }

        Ok(())
    }
}

impl SettingsService for SqliteSettingsService {
    fn descriptor(&self) -> ServiceDescriptor {
        ServiceDescriptor::new("SettingsService", "sqlite")
    }

    fn get_user_settings(&self) -> SettingsResult<UserSettingsDto> {
        let conn = self.connection()?;

        // Check if User table exists
        let table_exists: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='User')",
                [],
                |row| row.get(0),
            )
            .map_err(|err| {
                tracing::error!(error = %err, "Failed to check if User table exists");
                SettingsServiceError::Database(format!("Failed to check table existence: {}", err))
            })?;

        if !table_exists {
            tracing::error!("User table does not exist in database");
            return Err(SettingsServiceError::Database(
                "User table does not exist. Please run database migrations first.".to_string(),
            ));
        }

        self.ensure_user_exists(&conn)?;

        match conn.query_row(
            r#"SELECT id, email, display_name, default_currency, locale, week_starts_on, telemetry_opt_in, COALESCE(theme_preference, 'auto') as theme_preference FROM "User" WHERE id = ?"#,
            params![self.user_id],
            |row| {
                let telemetry_opt_in: i64 = row.get(6)?;
                Ok(UserSettingsDto {
                    id: row.get(0)?,
                    email: row.get::<_, Option<String>>(1)?,
                    display_name: row.get::<_, Option<String>>(2)?,
                    default_currency: row.get(3)?,
                    locale: row.get(4)?,
                    week_starts_on: row.get(5)?,
                    telemetry_opt_in: telemetry_opt_in != 0,
                    theme_preference: Some(row.get(7)?),
                })
            },
        ) {
            Ok(settings) => {
                tracing::debug!(user_id = %self.user_id, "Successfully fetched user settings");
                Ok(settings)
            }
            Err(rusqlite::Error::QueryReturnedNoRows) => {
                tracing::warn!(user_id = %self.user_id, "User not found, attempting to create");
                // User was just created but query failed - try to create again and fetch
                self.ensure_user_exists(&conn)?;
                conn.query_row(
                    r#"SELECT id, email, display_name, default_currency, locale, week_starts_on, telemetry_opt_in, COALESCE(theme_preference, 'auto') as theme_preference FROM "User" WHERE id = ?"#,
                    params![self.user_id],
                    |row| {
                        let telemetry_opt_in: i64 = row.get(6)?;
                        Ok(UserSettingsDto {
                            id: row.get(0)?,
                            email: row.get::<_, Option<String>>(1)?,
                            display_name: row.get::<_, Option<String>>(2)?,
                            default_currency: row.get(3)?,
                            locale: row.get(4)?,
                            week_starts_on: row.get(5)?,
                            telemetry_opt_in: telemetry_opt_in != 0,
                            theme_preference: Some(row.get(7)?),
                        })
                    },
                )
                .map_err(|err| {
                    tracing::error!(error = %err, user_id = %self.user_id, "Failed to fetch user settings after creation");
                    SettingsServiceError::Database(format!("Failed to fetch user settings: {}", err))
                })
            }
            Err(err) => {
                tracing::error!(error = %err, user_id = %self.user_id, "Database error while fetching user settings");
                Err(SettingsServiceError::Database(format!("Failed to fetch user settings: {}", err)))
            }
        }
    }

    fn update_user_settings(
        &self,
        input: UpdateUserSettingsInput,
    ) -> SettingsResult<UserSettingsDto> {
        let conn = self.connection()?;
        self.ensure_user_exists(&conn)?;

        // Execute individual UPDATE statements for each field
        // This avoids dynamic SQL complexity with rusqlite params
        if let Some(currency) = &input.default_currency {
            conn.execute(
                r#"UPDATE "User" SET default_currency = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"#,
                params![currency, self.user_id],
            )
            .map_err(|err| SettingsServiceError::Database(format!("Failed to update currency: {}", err)))?;
        }

        if let Some(locale) = &input.locale {
            conn.execute(
                r#"UPDATE "User" SET locale = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"#,
                params![locale, self.user_id],
            )
            .map_err(|err| {
                SettingsServiceError::Database(format!("Failed to update locale: {}", err))
            })?;
        }

        if let Some(week_starts_on) = input.week_starts_on {
            conn.execute(
                r#"UPDATE "User" SET week_starts_on = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"#,
                params![week_starts_on, self.user_id],
            )
            .map_err(|err| SettingsServiceError::Database(format!("Failed to update week_starts_on: {}", err)))?;
        }

        if let Some(telemetry) = input.telemetry_opt_in {
            let telemetry_int = if telemetry { 1 } else { 0 };
            conn.execute(
                r#"UPDATE "User" SET telemetry_opt_in = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"#,
                params![telemetry_int, self.user_id],
            )
            .map_err(|err| SettingsServiceError::Database(format!("Failed to update telemetry: {}", err)))?;
        }

        if let Some(theme) = &input.theme_preference {
            conn.execute(
                r#"UPDATE "User" SET theme_preference = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"#,
                params![theme, self.user_id],
            )
            .map_err(|err| SettingsServiceError::Database(format!("Failed to update theme: {}", err)))?;
        }

        if let Some(display_name) = &input.display_name {
            conn.execute(
                r#"UPDATE "User" SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"#,
                params![display_name, self.user_id],
            )
            .map_err(|err| SettingsServiceError::Database(format!("Failed to update display_name: {}", err)))?;
        }

        self.get_user_settings()
    }

    fn update_category_order(&self, input: UpdateCategoryOrderInput) -> SettingsResult<()> {
        let mut conn = self.connection()?;

        // Validate all category IDs belong to this user
        let mut valid_count = 0;
        for category_id in &input.category_ids {
            let exists: bool = conn
                .query_row(
                    r#"SELECT EXISTS(SELECT 1 FROM "Category" WHERE id = ? AND user_id = ?)"#,
                    params![category_id, self.user_id],
                    |row| row.get(0),
                )
                .unwrap_or(false);
            if exists {
                valid_count += 1;
            }
        }

        if valid_count != input.category_ids.len() {
            return Err(SettingsServiceError::Validation(
                "Some category IDs do not belong to the user".to_string(),
            ));
        }

        // Update sort_order for each category
        let tx = conn.transaction().map_err(|err| {
            SettingsServiceError::Database(format!("Failed to start transaction: {}", err))
        })?;

        for (index, category_id) in input.category_ids.iter().enumerate() {
            tx.execute(
                r#"UPDATE "Category" SET sort_order = ? WHERE id = ? AND user_id = ?"#,
                params![index as i32, category_id, self.user_id],
            )
            .map_err(|err| {
                SettingsServiceError::Database(format!("Failed to update category order: {}", err))
            })?;
        }

        tx.commit().map_err(|err| {
            SettingsServiceError::Database(format!("Failed to commit transaction: {}", err))
        })?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_temp_service() -> SqliteSettingsService {
        let tmp = tempfile::NamedTempFile::new().unwrap();
        let path = tmp.path().to_path_buf();
        // Keep file alive until service drops
        std::mem::forget(tmp);

        SqliteSettingsService::new(path, None, Some("seed-user".into())).unwrap()
    }

    #[test]
    fn bootstrap_creates_schema_and_user() {
        let service = setup_temp_service();
        let settings = service
            .get_user_settings()
            .expect("settings should load after bootstrap");
        assert_eq!(settings.id, "seed-user");
        assert_eq!(settings.default_currency, "USD");
        assert_eq!(settings.locale, "en-US");
        assert_eq!(settings.week_starts_on, 1);
    }

    #[test]
    fn theme_column_is_added_if_missing() {
        let tmp = tempfile::NamedTempFile::new().unwrap();
        let path = tmp.path().to_path_buf();
        std::mem::forget(tmp);

        // Pre-create a User table without theme_preference to simulate older DB
        let conn = Connection::open(&path).unwrap();
        conn.execute_batch(
            r#"
            CREATE TABLE "User" (
              id TEXT PRIMARY KEY,
              email TEXT,
              display_name TEXT,
              default_currency TEXT NOT NULL,
              locale TEXT NOT NULL DEFAULT 'en-US',
              week_starts_on INTEGER NOT NULL DEFAULT 1,
              telemetry_opt_in INTEGER NOT NULL DEFAULT 0,
              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            INSERT INTO "User" (id, default_currency, locale, week_starts_on, telemetry_opt_in) VALUES ('seed-user', 'USD', 'en-US', 1, 0);
            "#,
        )
        .unwrap();

        // Service bootstrap should add the missing column and still read settings
        let service = SqliteSettingsService::new(path, None, Some("seed-user".into())).unwrap();
        let settings = service.get_user_settings().unwrap();
        assert_eq!(settings.theme_preference.as_deref(), Some("auto"));
    }

    #[test]
    fn update_user_settings_persists_theme() {
        let service = setup_temp_service();
        service
            .update_user_settings(UpdateUserSettingsInput {
                default_currency: None,
                locale: None,
                week_starts_on: None,
                telemetry_opt_in: None,
                theme_preference: Some("light".into()),
                display_name: Some("Test User".into()),
            })
            .expect("update should succeed");

        let settings = service.get_user_settings().unwrap();
        assert_eq!(settings.theme_preference.as_deref(), Some("light"));
        assert_eq!(settings.display_name.as_deref(), Some("Test User"));
    }
}
