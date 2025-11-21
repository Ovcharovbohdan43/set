use std::path::PathBuf;

use chrono::{DateTime, Utc};
use rusqlite::{params, params_from_iter, Connection};
use uuid::Uuid;

use crate::services::ServiceDescriptor;

use super::{
    AccountDto, CategoryDto, CreateTransactionInput, TransactionDto, TransactionKind,
    TransactionQuery, TransactionResult, TransactionService, TransactionServiceError,
    UpdateTransactionInput,
};

const DEFAULT_USER_ID: &str = "seed-user";

pub struct SqliteTransactionService {
    db_path: PathBuf,
    db_key: Option<String>,
    user_id: String,
}

impl SqliteTransactionService {
    pub fn new(
        db_path: PathBuf,
        db_key: Option<String>,
        user_id: Option<String>,
    ) -> TransactionResult<Self> {
        let service = Self {
            db_path,
            db_key,
            user_id: user_id.unwrap_or_else(|| DEFAULT_USER_ID.to_string()),
        };
        service.bootstrap()?;
        Ok(service)
    }

    fn bootstrap(&self) -> TransactionResult<()> {
        let conn = self.connection()?;
        self.init_schema(&conn)?;
        self.recalculate_account_balances(&conn)?;
        Ok(())
    }

    fn init_schema(&self, conn: &Connection) -> TransactionResult<()> {
        // Check if schema already exists
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

        // Initialize schema
        conn.execute_batch(include_str!("../../../../prisma/migrations/20251120193838_init/migration.sql"))
            .map_err(|err| TransactionServiceError::Database(format!("Failed to initialize schema: {}", err)))?;

        // Create default user if not exists
        let user_exists: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM \"User\" WHERE id = ?)",
                params![self.user_id],
                |row| row.get(0),
            )
            .unwrap_or(false);

        if !user_exists {
            conn.execute(
                "INSERT INTO \"User\" (id, default_currency, locale, week_starts_on, telemetry_opt_in, created_at, updated_at) VALUES (?, 'USD', 'en-US', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                params![self.user_id],
            )
            .map_err(|err| TransactionServiceError::Database(format!("Failed to create default user: {}", err)))?;
        }

