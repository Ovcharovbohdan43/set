import '@testing-library/jest-dom/vitest';
import { Temporal as TemporalPolyfill } from '@js-temporal/polyfill';

if (!('Temporal' in globalThis)) {
  // @ts-expect-error - we are defining the Temporal global for tests.
  globalThis.Temporal = TemporalPolyfill;
}
