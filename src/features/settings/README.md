# Settings Feature

## Purpose
Manages user preferences, account/category management, sync toggles, data operations (export/import), and appearance settings including theme switching.

## Detailed Description
The Settings feature provides a comprehensive settings interface with multiple sections:
- **General**: Default currency, locale, week start day, display name, telemetry toggle
- **Personalization**: Theme preference with explicit toggle buttons (Light/Dark) and dropdown selector (Auto/Light/Dark) with system preference detection
- **Appearance**: Additional appearance settings (legacy section, kept for compatibility)
- **Categories**: Category reordering with drag-and-drop (planned)
- **Accounts**: Account management (planned)
- **Sync**: Manual sync trigger, status pill, signature preview (powered by `useSyncStatus`)
- **Notifications**: Notification preferences (planned)
- **Data**: Export/import functionality with validation and quarantine

Theme management is handled by `ThemeProvider` component at app level, which initializes theme on app startup and applies it to document root. Theme preference is persisted in database and synced across app restarts.

## How to Use

### Accessing Settings
Navigate to `/settings` in the app or click the "Settings" link in the main navigation.

### General Settings
1. Set your display name, default currency, locale, and week start day
2. Toggle telemetry opt-in/out
3. Click "Save Changes" to persist settings

### Personalization Settings
1. Navigate to the Personalization section
2. Use the dropdown to select theme preference: Auto (follows system), Light, or Dark
3. Or use the quick toggle buttons (Light/Dark) for immediate theme switching
4. Theme is applied immediately and persisted to the database

### Appearance Settings
1. Navigate to the Appearance section for additional appearance customization options

### Category Reordering
1. Navigate to the Categories section
2. Drag and drop categories to reorder (requires drag-and-drop library integration)
3. Order is persisted automatically

### Data Export/Import
1. Navigate to the Data section
2. Click "Export Data" to export transactions, accounts, budgets, and goals
3. Use "Import Data" to restore from backup (validation planned)

## Examples

```typescript
// Get user settings
const { data: settings } = useUserSettingsQuery();

// Update settings
const updateMutation = useUpdateUserSettingsMutation();
await updateMutation.mutateAsync({
  themePreference: 'dark',
  defaultCurrency: 'EUR'
});
```

## How to Test

### Unit Tests
- Settings reducers and validation logic
- Theme switcher logic with prefers-color-scheme
- Sync envelope summarization helpers (`deriveSyncStatus`)

### Integration Tests
- Settings persistence to database
- Theme preference application on mount
- Category reorder persistence
- Sync commands invoke `syncUpload`/`syncDownload` and surface status in UI

### Component Tests
- Settings page navigation
- Theme switcher interaction
- Category drag-and-drop (when implemented)

### E2E Tests
- Change locale and currency -> verify budgets/transactions respect formatting
- Switch theme -> verify CSS tokens update
- Reorder categories -> verify persistence
- Trigger sync -> verify status pill updates and signature appears

## Limitations
- Drag-and-drop for categories requires @dnd-kit/core integration
- Import validation and quarantine are planned for future enhancement
- Account management UI is planned for future enhancement

## Modules Impacted
- `src-tauri/src/services/settings/`: Settings service on Rust backend
- `src-tauri/src/commands/settings.rs`: Tauri commands for settings
- `src/features/settings/`: React components, hooks, API, schemas
- `src/app/providers/ThemeProvider.tsx`: Theme initialization and management at app level
- `src/app/providers/AppProviders.tsx`: ThemeProvider integration
- `prisma/schema.prisma`: User model with theme_preference field

## Version
1.2.0

## Last Updated
2025-11-21

## Changelog
- [2025-11-21] - Added: Sync section with manual trigger and status pill powered by `useSyncStatus`, exposing HMAC-signed envelopes for packaging & sync verification.
- [2025-01-20] - Added: Initial Settings feature implementation with General, Appearance, Categories, and Data sections. Theme switcher with light/dark/auto support and system preference detection. Telemetry toggle. Settings service on Rust backend with Tauri commands.
- [2025-01-20] - Fixed: Theme switching issues - created ThemeProvider for app-level theme initialization, preventing theme from switching to dark when opening Appearance settings tab. Added Personalization section with explicit theme toggle buttons. Improved error handling in GeneralSection with retry logic and better visual feedback. Added retry logic with exponential backoff to useUserSettingsQuery hook.