        Ok(())
    }

    fn connection(&self) -> TransactionResult<Connection> {
        let conn = Connection::open(&self.db_path)
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?;

        if let Err(err) = conn.execute("PRAGMA foreign_keys = ON;", []) {
            return Err(TransactionServiceError::Database(err.to_string()));
        }

        if let Some(key) = &self.db_key {
            if let Err(err) = conn.pragma_update(None, "key", key) {
                tracing::warn!(error = %err, "Failed to apply SQLCipher key; continuing without encryption");
            }
        }

        Ok(conn)
    }

    fn recalculate_account_balances(&self, conn: &Connection) -> TransactionResult<()> {
        let mut stmt = conn
            .prepare("SELECT id FROM \"Account\" WHERE user_id = ?")
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?;

        let account_ids = stmt
            .query_map(params![self.user_id], |row| row.get::<_, String>(0))
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?;

        drop(stmt);

        for account_id in account_ids {
            let balance: i64 = conn
                .query_row(
                    "SELECT COALESCE(SUM(CASE 
                        WHEN type = 'income' THEN amount_cents 
                        WHEN type = 'expense' THEN -amount_cents 
                        ELSE 0 END), 0) 
                        FROM \"Transaction\" WHERE user_id = ? AND account_id = ?",
                    params![self.user_id, account_id],
                    |row| row.get(0),
                )
                .unwrap_or(0);

            conn.execute(
                "UPDATE \"Account\" SET balance_cents = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                params![balance, account_id],
            )
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?;
        }

        Ok(())
    }

    fn normalize_datetime(value: &str) -> TransactionResult<String> {
        let parsed = DateTime::parse_from_rfc3339(value)
            .map_err(|err| TransactionServiceError::Validation(err.to_string()))?;
        Ok(parsed.with_timezone(&Utc).to_rfc3339())
    }

    fn parse_tags(tags: Option<Vec<String>>) -> Option<String> {
        tags.filter(|list| !list.is_empty())
            .map(|list| list.join(","))
    }

    fn split_tags(tags: Option<String>) -> Vec<String> {
        tags.unwrap_or_default()
            .split(',')
            .filter_map(|token| {
                let trimmed = token.trim();
                if trimmed.is_empty() {
                    None
                } else {
                    Some(trimmed.to_string())
                }
            })
            .collect()
    }

    fn fetch_transaction_row(
        &self,
        conn: &Connection,
        id: &str,
    ) -> TransactionResult<TransactionDto> {
        let sql = r#"
            SELECT 
                t.id,
                t.account_id,
                a.name as account_name,
                t.category_id,
                c.name as category_name,
                t.type,
                t.amount_cents,
                t.currency,
                t.occurred_on,
                t.cleared,
                t.notes,
                t.tags,
                t.goal_id
            FROM "Transaction" t
            JOIN "Account" a ON a.id = t.account_id
            LEFT JOIN "Category" c ON c.id = t.category_id
            WHERE t.user_id = ? AND t.id = ?
        "#;

        conn.query_row(sql, params![self.user_id, id], |row| {
            let kind: String = row.get(5)?;
            Ok(TransactionDto {
                id: row.get(0)?,
                account_id: row.get(1)?,
                account_name: row.get(2)?,
                category_id: row.get(3)?,
                category_name: row.get(4)?,
                kind: match kind.as_str() {
                    "income" => TransactionKind::Income,
                    "expense" => TransactionKind::Expense,
                    _ => TransactionKind::Transfer,
                },
                amount_cents: row.get(6)?,
                currency: row.get(7)?,
                occurred_on: row.get(8)?,
                cleared: row.get::<_, i64>(9)? != 0,
                notes: row.get(10)?,
                tags: Self::split_tags(row.get(11)?),
                goal_id: row.get(12)?,
            })
        })
        .map_err(|err| match err {
            rusqlite::Error::QueryReturnedNoRows => {
                TransactionServiceError::NotFound(id.to_string())
            }
            _ => TransactionServiceError::Database(err.to_string()),
        })
    }

    fn apply_balance_delta(
        &self,
        tx: &rusqlite::Transaction<'_>,
        account_id: &str,
        delta: i64,
    ) -> TransactionResult<()> {
        if delta == 0 {
            return Ok(());
        }

        let affected = tx
            .execute(
                "UPDATE \"Account\" 
                 SET balance_cents = balance_cents + ?, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = ? AND user_id = ?",
                params![delta, account_id, self.user_id],
            )
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?;

        if affected == 0 {
            return Err(TransactionServiceError::NotFound(account_id.to_string()));
        }

        Ok(())
    }

    fn transaction_record(
        &self,
        tx: &rusqlite::Transaction<'_>,
        id: &str,
    ) -> TransactionResult<TransactionLedgerRecord> {
        let sql = r#"
            SELECT account_id, type, amount_cents
            FROM "Transaction"
            WHERE user_id = ? AND id = ?
        "#;

        tx.query_row(sql, params![self.user_id, id], |row| {
            let kind: String = row.get(1)?;
            Ok(TransactionLedgerRecord {
                account_id: row.get(0)?,
                kind: match kind.as_str() {
                    "income" => TransactionKind::Income,
                    "expense" => TransactionKind::Expense,
                    _ => TransactionKind::Transfer,
                },
                amount_cents: row.get(2)?,
            })
        })
        .map_err(|err| match err {
            rusqlite::Error::QueryReturnedNoRows => {
                TransactionServiceError::NotFound(id.to_string())
            }
            _ => TransactionServiceError::Database(err.to_string()),
        })
    }

    fn insert_transaction(
        &self,
        tx: &rusqlite::Transaction<'_>,
        payload: &TransactionPayload,
    ) -> TransactionResult<()> {
        tx.execute(
            r#"
            INSERT INTO "Transaction" (
                id,
                user_id,
                account_id,
                category_id,
                goal_id,
                type,
                amount_cents,
                currency,
                occurred_on,
                cleared,
                notes,
                tags,
                updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, CURRENT_TIMESTAMP)
        "#,
            params![
                payload.id,
                self.user_id,
                payload.account_id,
                payload.category_id,
                payload.goal_id,
                payload.kind.as_str(),
                payload.amount_cents,
                payload.currency,
                payload.occurred_on,
                payload.cleared,
                payload.notes,
                Self::parse_tags(payload.tags.clone())
            ],
        )
        .map_err(|err| TransactionServiceError::Database(err.to_string()))?;

        Ok(())
    }

    fn update_transaction_row(
        &self,
        tx: &rusqlite::Transaction<'_>,
        payload: &TransactionPayload,
    ) -> TransactionResult<()> {
        let affected = tx
            .execute(
                r#"
                UPDATE "Transaction" SET
                    account_id = ?1,
                    category_id = ?2,
                    goal_id = ?3,
                    type = ?4,
                    amount_cents = ?5,
                    currency = ?6,
                    occurred_on = ?7,
                    cleared = ?8,
                    notes = ?9,
                    tags = ?10,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?11 AND user_id = ?12
            "#,
                params![
                    payload.account_id,
                    payload.category_id,
                    payload.goal_id,
                    payload.kind.as_str(),
                    payload.amount_cents,
                    payload.currency,
                    payload.occurred_on,
                    payload.cleared,
                    payload.notes,
                    Self::parse_tags(payload.tags.clone()),
                    payload.id,
                    self.user_id
                ],
            )
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?;

        if affected == 0 {
            return Err(TransactionServiceError::NotFound(payload.id.clone()));
        }

        Ok(())
    }
}

