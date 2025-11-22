use std::env;
use std::path::PathBuf;

use rusqlite::{Connection, Result};

fn main() -> Result<()> {
    let default_path = PathBuf::from(r"C:\Users\user\AppData\Roaming\com.example.personalfinance\Personal Finance Desktop\FinanceApp\storage\app.db");
    let db_path = env::var("DB_PATH")
        .map(PathBuf::from)
        .unwrap_or(default_path);

    println!("Inspecting DB at: {}", db_path.display());

    let conn = Connection::open(&db_path)?;
    for table in ["User", "Account", "Transaction", "Budget", "Goal", "Reminder"] {
        match conn.query_row::<i64, _, _>(
            &format!("SELECT COUNT(*) FROM \"{}\"", table),
            [],
            |row| row.get(0),
        ) {
            Ok(count) => println!("{:<12} {}", table, count),
            Err(err) => println!("{:<12} ERR {}", table, err),
        }
    }

    println!("\nAccounts:");
    let mut stmt = conn.prepare("SELECT id, name, type, balance_cents FROM \"Account\"")?;
    let rows = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, i64>(3)?,
        ))
    })?;
    for row in rows {
        let (id, name, typ, bal) = row?;
        println!(" - {} [{}]: {}", name, typ, bal);
    }

    println!("\nTransactions (id, type, amount, account, goal, date):");
    let mut stmt = conn.prepare(
        r#"SELECT id, type, amount_cents, account_id, goal_id, occurred_on FROM "Transaction" ORDER BY occurred_on DESC LIMIT 5"#,
    )?;
    let rows = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, i64>(2)?,
            row.get::<_, String>(3)?,
            row.get::<_, Option<String>>(4)?,
            row.get::<_, String>(5)?,
        ))
    })?;
    for row in rows {
        let (id, typ, amt, acct, goal, date) = row?;
        println!(" - {} {} {} acct:{} goal:{:?} {}", id, typ, amt, acct, goal, date);
    }

    Ok(())
}
