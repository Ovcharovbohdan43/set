use tauri::{async_runtime::spawn_blocking, State};

use crate::{
    services::planning::{
        AddDebtAccountInput, AddPlannedExpenseInput, AddPlannedIncomeInput, CreateMonthlyPlanInput,
        AddPlannedSavingInput, DeleteDebtAccountInput, DeletePlannedExpenseInput,
        DeletePlannedIncomeInput, DeletePlannedSavingInput, PlanningService,
        UpdateDebtAccountInput, UpdatePlannedExpenseInput, UpdatePlannedIncomeInput,
        UpdatePlannedSavingInput,
        GenerateDebtScheduleInput, ConfirmDebtPaymentInput,
    },
    state::AppState,
};

#[tauri::command]
pub async fn create_monthly_plan(
    state: State<'_, AppState>,
    input: CreateMonthlyPlanInput,
) -> Result<crate::services::planning::MonthlyPlanDto, String> {
    let db_path = state.paths().db_path().to_path_buf();
    let key = state.secrets().sqlcipher_key().to_string();
    spawn_blocking(move || {
        let svc = PlanningService::new(db_path, Some(key), "seed-user".to_string())
            .map_err(|e| e.to_string())?;
        svc.create_monthly_plan(input).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn list_monthly_plans(
    state: State<'_, AppState>,
) -> Result<Vec<crate::services::planning::MonthlyPlanDto>, String> {
    let db_path = state.paths().db_path().to_path_buf();
    let key = state.secrets().sqlcipher_key().to_string();
    spawn_blocking(move || {
        let svc = PlanningService::new(db_path, Some(key), "seed-user".to_string())
            .map_err(|e| e.to_string())?;
        svc.list_monthly_plans().map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn add_planned_income(
    state: State<'_, AppState>,
    input: AddPlannedIncomeInput,
) -> Result<crate::services::planning::PlannedIncomeDto, String> {
    let db_path = state.paths().db_path().to_path_buf();
    let key = state.secrets().sqlcipher_key().to_string();
    spawn_blocking(move || {
        let svc = PlanningService::new(db_path, Some(key), "seed-user".to_string())
            .map_err(|e| e.to_string())?;
        svc.add_planned_income(input).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn list_planned_incomes(
    state: State<'_, AppState>,
    plan_id: String,
) -> Result<Vec<crate::services::planning::PlannedIncomeDto>, String> {
    let db_path = state.paths().db_path().to_path_buf();
    let key = state.secrets().sqlcipher_key().to_string();
    spawn_blocking(move || {
        let svc = PlanningService::new(db_path, Some(key), "seed-user".to_string())
            .map_err(|e| e.to_string())?;
        svc.list_incomes(&plan_id).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn update_planned_income(
    state: State<'_, AppState>,
    input: UpdatePlannedIncomeInput,
) -> Result<crate::services::planning::PlannedIncomeDto, String> {
    let db_path = state.paths().db_path().to_path_buf();
    let key = state.secrets().sqlcipher_key().to_string();
    spawn_blocking(move || {
        let svc = PlanningService::new(db_path, Some(key), "seed-user".to_string())
            .map_err(|e| e.to_string())?;
        svc.update_income(input).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn delete_planned_income(
    state: State<'_, AppState>,
    input: DeletePlannedIncomeInput,
) -> Result<(), String> {
    let db_path = state.paths().db_path().to_path_buf();
    let key = state.secrets().sqlcipher_key().to_string();
    spawn_blocking(move || {
        let svc = PlanningService::new(db_path, Some(key), "seed-user".to_string())
            .map_err(|e| e.to_string())?;
        svc.delete_income(input).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn add_planned_expense(
    state: State<'_, AppState>,
    input: AddPlannedExpenseInput,
) -> Result<crate::services::planning::PlannedExpenseDto, String> {
    let db_path = state.paths().db_path().to_path_buf();
    let key = state.secrets().sqlcipher_key().to_string();
    spawn_blocking(move || {
        let svc = PlanningService::new(db_path, Some(key), "seed-user".to_string())
            .map_err(|e| e.to_string())?;
        svc.add_planned_expense(input).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn list_planned_expenses(
    state: State<'_, AppState>,
    plan_id: String,
) -> Result<Vec<crate::services::planning::PlannedExpenseDto>, String> {
    let db_path = state.paths().db_path().to_path_buf();
    let key = state.secrets().sqlcipher_key().to_string();
    spawn_blocking(move || {
        let svc = PlanningService::new(db_path, Some(key), "seed-user".to_string())
            .map_err(|e| e.to_string())?;
        svc.list_expenses(&plan_id).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn update_planned_expense(
    state: State<'_, AppState>,
    input: UpdatePlannedExpenseInput,
) -> Result<crate::services::planning::PlannedExpenseDto, String> {
    let db_path = state.paths().db_path().to_path_buf();
    let key = state.secrets().sqlcipher_key().to_string();
    spawn_blocking(move || {
        let svc = PlanningService::new(db_path, Some(key), "seed-user".to_string())
            .map_err(|e| e.to_string())?;
        svc.update_expense(input).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn delete_planned_expense(
    state: State<'_, AppState>,
    input: DeletePlannedExpenseInput,
) -> Result<(), String> {
    let db_path = state.paths().db_path().to_path_buf();
    let key = state.secrets().sqlcipher_key().to_string();
    spawn_blocking(move || {
        let svc = PlanningService::new(db_path, Some(key), "seed-user".to_string())
            .map_err(|e| e.to_string())?;
        svc.delete_expense(input).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn add_planned_saving(
    state: State<'_, AppState>,
    input: AddPlannedSavingInput,
) -> Result<crate::services::planning::PlannedSavingDto, String> {
    let db_path = state.paths().db_path().to_path_buf();
    let key = state.secrets().sqlcipher_key().to_string();
    spawn_blocking(move || {
        let svc = PlanningService::new(db_path, Some(key), "seed-user".to_string())
            .map_err(|e| e.to_string())?;
        svc.add_planned_saving(input).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn list_planned_savings(
    state: State<'_, AppState>,
    plan_id: String,
) -> Result<Vec<crate::services::planning::PlannedSavingDto>, String> {
    let db_path = state.paths().db_path().to_path_buf();
    let key = state.secrets().sqlcipher_key().to_string();
    spawn_blocking(move || {
        let svc = PlanningService::new(db_path, Some(key), "seed-user".to_string())
            .map_err(|e| e.to_string())?;
        svc.list_savings(&plan_id).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn update_planned_saving(
    state: State<'_, AppState>,
    input: UpdatePlannedSavingInput,
) -> Result<crate::services::planning::PlannedSavingDto, String> {
    let db_path = state.paths().db_path().to_path_buf();
    let key = state.secrets().sqlcipher_key().to_string();
    spawn_blocking(move || {
        let svc = PlanningService::new(db_path, Some(key), "seed-user".to_string())
            .map_err(|e| e.to_string())?;
        svc.update_saving(input).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn delete_planned_saving(
    state: State<'_, AppState>,
    input: DeletePlannedSavingInput,
) -> Result<(), String> {
    let db_path = state.paths().db_path().to_path_buf();
    let key = state.secrets().sqlcipher_key().to_string();
    spawn_blocking(move || {
        let svc = PlanningService::new(db_path, Some(key), "seed-user".to_string())
            .map_err(|e| e.to_string())?;
        svc.delete_saving(input).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn add_debt_account(
    state: State<'_, AppState>,
    input: AddDebtAccountInput,
) -> Result<crate::services::planning::DebtAccountDto, String> {
    let db_path = state.paths().db_path().to_path_buf();
    let key = state.secrets().sqlcipher_key().to_string();
    spawn_blocking(move || {
        let svc = PlanningService::new(db_path, Some(key), "seed-user".to_string())
            .map_err(|e| e.to_string())?;
        svc.add_debt_account(input).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn list_debt_accounts(
    state: State<'_, AppState>,
) -> Result<Vec<crate::services::planning::DebtAccountDto>, String> {
    let db_path = state.paths().db_path().to_path_buf();
    let key = state.secrets().sqlcipher_key().to_string();
    spawn_blocking(move || {
        let svc = PlanningService::new(db_path, Some(key), "seed-user".to_string())
            .map_err(|e| e.to_string())?;
        svc.list_debts().map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn update_debt_account(
    state: State<'_, AppState>,
    input: UpdateDebtAccountInput,
) -> Result<crate::services::planning::DebtAccountDto, String> {
    let db_path = state.paths().db_path().to_path_buf();
    let key = state.secrets().sqlcipher_key().to_string();
    spawn_blocking(move || {
        let svc = PlanningService::new(db_path, Some(key), "seed-user".to_string())
            .map_err(|e| e.to_string())?;
        svc.update_debt(input).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn delete_debt_account(
    state: State<'_, AppState>,
    input: DeleteDebtAccountInput,
) -> Result<(), String> {
    let db_path = state.paths().db_path().to_path_buf();
    let key = state.secrets().sqlcipher_key().to_string();
    spawn_blocking(move || {
        let svc = PlanningService::new(db_path, Some(key), "seed-user".to_string())
            .map_err(|e| e.to_string())?;
        svc.delete_debt(input).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn generate_debt_schedule(
    state: State<'_, AppState>,
    input: GenerateDebtScheduleInput,
) -> Result<Vec<crate::services::planning::DebtScheduleDto>, String> {
    let db_path = state.paths().db_path().to_path_buf();
    let key = state.secrets().sqlcipher_key().to_string();
    spawn_blocking(move || {
        let svc = PlanningService::new(db_path, Some(key), "seed-user".to_string())
            .map_err(|e| e.to_string())?;
        svc.generate_debt_schedule(input).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn list_debt_schedule(
    state: State<'_, AppState>,
    debt_id: String,
) -> Result<Vec<crate::services::planning::DebtScheduleDto>, String> {
    let db_path = state.paths().db_path().to_path_buf();
    let key = state.secrets().sqlcipher_key().to_string();
    spawn_blocking(move || {
        let svc = PlanningService::new(db_path, Some(key), "seed-user".to_string())
            .map_err(|e| e.to_string())?;
        svc.list_schedules(&debt_id).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn confirm_debt_payment(
    state: State<'_, AppState>,
    input: ConfirmDebtPaymentInput,
) -> Result<crate::services::planning::DebtScheduleDto, String> {
    let db_path = state.paths().db_path().to_path_buf();
    let key = state.secrets().sqlcipher_key().to_string();
    spawn_blocking(move || {
        let svc = PlanningService::new(db_path, Some(key), "seed-user".to_string())
            .map_err(|e| e.to_string())?;
        svc.confirm_debt_payment(input).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn plan_vs_actual(
    state: State<'_, AppState>,
    plan_id: String,
) -> Result<crate::services::planning::PlanActualSummary, String> {
    let db_path = state.paths().db_path().to_path_buf();
    let key = state.secrets().sqlcipher_key().to_string();
    spawn_blocking(move || {
        let svc = PlanningService::new(db_path, Some(key), "seed-user".to_string())
            .map_err(|e| e.to_string())?;
        svc.plan_vs_actual(&plan_id).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}