impl TransactionService for SqliteTransactionService {
    fn descriptor(&self) -> ServiceDescriptor {
        ServiceDescriptor::new("TransactionService", "sqlite")
    }

    fn list_accounts(&self, include_balances: bool) -> TransactionResult<Vec<AccountDto>> {
        let conn = self.connection()?;
        let mut stmt = conn
            .prepare(
                r#"SELECT id, name, type, currency, balance_cents, color_token 
                   FROM "Account" WHERE user_id = ? ORDER BY name ASC"#,
            )
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?;

        let mut accounts = Vec::new();
        let mut rows = stmt
            .query(params![self.user_id])
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?;

        while let Some(row) = rows
            .next()
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?
        {
            let id: String = row.get(0)?;
            let available = if include_balances {
                Some(
                    conn.query_row(
                        "SELECT COALESCE(SUM(CASE 
                            WHEN type = 'income' THEN amount_cents 
                            WHEN type = 'expense' THEN -amount_cents 
                            ELSE 0 END), 0) 
                            FROM \"Transaction\" WHERE user_id = ? AND account_id = ?",
                        params![self.user_id, id.clone()],
                        |r| r.get(0),
                    )
                    .unwrap_or(0),
                )
            } else {
                None
            };

            accounts.push(AccountDto {
                id,
                name: row.get(1)?,
                account_type: row.get(2)?,
                currency: row.get(3)?,
                balance_cents: row.get(4)?,
                available_balance_cents: available,
                color_token: row.get(5)?,
            });
        }

        Ok(accounts)
    }

    fn list_categories(&self) -> TransactionResult<Vec<CategoryDto>> {
        let conn = self.connection()?;
        let mut stmt = conn
            .prepare(
                r#"SELECT id, name, type 
                   FROM "Category" WHERE user_id = ? AND archived = 0 
                   ORDER BY sort_order, name"#,
            )
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?;

        let categories = stmt
            .query_map(params![self.user_id], |row| {
                Ok(CategoryDto {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    category_type: row.get(2)?,
                })
            })
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?;

        Ok(categories)
    }

    fn list_transactions(&self, query: TransactionQuery) -> TransactionResult<Vec<TransactionDto>> {
        let conn = self.connection()?;
        let mut sql = String::from(
            r#"
            SELECT 
                t.id,
                t.account_id,
                a.name as account_name,
                t.category_id,
                c.name as category_name,
                t.type,
                t.amount_cents,
                t.currency,
                t.occurred_on,
                t.cleared,
                t.notes,
                t.tags,
                t.goal_id
            FROM "Transaction" t
            JOIN "Account" a ON a.id = t.account_id
            LEFT JOIN "Category" c ON c.id = t.category_id
            WHERE t.user_id = ?
        "#,
        );

        let mut params: Vec<Box<dyn rusqlite::ToSql>> = vec![Box::new(self.user_id.clone())];

        if let Some(account_id) = &query.account_id {
            sql.push_str(" AND t.account_id = ?");
            params.push(Box::new(account_id.clone()));
        }

        if let Some(category_id) = &query.category_id {
            sql.push_str(" AND t.category_id = ?");
            params.push(Box::new(category_id.clone()));
        }

        if let Some(search) = &query.search {
            sql.push_str(" AND (LOWER(t.notes) LIKE ? OR LOWER(t.tags) LIKE ?)");
            let needle = format!("%{}%", search.to_lowercase());
            params.push(Box::new(needle.clone()));
            params.push(Box::new(needle));
        }

        sql.push_str(" ORDER BY t.occurred_on DESC, t.created_at DESC");
        sql.push_str(" LIMIT ? OFFSET ?");

        params.push(Box::new(query.limit.unwrap_or(50)));
        params.push(Box::new(query.offset.unwrap_or(0)));

        let sqlite_params = params_from_iter(params.iter().map(|value| &**value));
        let mut stmt = conn
            .prepare(&sql)
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?;
        let mut rows = stmt
            .query(sqlite_params)
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?;

        let mut transactions = Vec::new();
        while let Some(row) = rows
            .next()
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?
        {
            let kind: String = row.get(5)?;
            let occurred_on: String = row.get(8)?;
            transactions.push(TransactionDto {
                id: row.get(0)?,
                account_id: row.get(1)?,
                account_name: row.get(2)?,
                category_id: row.get(3)?,
                category_name: row.get(4)?,
                kind: match kind.as_str() {
                    "income" => TransactionKind::Income,
                    "expense" => TransactionKind::Expense,
                    _ => TransactionKind::Transfer,
                },
                amount_cents: row.get(6)?,
                currency: row.get(7)?,
                occurred_on,
                cleared: row.get::<_, i64>(9)? != 0,
                notes: row.get(10)?,
                tags: Self::split_tags(row.get(11)?),
                goal_id: row.get(12)?,
            });
        }

        Ok(transactions)
    }

    fn create_transaction(
        &self,
        input: CreateTransactionInput,
    ) -> TransactionResult<TransactionDto> {
        let payload = TransactionPayload::from_create(input)?;
        let mut conn = self.connection()?;
        let tx = conn
            .transaction()
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?;

        self.insert_transaction(&tx, &payload)?;
        self.apply_balance_delta(
            &tx,
            &payload.account_id,
            payload.kind.balance_delta(payload.amount_cents),
        )?;

        tx.commit()
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?;

        self.fetch_transaction_row(&conn, &payload.id)
    }

    fn update_transaction(
        &self,
        input: UpdateTransactionInput,
    ) -> TransactionResult<TransactionDto> {
        let payload = TransactionPayload::from_update(input)?;
        let mut conn = self.connection()?;
        let tx = conn
            .transaction()
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?;

        let existing = self.transaction_record(&tx, &payload.id)?;

        self.apply_balance_delta(
            &tx,
            &existing.account_id,
            -existing.kind.balance_delta(existing.amount_cents),
        )?;
        self.update_transaction_row(&tx, &payload)?;
        self.apply_balance_delta(
            &tx,
            &payload.account_id,
            payload.kind.balance_delta(payload.amount_cents),
        )?;

        tx.commit()
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?;

        self.fetch_transaction_row(&conn, &payload.id)
    }

    fn delete_transaction(&self, id: &str) -> TransactionResult<()> {
        let mut conn = self.connection()?;
        let tx = conn
            .transaction()
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?;

        let existing = self.transaction_record(&tx, id)?;
        self.apply_balance_delta(
            &tx,
            &existing.account_id,
            -existing.kind.balance_delta(existing.amount_cents),
        )?;

        let affected = tx
            .execute(
                "DELETE FROM \"Transaction\" WHERE id = ? AND user_id = ?",
                params![id, self.user_id],
            )
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?;

        if affected == 0 {
            return Err(TransactionServiceError::NotFound(id.to_string()));
        }

        tx.commit()
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?;

        Ok(())
    }

    fn import_transactions(
        &self,
        inputs: Vec<CreateTransactionInput>,
    ) -> TransactionResult<Vec<TransactionDto>> {
        if inputs.is_empty() {
            return Ok(Vec::new());
        }

        let payloads = inputs
            .into_iter()
            .map(TransactionPayload::from_create)
            .collect::<TransactionResult<Vec<_>>>()?;

        let mut conn = self.connection()?;
        let tx = conn
            .transaction()
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?;

        for payload in &payloads {
            self.insert_transaction(&tx, payload)?;
            self.apply_balance_delta(
                &tx,
                &payload.account_id,
                payload.kind.balance_delta(payload.amount_cents),
            )?;
        }

        tx.commit()
            .map_err(|err| TransactionServiceError::Database(err.to_string()))?;

        let mut created = Vec::with_capacity(payloads.len());
        for payload in payloads {
            created.push(self.fetch_transaction_row(&conn, &payload.id)?);
        }

        Ok(created)
    }
}

