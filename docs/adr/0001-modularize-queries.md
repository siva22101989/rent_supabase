# ADR 1: Modularization of Database Queries

## Status

Accepted

## Date

2025-12-26

## Context

The application originally had a monolithic `src/lib/queries.ts` file exceeding 1000 lines. This made maintenance difficult, increased the risk of merge conflicts, and made it harder to reason about domain-specific data fetching logic.

## Decision

We decided to split the monolithic `queries.ts` into several domain-specific modules within a new directory `src/lib/queries/`:

- `warehouses.ts`: Warehouse and user profile queries.
- `customers.ts`: Customer-related queries.
- `storage.ts`: Storage record and transaction queries.
- `financials.ts`: Expense and financial statistic queries.
- `analytics.ts`: Analytics, logging, and notification queries.

We also implemented an `index.ts` file in `src/lib/queries/` to re-export all functions, maintaining backward compatibility for existing imports in the form of `import { ... } from '@/lib/queries'`.

## Consequences

### Positive

- **Improved Maintainability:** Developers can now navigate to specific domains more easily.
- **Better Organization:** Logic is logically grouped by business domain.
- **Scalability:** New domains can be added as new files without further bloating a single file.

### Negative

- **Initial Refactoring Overhead:** Required updating several import references across the codebase (which was automated).
- **File Proliferation:** Increases the total number of files in the project.
