# Frontend Services

Hooks/utilities that coordinate data fetching via Tauri commands (e.g., useMonthlyReport). Keep them pure and unit tested.

- `fs/securePath.ts` centralizes safe access to `appDataDir()` paths per Context7 guidance (ensures directories exist + rejects traversal).
