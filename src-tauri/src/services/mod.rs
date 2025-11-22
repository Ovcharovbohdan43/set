use std::sync::Arc;

pub mod budgets;
pub mod dashboard;
pub mod goals;
pub mod reminders;
pub mod reports;
pub mod settings;
pub mod planning;
pub mod sync;
pub mod transactions;

pub use budgets::{
    BudgetDto, BudgetEntryDto, BudgetResult, BudgetService, BudgetServiceError, BudgetStatus,
    CreateBudgetInput, RecordSnapshotInput, SqliteBudgetService, UpdateBudgetInput,
};
pub use dashboard::{
    DashboardResult, DashboardService, DashboardServiceError, DashboardSnapshot,
    SqliteDashboardService,
};
pub use goals::{
    AddContributionInput, CreateGoalInput, GoalDto, GoalResult, GoalService, GoalServiceError,
    SqliteGoalService, UpdateGoalInput, UpdateGoalStatusInput,
};
pub use reminders::{
    CreateReminderInput, DismissReminderInput, ReminderDto, ReminderResult, ReminderService,
    ReminderServiceError, SnoozeReminderInput, SqliteReminderService, UpdateReminderInput,
};
pub use reports::{
    MonthlyReportDto, MonthlyTrendDto, ReportResult, ReportService, ReportServiceError,
    SpendingByCategoryDto, SqliteReportService,
};
pub use settings::{
    SettingsResult, SettingsService, SettingsServiceError, SqliteSettingsService,
    UpdateCategoryOrderInput, UpdateUserSettingsInput, UserSettingsDto,
};
pub use sync::{
    SqliteSyncService, SyncDownloadInput, SyncDownloadResult, SyncService, SyncServiceError,
    SyncServiceResult, SyncUploadInput, SyncUploadResult,
};
pub use planning::{
    AddDebtAccountInput, AddPlannedExpenseInput, AddPlannedIncomeInput, CreateMonthlyPlanInput,
    AddPlannedSavingInput, DebtAccountDto, DeleteDebtAccountInput, DeletePlannedExpenseInput,
    DeletePlannedIncomeInput, DeletePlannedSavingInput, MonthlyPlanDto, PlannedExpenseDto,
    PlannedIncomeDto, PlannedSavingDto, PlanningError, PlanningResult, PlanningService, DebtScheduleDto,
    UpdateDebtAccountInput, UpdatePlannedExpenseInput, UpdatePlannedIncomeInput,
    UpdatePlannedSavingInput, GenerateDebtScheduleInput, ConfirmDebtPaymentInput,
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
// ReminderService trait is defined in reminders module

struct NoopTransactionService;
struct NoopDashboardService;
struct NoopBudgetService;
struct NoopGoalService;
struct NoopReminderService;
struct NoopReportService;
struct NoopSettingsService;
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

    fn list_reminders(&self) -> ReminderResult<Vec<ReminderDto>> {
        not_configured_reminder()
    }

    fn get_reminder(&self, _: &str) -> ReminderResult<ReminderDto> {
        not_configured_reminder()
    }

    fn create_reminder(&self, _: CreateReminderInput) -> ReminderResult<ReminderDto> {
        not_configured_reminder()
    }

    fn update_reminder(&self, _: UpdateReminderInput) -> ReminderResult<ReminderDto> {
        not_configured_reminder()
    }

    fn delete_reminder(&self, _: &str) -> ReminderResult<()> {
        not_configured_reminder()
    }

    fn snooze_reminder(&self, _: SnoozeReminderInput) -> ReminderResult<ReminderDto> {
        not_configured_reminder()
    }

    fn dismiss_reminder(&self, _: DismissReminderInput) -> ReminderResult<ReminderDto> {
        not_configured_reminder()
    }

    fn get_due_reminders(&self) -> ReminderResult<Vec<ReminderDto>> {
        not_configured_reminder()
    }

    fn mark_reminder_sent(&self, _: &str) -> ReminderResult<ReminderDto> {
        not_configured_reminder()
    }
}

