import { invoke } from '@tauri-apps/api/core';

import {
  deriveSyncStatus,
  syncDownloadInputSchema,
  syncDownloadResultSchema,
  syncUploadInputSchema,
  syncUploadResultSchema,
  type SyncDownloadInput,
  type SyncDownloadResult,
  type SyncEnvelope,
  type SyncUploadInput,
  type SyncUploadResult
} from './schema';

const DEFAULT_CURSOR_FALLBACK = 'local-bootstrap';

export async function syncUpload(input?: SyncUploadInput): Promise<SyncUploadResult> {
  const payload = syncUploadInputSchema.parse(input ?? { cursor: DEFAULT_CURSOR_FALLBACK });
  const result = await invoke<unknown>('syncUpload', { input: payload });
  return syncUploadResultSchema.parse(result);
}

export async function syncDownload(input?: SyncDownloadInput): Promise<SyncDownloadResult> {
  const payload = syncDownloadInputSchema.parse(input ?? { cursor: DEFAULT_CURSOR_FALLBACK });
  const result = await invoke<unknown>('syncDownload', { input: payload });
  return syncDownloadResultSchema.parse(result);
}

export function summarizeEnvelope(envelope?: SyncEnvelope) {
  return deriveSyncStatus(envelope);
}
