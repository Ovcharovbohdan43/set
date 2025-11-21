# Export / Import Utilities

## Purpose
Provides scripts and utilities for exporting and importing financial data in various formats (CSV, JSON, encrypted JSON, PNG).

## Detailed Description
The export/import system supports:
- **CSV Export**: Spending by category data for spreadsheet analysis
- **JSON Export**: Full monthly report data in readable JSON format
- **Encrypted JSON Export**: Secure backup with base64 encoding and checksum verification
- **PNG Export**: Chart visualizations exported as high-resolution images

## Export Formats

### CSV Export
Exports spending by category data:
- Format: `report_{month}_spending.csv`
- Columns: Category, Amount, Percentage, Transaction Count
- Location: `%APPDATA%/FinanceApp/storage/exports/`

### JSON Export
Exports complete monthly report:
- Format: `report_{month}.json`
- Contains: spending by category, trend line, income vs expense, budget summaries, forecast
- Location: `%APPDATA%/FinanceApp/storage/exports/`

### Encrypted JSON Export
Exports secure backup:
- Format: `report_{month}_encrypted.json`
- Encryption: Base64 encoding (placeholder - production should use AES-GCM)
- Includes: version, timestamp, checksum, encrypted data
- Location: `%APPDATA%/FinanceApp/storage/exports/`

### PNG Export
Exports chart as image:
- Format: `chart_{chartType}_{month}.png`
- Resolution: 2x pixel ratio for high quality
- Chart types: spending-by-category, income-vs-expense, monthly-trend, budget-progress
- Location: `%APPDATA%/FinanceApp/storage/exports/`

## How to Use

### Via UI
1. Navigate to Reports page
2. Click "Export" button in header for full report export
3. Click "Export" button on individual charts for PNG export
4. Select export format from dropdown menu
5. File will be saved to exports directory

### Via Tauri Commands
```typescript
import { invoke } from '@tauri-apps/api/core';

// Export CSV
await invoke('export_report_csv', {
  month: '2025-01',
  spendingByCategory: [...]
});

// Export JSON
await invoke('export_report_json', {
  month: '2025-01',
  report: {...}
});

// Export Encrypted JSON
await invoke('export_report_encrypted_json', {
  month: '2025-01',
  report: {...}
});

// Export Chart PNG
await invoke('export_chart_png', {
  chartType: 'spending-by-category',
  month: '2025-01',
  chartDataBase64: '...'
});
```

## Import (Planned)
Import functionality is planned for future enhancement:
- CSV import with validation
- JSON import with schema versioning
- Encrypted JSON decryption and import
- Checksum verification
- Duplicate detection and conflict resolution

## Security Considerations
- Exports are saved to user's app data directory (not accessible by other users on Windows)
- Encrypted JSON uses base64 encoding as placeholder - production should use AES-GCM with user key
- Checksums are calculated for encrypted exports to detect tampering
- No sensitive data (passwords, keys) is included in exports

## Testing
- Unit tests: Export format validation, checksum calculation
- Integration tests: File creation, path resolution, error handling
- E2E tests: Full export flow from UI to file system

## Limitations
- PDF export is planned for future enhancement
- Import functionality is not yet implemented
- Encrypted JSON uses simple base64 encoding (not production-grade encryption)
- Export directory must be writable by the application

## Modules Impacted
- `src-tauri/src/commands/export.rs`: Export command handlers
- `src/features/reports/components/ExportButton.tsx`: UI export controls
- `src/features/reports/api.ts`: Frontend export API
- `src-tauri/src/state.rs`: Exports directory path resolution

## Version / Date Updated
- Version: 1.0.0
- Last Updated: 2025-01-20

## Changelog
- [2025-01-20] – Added: Initial export functionality (CSV, JSON, encrypted JSON, PNG) with Tauri commands and UI integration.