impl ReportService for NoopReportService {
    fn descriptor(&self) -> ServiceDescriptor {
        ServiceDescriptor::new("ReportService", "noop")
    }

    fn get_monthly_report(&self, _: &str) -> ReportResult<MonthlyReportDto> {
        not_configured_report()
    }

    fn get_spending_by_category(
        &self,
        _: &str,
        _: &str,
    ) -> ReportResult<Vec<SpendingByCategoryDto>> {
        not_configured_report()
    }

    fn get_monthly_trend(&self, _: i32) -> ReportResult<Vec<MonthlyTrendDto>> {
        not_configured_report()
    }

    fn invalidate_cache(&self, _: Option<&str>) -> ReportResult<()> {
        not_configured_report()
    }
}

impl SettingsService for NoopSettingsService {
    fn descriptor(&self) -> ServiceDescriptor {
        ServiceDescriptor::new("SettingsService", "noop")
    }

    fn get_user_settings(&self) -> SettingsResult<UserSettingsDto> {
        not_configured_settings()
    }

    fn update_user_settings(&self, _: UpdateUserSettingsInput) -> SettingsResult<UserSettingsDto> {
        not_configured_settings()
    }

    fn update_category_order(&self, _: UpdateCategoryOrderInput) -> SettingsResult<()> {
        not_configured_settings()
    }
}

impl SyncService for NoopSyncService {
    fn descriptor(&self) -> ServiceDescriptor {
        ServiceDescriptor::new("SyncService", "noop")
    }

    fn upload(&self, _input: SyncUploadInput) -> SyncServiceResult<SyncUploadResult> {
        Err(SyncServiceError::Unavailable(
            "SyncService is not configured".to_string(),
        ))
    }

    fn download(&self, _input: SyncDownloadInput) -> SyncServiceResult<SyncDownloadResult> {
        Err(SyncServiceError::Unavailable(
            "SyncService is not configured".to_string(),
        ))
    }
}

pub struct ServiceRegistry {
    transaction: Arc<dyn TransactionService>,
    dashboard: Arc<dyn DashboardService>,
    budget: Arc<dyn BudgetService>,
    goal: Arc<dyn GoalService>,
    reminder: Arc<dyn ReminderService>,
    report: Arc<dyn ReportService>,
    settings: Arc<dyn SettingsService>,
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
            report: Arc::new(NoopReportService),
            settings: Arc::new(NoopSettingsService),
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
            self.report.descriptor(),
            self.settings.descriptor(),
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

    pub fn reminder(&self) -> Arc<dyn ReminderService> {
        Arc::clone(&self.reminder)
    }

    pub fn report(&self) -> Arc<dyn ReportService> {
        Arc::clone(&self.report)
    }

    pub fn settings(&self) -> Arc<dyn SettingsService> {
        Arc::clone(&self.settings)
    }

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
    report: Option<Arc<dyn ReportService>>,
    settings: Option<Arc<dyn SettingsService>>,
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

    pub fn with_reminder<T>(mut self, service: T) -> Self
    where
        T: ReminderService + 'static,
    {
        self.reminder = Some(Arc::new(service));
        self
    }

    pub fn with_report<T>(mut self, service: T) -> Self
    where
        T: ReportService + 'static,
    {
        self.report = Some(Arc::new(service));
        self
    }

    pub fn with_settings<T>(mut self, service: T) -> Self
    where
        T: SettingsService + 'static,
    {
        self.settings = Some(Arc::new(service));
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
            report: self.report.unwrap_or_else(|| Arc::new(NoopReportService)),
            settings: self
                .settings
                .unwrap_or_else(|| Arc::new(NoopSettingsService)),
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

fn not_configured_reminder<T>() -> ReminderResult<T> {
    Err(ReminderServiceError::Internal(
        "ReminderService is not configured".to_string(),
    ))
}

fn not_configured_report<T>() -> ReportResult<T> {
    Err(ReportServiceError::Internal(
        "ReportService is not configured".to_string(),
    ))
}

fn not_configured_settings<T>() -> SettingsResult<T> {
    Err(SettingsServiceError::Internal(
        "SettingsService is not configured".to_string(),
    ))
}
