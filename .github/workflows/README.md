# CI/CD Workflows

- **build** (push/PR): Windows runner, installs dependencies, runs `pnpm lint`, `pnpm typecheck`, `pnpm test`, `cargo fmt --check`, `cargo clippy -- -D warnings`, `cargo test`, Playwright headless (`pnpm test:e2e`), then packages MSIX via `tauri-apps/tauri-action@v0` (secrets: `TAURI_PRIVATE_KEY`, `TAURI_KEY_PASSWORD`).
- **nightly-sync** (cron): Ubuntu runner, installs dependencies, executes `pnpm test --filter sync` against the Fastify sync mock to guard API compatibility.
- **Signing**: `src-tauri/tauri.conf.json` contains placeholders; CI injects signing material via secrets and does not store certificates in the repo.
- **Artifacts**: MSIX installers are uploaded to GitHub Releases with release notes (`tagName`/`releaseName` templated in the action). Use the updater endpoint defined in `tauri.conf.json` for client updates.