struct TransactionPayload {
    id: String,
    account_id: String,
    category_id: Option<String>,
    kind: TransactionKind,
    amount_cents: i64,
    currency: String,
    occurred_on: String,
    notes: Option<String>,
    tags: Option<Vec<String>>,
    cleared: bool,
    goal_id: Option<String>,
}

impl TransactionPayload {
    fn validate_amount(amount: i64) -> TransactionResult<i64> {
        if amount <= 0 {
            return Err(TransactionServiceError::Validation(
                "Amount must be greater than zero".into(),
            ));
        }
        Ok(amount)
    }

    fn from_create(input: CreateTransactionInput) -> TransactionResult<Self> {
        let id = input.id.unwrap_or_else(|| format!("tx_{}", Uuid::new_v4()));
        Ok(Self {
            id,
            account_id: input.account_id,
            category_id: input.category_id,
            kind: input.kind,
            amount_cents: Self::validate_amount(input.amount_cents)?,
            currency: input.currency.to_uppercase(),
            occurred_on: SqliteTransactionService::normalize_datetime(&input.occurred_on)?,
            notes: input.notes,
            tags: input.tags,
            cleared: input.cleared,
            goal_id: input.goal_id,
        })
    }

    fn from_update(input: UpdateTransactionInput) -> TransactionResult<Self> {
        Ok(Self {
            id: input.id,
            account_id: input.account_id,
            category_id: input.category_id,
            kind: input.kind,
            amount_cents: Self::validate_amount(input.amount_cents)?,
            currency: input.currency.to_uppercase(),
            occurred_on: SqliteTransactionService::normalize_datetime(&input.occurred_on)?,
            notes: input.notes,
            tags: input.tags,
            cleared: input.cleared,
            goal_id: input.goal_id,
        })
    }
}

