use std::sync::Arc;

pub mod budgets;
pub mod dashboard;
pub mod goals;
pub mod transactions;

pub use budgets::{
    BudgetDto, BudgetEntryDto, BudgetResult, BudgetService, BudgetServiceError, BudgetStatus,
    CreateBudgetInput, RecordSnapshotInput, SqliteBudgetService, UpdateBudgetInput,
};
pub use dashboard::{
    DashboardResult, DashboardService, DashboardServiceError, DashboardSnapshot, SqliteDashboardService,
};
pub use goals::{
    AddContributionInput, CreateGoalInput, GoalDto, GoalResult, GoalService, GoalServiceError,
    SqliteGoalService, UpdateGoalInput, UpdateGoalStatusInput,
};
pub use transactions::{
    AccountDto, CategoryDto, CreateTransactionInput, ImportTransactionsInput,
    SqliteTransactionService, TransactionDto, TransactionQuery, TransactionResult,
    TransactionService, TransactionServiceError, UpdateTransactionInput,
};

#[derive(Debug, Clone, serde::Serialize)]
pub struct ServiceDescriptor {
    pub name: &'static str,
    pub provider: &'static str,
}

impl ServiceDescriptor {
    pub const fn new(name: &'static str, provider: &'static str) -> Self {
        Self { name, provider }
    }
}

// BudgetService trait is defined in budgets module
// GoalService trait is defined in goals module

pub trait ReminderService: Send + Sync {
    fn descriptor(&self) -> ServiceDescriptor;
}

pub trait SyncService: Send + Sync {
    fn descriptor(&self) -> ServiceDescriptor;
}

struct NoopTransactionService;
struct NoopDashboardService;
struct NoopBudgetService;
struct NoopGoalService;
struct NoopReminderService;
struct NoopSyncService;

impl TransactionService for NoopTransactionService {
    fn descriptor(&self) -> ServiceDescriptor {
        ServiceDescriptor::new("TransactionService", "noop")
    }

    fn list_accounts(&self, _: bool) -> TransactionResult<Vec<AccountDto>> {
        not_configured()
    }

    fn list_categories(&self) -> TransactionResult<Vec<CategoryDto>> {
        not_configured()
    }

    fn list_transactions(&self, _: TransactionQuery) -> TransactionResult<Vec<TransactionDto>> {
        not_configured()
    }

    fn create_transaction(&self, _: CreateTransactionInput) -> TransactionResult<TransactionDto> {
        not_configured()
    }

    fn update_transaction(&self, _: UpdateTransactionInput) -> TransactionResult<TransactionDto> {
        not_configured()
    }

    fn delete_transaction(&self, _: &str) -> TransactionResult<()> {
        not_configured()
    }

    fn import_transactions(
        &self,
        _: Vec<CreateTransactionInput>,
    ) -> TransactionResult<Vec<TransactionDto>> {
        not_configured()
    }
}

impl BudgetService for NoopBudgetService {
    fn descriptor(&self) -> ServiceDescriptor {
        ServiceDescriptor::new("BudgetService", "noop")
    }

    fn list_budgets(&self) -> BudgetResult<Vec<BudgetDto>> {
        not_configured_budget()
    }

    fn get_budget(&self, _: &str) -> BudgetResult<BudgetDto> {
        not_configured_budget()
    }

    fn create_budget(&self, _: CreateBudgetInput) -> BudgetResult<BudgetDto> {
        not_configured_budget()
    }

    fn update_budget(&self, _: UpdateBudgetInput) -> BudgetResult<BudgetDto> {
        not_configured_budget()
    }

    fn delete_budget(&self, _: &str) -> BudgetResult<()> {
        not_configured_budget()
    }

    fn record_snapshot(&self, _: RecordSnapshotInput) -> BudgetResult<BudgetEntryDto> {
        not_configured_budget()
    }

    fn calculate_budget_progress(&self, _: &str) -> BudgetResult<(i64, i64, f64, BudgetStatus)> {
        not_configured_budget()
    }
}

impl DashboardService for NoopDashboardService {
    fn descriptor(&self) -> ServiceDescriptor {
        ServiceDescriptor::new("DashboardService", "noop")
    }

    fn snapshot(&self) -> DashboardResult<DashboardSnapshot> {
        not_configured_dashboard()
    }
}

impl GoalService for NoopGoalService {
    fn descriptor(&self) -> ServiceDescriptor {
        ServiceDescriptor::new("GoalService", "noop")
    }

    fn list_goals(&self) -> GoalResult<Vec<GoalDto>> {
        not_configured_goal()
    }

    fn get_goal(&self, _: &str) -> GoalResult<GoalDto> {
        not_configured_goal()
    }

    fn create_goal(&self, _: CreateGoalInput) -> GoalResult<GoalDto> {
        not_configured_goal()
    }

    fn update_goal(&self, _: UpdateGoalInput) -> GoalResult<GoalDto> {
        not_configured_goal()
    }

    fn update_goal_status(&self, _: UpdateGoalStatusInput) -> GoalResult<GoalDto> {
        not_configured_goal()
    }

    fn add_contribution(&self, _: AddContributionInput) -> GoalResult<GoalDto> {
        not_configured_goal()
    }

    fn delete_goal(&self, _: &str) -> GoalResult<()> {
        not_configured_goal()
    }

    fn calculate_projection(&self, _: &str) -> GoalResult<(f64, Option<String>)> {
        not_configured_goal()
    }
}

