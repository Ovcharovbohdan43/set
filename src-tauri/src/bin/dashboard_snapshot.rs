use std::path::PathBuf;

use personal_finance_desktop::services::dashboard::DashboardService;
use personal_finance_desktop::services::SqliteDashboardService;

fn main() {
    let path = PathBuf::from(r"C:\Users\user\AppData\Roaming\com.example.personalfinance\Personal Finance Desktop\FinanceApp\storage\app.db");
    let svc = SqliteDashboardService::new(path, None, None).expect("dashboard service");
    match svc.snapshot() {
        Ok(snapshot) => {
            println!("currency {}", snapshot.currency);
            println!("net_worth {}", snapshot.net_worth_cents);
            println!("net_delta {}", snapshot.net_worth_delta_cents);
            println!("cash_flow {}", snapshot.cash_flow_cents);
            println!("cash_prev {}", snapshot.cash_flow_previous_cents);
            println!("budget_total {}", snapshot.budget_total_cents);
            println!("budget_spent {}", snapshot.budget_spent_cents);
            println!("weekly {:?}", snapshot.weekly_spending);
            println!("accounts {:?}", snapshot.accounts);
        }
        Err(err) => eprintln!("snapshot error: {err:?}"),
    }
}
