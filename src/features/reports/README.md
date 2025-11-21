# Reports Feature

## Purpose
Provides comprehensive financial analytics and visualizations through interactive charts, reports, and export capabilities. The Reports feature enables users to analyze spending patterns, track trends, monitor budget progress, and forecast future financial performance.

## Detailed Description
The Reports feature consists of:

1. **Monthly Reports**: Comprehensive analysis for a selected month including:
   - Spending breakdown by category (pie chart)
   - Income vs expenses comparison (bar chart)
   - Budget progress tracking (bar chart)
   - Financial summary cards

2. **Trend Analysis**: 12-month historical trend visualization showing:
   - Income trends
   - Expense trends
   - Net cash flow

3. **Forecasting**: Simple linear regression-based predictions for next month's income and expenses with confidence scores.

4. **Data Caching**: Report data is cached for 30 minutes to improve performance and reduce database load.

## How to Use

### Accessing Reports
1. Navigate to the "Reports" tab in the main navigation
2. Use the month selector to view reports for different months
3. Charts automatically update when transaction data changes

### Reading Charts
- **Spending by Category**: Pie chart showing top 10 categories plus "Other" aggregate
- **Income vs Expenses**: Bar chart comparing income, expenses, and net for the selected month
- **12-Month Trend**: Line chart showing income, expenses, and net trends over the past year
- **Budget Progress**: Bar chart comparing budget targets vs actual spending

### Summary Cards
- Total Income: Sum of all income transactions for the month
- Total Expenses: Sum of all expense transactions for the month
- Net: Difference between income and expenses

### Forecast Card
- Projected Income: Predicted income for next month based on 3-month average
- Projected Expenses: Predicted expenses for next month based on 3-month average
- Confidence: Statistical confidence score (0-100%) based on variance

## Examples

### Monthly Report Query
```typescript
import { useMonthlyReport } from '@/features/reports/hooks';

function MyComponent() {
  const { data, isLoading } = useMonthlyReport('2025-01');
  // data contains MonthlyReport with all charts data
}
```

### Spending by Category Query
```typescript
import { useSpendingByCategory } from '@/features/reports/hooks';

function MyComponent() {
  const { data } = useSpendingByCategory('2025-01-01', '2025-01-31');
  // data contains array of SpendingByCategory items
}
```

### Monthly Trend Query
```typescript
import { useMonthlyTrend } from '@/features/reports/hooks';

function MyComponent() {
  const { data } = useMonthlyTrend(12); // Last 12 months
  // data contains array of MonthlyTrend items
}
```

## How to Test

### Unit Tests
```bash
pnpm test src/features/reports
```

### Integration Tests
Test report generation with sample data:
1. Seed database with transactions across multiple months
2. Navigate to Reports page
3. Verify charts render correctly
4. Change month selector and verify data updates
5. Verify cache invalidation when transactions change

### E2E Tests
```bash
pnpm test:e2e reports
```

Test scenarios:
- Load Reports page and verify charts display
- Change month and verify data updates
- Add transaction and verify cache invalidation
- Verify all chart types render correctly
- Test responsive layout on different screen sizes

## Architecture

### Components
- `ReportsPage.tsx`: Main page component with chart grid and month selector
- `Chart.tsx`: Reusable ECharts wrapper component with loading states and responsive sizing

### Services
- `ReportService` (Rust): Handles data aggregation, caching, and forecast calculations
- Tauri commands: `get_monthly_report`, `get_spending_by_category`, `get_monthly_trend`, `invalidate_report_cache`

### Data Flow
1. User navigates to Reports page
2. React Query hooks fetch data via Tauri commands
3. ReportService queries database (with cache check)
4. Data is aggregated and formatted
5. ECharts renders visualizations
6. Cache is invalidated when transactions change

### Caching Strategy
- Cache TTL: 30 minutes
- Cache keys: `{report_type}:{user_id}:{params}`
- Automatic invalidation on transaction changes
- Manual invalidation via `invalidate_report_cache` command

## Limitations
- Forecast uses simple linear regression (3-month average) - more sophisticated models planned for future
- Export functionality (PNG/PDF/CSV/JSON) is planned for Stage 7 Sub-stage 2
- Chart accessibility labels need enhancement for screen readers
- Performance optimization (indexes, materialized views) planned for Stage 7 Sub-stage 2

## Modules Impacted
- `src/features/reports/`: All UI components and hooks
- `src-tauri/src/services/reports/`: ReportService implementation
- `src-tauri/src/commands/reports.rs`: Tauri command handlers
- `prisma/schema.prisma`: ReportCache model
- `src/app/App.tsx`: Routing and navigation

## Version / Date Updated
- Version: 1.0.0
- Last Updated: 2025-01-20

## Changelog
- [2025-01-20] – Added: Initial Reports feature implementation with ECharts visualizations, monthly reports, trend analysis, and forecast cards. Implemented caching strategy and React Query integration.
