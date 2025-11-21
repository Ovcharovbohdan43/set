import { z } from 'zod';

export const syncDeltaSchema = z.object({
  entity: z.string(),
  version: z.string(),
  checksum: z.string(),
  payload: z.unknown()
});

export const syncEnvelopeSchema = z.object({
  cursor: z.string(),
  deltas: z.array(syncDeltaSchema),
  encryptedPayload: z.string(),
  signature: z.string(),
  jwtUsed: z.boolean()
});

export const syncUploadInputSchema = z.object({
  cursor: z.string().optional(),
  jwt: z.string().optional()
});

export const syncDownloadInputSchema = z.object({
  cursor: z.string().optional(),
  jwt: z.string().optional()
});

export const syncUploadResultSchema = z.object({
  envelope: syncEnvelopeSchema
});

export const syncDownloadResultSchema = z.object({
  envelope: syncEnvelopeSchema,
  applied: z.number(),
  conflicts: z
    .array(
      z.object({
        entity: z.string(),
        id: z.string(),
        reason: z.string()
      })
    )
    .default([])
});

export type SyncDelta = z.infer<typeof syncDeltaSchema>;
export type SyncEnvelope = z.infer<typeof syncEnvelopeSchema>;
export type SyncUploadInput = z.infer<typeof syncUploadInputSchema>;
export type SyncDownloadInput = z.infer<typeof syncDownloadInputSchema>;
export type SyncUploadResult = z.infer<typeof syncUploadResultSchema>;
export type SyncDownloadResult = z.infer<typeof syncDownloadResultSchema>;

export function deriveSyncStatus(envelope?: SyncEnvelope) {
  if (!envelope) {
    return {
      status: 'idle' as const,
      summary: 'Sync has not run yet.'
    };
  }

  const total = envelope.deltas.length;
  const checksumSample = envelope.deltas.slice(0, 2).map((delta) => delta.checksum).join(',');
  return {
    status: 'ready' as const,
    summary: `${total} entities prepared (checksum sample: ${checksumSample || 'n/a'})`
  };
}
