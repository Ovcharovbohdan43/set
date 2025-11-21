import { invoke } from '@tauri-apps/api/core';
import { dashboardSnapshotSchema } from './schema';
export async function fetchDashboardSnapshot() {
    const payload = await invoke('get_dashboard_snapshot');
    return dashboardSnapshotSchema.parse(payload);
}