struct TransactionLedgerRecord {
    account_id: String,
    kind: TransactionKind,
    amount_cents: i64,
}

#[cfg(test)]
mod tests {
    use chrono::Utc;

    use super::*;

    fn setup_in_memory() -> SqliteTransactionService {
        let tmp = tempfile::NamedTempFile::new().unwrap();
        let path = tmp.path().to_path_buf();
        std::mem::forget(tmp);

        let source = PathBuf::from("../prisma/dev.db");
        std::fs::copy(source, &path).unwrap();
        SqliteTransactionService::new(path, None, Some("seed-user".into())).unwrap()
    }

    #[test]
    fn creates_transaction_and_updates_balance() {
        let service = setup_in_memory();
        let account_before = service.list_accounts(true).unwrap();
        let target = account_before
            .iter()
            .find(|acct| acct.id == "acct-checking")
            .unwrap()
            .available_balance_cents
            .unwrap_or(acct_before_balance(&account_before, "acct-checking"));

        let created = service
            .create_transaction(CreateTransactionInput {
                id: None,
                account_id: "acct-checking".into(),
                category_id: Some("cat-groceries".into()),
                kind: TransactionKind::Expense,
                amount_cents: 1200,
                currency: "USD".into(),
                occurred_on: Utc::now().to_rfc3339(),
                notes: Some("Test purchase".into()),
                tags: Some(vec!["test".into()]),
                cleared: true,
                goal_id: None,
            })
            .unwrap();

        assert_eq!(created.amount_cents, 1200);
        let updated_accounts = service.list_accounts(true).unwrap();
        let new_balance = updated_accounts
            .iter()
            .find(|acct| acct.id == "acct-checking")
            .unwrap()
            .available_balance_cents
            .unwrap_or(acct_before_balance(&updated_accounts, "acct-checking"));
        assert_eq!(target - 1200, new_balance);
    }

    fn acct_before_balance(accounts: &[AccountDto], id: &str) -> i64 {
        accounts
            .iter()
            .find(|acct| acct.id == id)
            .map(|acct| acct.balance_cents)
            .unwrap_or(0)
    }
}
