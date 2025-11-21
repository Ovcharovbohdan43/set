import { describe, expect, it } from 'vitest';

import { deriveSyncStatus } from '@/features/sync/schema';

describe('sync envelope helpers', () => {
  it('returns idle when no envelope', () => {
    const status = deriveSyncStatus(undefined);
    expect(status.status).toBe('idle');
    expect(status.summary).toContain('not run');
  });

  it('summarizes deltas with checksum hint', () => {
    const status = deriveSyncStatus({
      cursor: '123',
      encryptedPayload: 'abc',
      signature: 'sig',
      jwtUsed: true,
      deltas: [
        { entity: 'transaction', version: '1', checksum: 'a', payload: {} },
        { entity: 'budget', version: '1', checksum: 'b', payload: {} }
      ]
    });

    expect(status.status).toBe('ready');
    expect(status.summary).toContain('2 entities');
    expect(status.summary).toContain('a,b');
  });
});
