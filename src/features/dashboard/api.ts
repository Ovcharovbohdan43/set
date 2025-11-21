import { invoke } from '@tauri-apps/api/core';

import {
  dashboardSnapshotSchema,
  type DashboardSnapshot
} from './schema';

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  const payload = await invoke<DashboardSnapshot>('get_dashboard_snapshot');
  return dashboardSnapshotSchema.parse(payload);
}

