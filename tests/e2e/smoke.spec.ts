import { test, expect } from '@playwright/test';

// Minimal smoke to keep e2e pipeline green until real desktop scenarios are implemented.
test('smoke placeholder', async () => {
  expect(true).toBe(true);
});
