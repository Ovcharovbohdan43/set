mod budgets;
mod dashboard;
mod export;
mod goals;
mod import;
mod reminders;
mod reports;
mod settings;
mod sync;
mod transactions;
mod planning;

pub use budgets::*;
pub use dashboard::*;
pub use export::*;
pub use goals::*;
pub use import::*;
pub use reminders::*;
pub use reports::*;
pub use settings::*;
pub use sync::*;
pub use transactions::*;
pub use planning::*;

use serde::Serialize;
use tauri::State;

use crate::{
    services::ServiceDescriptor,
    state::{AppState, PathSummary},
};

#[derive(Serialize)]
pub struct Healthcheck {
    pub status: &'static str,
    pub paths: PathSummary,
    pub services: Vec<ServiceDescriptor>,
}

#[tauri::command]
pub fn ping(state: State<AppState>) -> Healthcheck {
    Healthcheck {
        status: "ok",
        paths: state.paths().summary(),
        services: state.services().descriptors(),
    }
}
