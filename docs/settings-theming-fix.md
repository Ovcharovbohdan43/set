# Settings Load & Theme Switching Fix

## What Was Broken
- `get_user_settings` / `update_user_settings` failed with “Failed to apply SQLCipher key”, so the General section showed a load error and updates were rejected.
- Because `update_user_settings` failed, theme toggles (light/dark/auto) applied locally then reverted when `ThemeProvider` re-synced with persisted settings.

## Root Cause
- `SqliteSettingsService::connection` required `PRAGMA key` to succeed. The bundled `rusqlite` build lacks SQLCipher, so the pragma fails and the service aborted.
- Transaction service handled the same pragma with a warning and continued unencrypted, which is why other DB paths worked.

## Fix Implemented
- Align settings service behavior with the transaction service: on `PRAGMA key` failure, log a warning and continue without encryption instead of erroring. File: `src-tauri/src/services/settings/sqlite.rs`.
- Add first-run bootstrap for settings service so it runs the canonical migration and seeds the default user before serving requests. New Rust tests cover bootstrap and theme persistence.
- Add schema self-healing for existing databases: if `User.theme_preference` is missing (older DBs), the service now adds the column with default `auto` before reads/writes.

## Outcome
- General settings load without errors.
- `update_user_settings` succeeds again, so theme switching between light/dark/auto persists correctly and no longer reverts.
