import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { assertSafeChild, isSafeChild } from '@/utils/security/pathGuard';

describe('pathGuard', () => {
  it('identifies safe children', () => {
    const base = path.join('app', 'data');
    const file = path.join('app', 'data', 'attachments', 'image.png');
    expect(isSafeChild(base, file)).toBe(true);
  });

  it('prevents traversal', () => {
    const base = path.join('app', 'data');
    const traversal = path.join('app', 'data', '..', 'secret.txt');
    expect(isSafeChild(base, traversal)).toBe(false);
    expect(() => assertSafeChild(base, traversal)).toThrow(/traversal/i);
  });

  it('treats identical paths as safe', () => {
    const base = path.join('app', 'data');
    expect(() => assertSafeChild(base, base)).not.toThrow();
  });
});

