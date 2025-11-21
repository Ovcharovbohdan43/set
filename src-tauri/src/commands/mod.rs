mod budgets;
mod dashboard;
mod goals;
mod transactions;

pub use budgets::*;
pub use dashboard::*;
pub use goals::*;
pub use transactions::*;

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