impl ReminderService for NoopReminderService {
    fn descriptor(&self) -> ServiceDescriptor {
        ServiceDescriptor::new("ReminderService", "noop")
    }
}

impl SyncService for NoopSyncService {
    fn descriptor(&self) -> ServiceDescriptor {
        ServiceDescriptor::new("SyncService", "noop")
    }
}

pub struct ServiceRegistry {
    transaction: Arc<dyn TransactionService>,
    dashboard: Arc<dyn DashboardService>,
    budget: Arc<dyn BudgetService>,
    goal: Arc<dyn GoalService>,
    reminder: Arc<dyn ReminderService>,
    sync: Arc<dyn SyncService>,
}

impl Default for ServiceRegistry {
    fn default() -> Self {
        Self::new()
    }
}

impl ServiceRegistry {
    pub fn new() -> Self {
        Self {
            transaction: Arc::new(NoopTransactionService),
            dashboard: Arc::new(NoopDashboardService),
            budget: Arc::new(NoopBudgetService),
            goal: Arc::new(NoopGoalService),
            reminder: Arc::new(NoopReminderService),
            sync: Arc::new(NoopSyncService),
        }
    }

    pub fn builder() -> ServiceRegistryBuilder {
        ServiceRegistryBuilder::default()
    }

    pub fn descriptors(&self) -> Vec<ServiceDescriptor> {
        vec![
            self.transaction.descriptor(),
            self.dashboard.descriptor(),
            self.budget.descriptor(),
            self.goal.descriptor(),
            self.reminder.descriptor(),
            self.sync.descriptor(),
        ]
    }

    pub fn transaction(&self) -> Arc<dyn TransactionService> {
        Arc::clone(&self.transaction)
    }

    pub fn dashboard(&self) -> Arc<dyn DashboardService> {
        Arc::clone(&self.dashboard)
    }

    pub fn budget(&self) -> Arc<dyn BudgetService> {
        Arc::clone(&self.budget)
    }

    pub fn goal(&self) -> Arc<dyn GoalService> {
        Arc::clone(&self.goal)
    }

    #[allow(dead_code)]
    pub fn reminder(&self) -> Arc<dyn ReminderService> {
        Arc::clone(&self.reminder)
    }

    #[allow(dead_code)]
    pub fn sync(&self) -> Arc<dyn SyncService> {
        Arc::clone(&self.sync)
    }
}

#[derive(Default)]
pub struct ServiceRegistryBuilder {
    transaction: Option<Arc<dyn TransactionService>>,
    dashboard: Option<Arc<dyn DashboardService>>,
    budget: Option<Arc<dyn BudgetService>>,
    goal: Option<Arc<dyn GoalService>>,
    reminder: Option<Arc<dyn ReminderService>>,
    sync: Option<Arc<dyn SyncService>>,
}

impl ServiceRegistryBuilder {
    pub fn with_transaction<T>(mut self, service: T) -> Self
    where
        T: TransactionService + 'static,
    {
        self.transaction = Some(Arc::new(service));
        self
    }

    pub fn with_dashboard<T>(mut self, service: T) -> Self
    where
        T: DashboardService + 'static,
    {
        self.dashboard = Some(Arc::new(service));
        self
    }

    pub fn with_budget<T>(mut self, service: T) -> Self
    where
        T: BudgetService + 'static,
    {
        self.budget = Some(Arc::new(service));
        self
    }

    pub fn with_goal<T>(mut self, service: T) -> Self
    where
        T: GoalService + 'static,
    {
        self.goal = Some(Arc::new(service));
        self
    }

    #[allow(dead_code)]
    pub fn with_reminder<T>(mut self, service: T) -> Self
    where
        T: ReminderService + 'static,
    {
        self.reminder = Some(Arc::new(service));
        self
    }

    #[allow(dead_code)]
    pub fn with_sync<T>(mut self, service: T) -> Self
    where
        T: SyncService + 'static,
    {
        self.sync = Some(Arc::new(service));
        self
    }

    pub fn build(self) -> ServiceRegistry {
        ServiceRegistry {
            transaction: self
                .transaction
                .unwrap_or_else(|| Arc::new(NoopTransactionService)),
            dashboard: self
                .dashboard
                .unwrap_or_else(|| Arc::new(NoopDashboardService)),
            budget: self.budget.unwrap_or_else(|| Arc::new(NoopBudgetService)),
            goal: self.goal.unwrap_or_else(|| Arc::new(NoopGoalService)),
            reminder: self
                .reminder
                .unwrap_or_else(|| Arc::new(NoopReminderService)),
            sync: self.sync.unwrap_or_else(|| Arc::new(NoopSyncService)),
        }
    }
}

fn not_configured<T>() -> TransactionResult<T> {
    Err(TransactionServiceError::Internal(
        "TransactionService is not configured".to_string(),
    ))
}

fn not_configured_dashboard<T>() -> DashboardResult<T> {
    Err(DashboardServiceError::Internal(
        "DashboardService is not configured".to_string(),
    ))
}

fn not_configured_budget<T>() -> BudgetResult<T> {
    Err(BudgetServiceError::Internal(
        "BudgetService is not configured".to_string(),
    ))
}

fn not_configured_goal<T>() -> GoalResult<T> {
    Err(GoalServiceError::Internal(
        "GoalService is not configured".to_string(),
    ))
}
