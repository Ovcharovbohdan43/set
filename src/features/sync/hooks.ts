import { useCallback, useMemo, useState } from 'react';

import { syncDownload, syncUpload, summarizeEnvelope } from './api';
import type { SyncEnvelope, SyncUploadResult } from './schema';

export interface SyncStatus {
  isSyncing: boolean;
  lastCursor: string | null;
  envelope?: SyncEnvelope;
  message: string;
  error?: string | null;
  triggerSync: () => Promise<SyncUploadResult | undefined>;
  triggerDownload: () => Promise<void>;
}

export function useSyncStatus(jwt?: string): SyncStatus {
  const [envelope, setEnvelope] = useState<SyncEnvelope>();
  const [lastCursor, setLastCursor] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerSync = useCallback(async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const result = await syncUpload({ cursor: lastCursor ?? undefined, jwt });
      setEnvelope(result.envelope);
      setLastCursor(result.envelope.cursor);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      setError(message);
    } finally {
      setIsSyncing(false);
    }
  }, [jwt, lastCursor]);

  const triggerDownload = useCallback(async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const result = await syncDownload({ cursor: lastCursor ?? undefined, jwt });
      setEnvelope(result.envelope);
      setLastCursor(result.envelope.cursor);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Download failed';
      setError(message);
    } finally {
      setIsSyncing(false);
    }
  }, [jwt, lastCursor]);

  const message = useMemo(() => summarizeEnvelope(envelope), [envelope]);

  return {
    isSyncing,
    lastCursor,
    envelope,
    message: message.summary,
    error,
    triggerSync,
    triggerDownload
  };
}
