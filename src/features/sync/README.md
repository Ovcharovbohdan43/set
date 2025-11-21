# Sync Module

Cloud sync enablement for Stage 9. Provides typed helpers and UI hooks for invoking the new Tauri `syncUpload` and `syncDownload` commands, summarizing sync envelopes, and surfacing manual sync triggers inside Settings.

- **API**: `syncUpload(input?)`, `syncDownload(input?)` (`src/features/sync/api.ts`) call Tauri commands with Zod validation.
- **Schema**: `syncEnvelopeSchema`, `syncDeltaSchema` define the contract returned from the Rust `SqliteSyncService` and are reused in tests/components.
- **Hooks**: `useSyncStatus(jwt?)` offers `triggerSync`, `triggerDownload`, and derived status text for the Settings page.
- **UI**: See `src/features/settings/components/sections/SyncSection.tsx` for the sync card, status pill, and manual trigger button.
- **Tests**: `tests/unit/utils/sync.test.ts` validates envelope summarization and input guards.

> Security note: JWT is optional for local development. In production, provide `PF_SYNC_JWT` to the UI or configure the Fastify sync gateway credentials per `docs/architecture.md`.
