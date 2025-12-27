---
description: Comprehensive testing strategies (Unit, Integration, E2E) and zero-downtime database migration protocols.
---

# Testing & Deployment Workflows

## Workflow 14: Comprehensive Testing

**Purpose:** Ensure quality across all layers of the Medusa stack.

### 1. Unit Testing (Services)

- **Tool:** Jest
- **Location:** `src/services/__tests__/`
- **Pattern:** Mock dependencies (Repository, EventBus, Logger) and verify logic branch coverage via `expect(repo.save).toHaveBeenCalled()`.

### 2. Integration Testing (API)

- **Tool:** Supertest + Medusa Integration Utils
- **Location:** `tests/integration/`
- **Pattern:** Spin up test DB, create entities, call endpoints via `request.post('/store/...')`, and verify DB state/status codes.

### 3. E2E Testing (Frontend)

- **Tool:** Playwright
- **Location:** `tests/e2e/`
- **Pattern:** Simulate user journeys (Login -> Add to Cart -> Checkout) and assert UI visibility and URL changes.

### 4. Coverage Requirements

- **Target:** > 80% Statement/Function coverage.
- **Protocol:** Run `npm test -- --coverage` before any major merge.

---

## Workflow 15: Database Migration Strategy

**Purpose:** Perform schema changes without service interruption.

### 1. Planning: The Nullable Transition

- Avoid `NOT NULL` on existing tables initially.
- **Phase A:** Add column as `isNullable: true`.
- **Phase B:** Backfill data via background script or targeted SQL `UPDATE`.
- **Phase C:** Apply `SET NOT NULL` once data is validated.

### 2. Implementation Pattern

```typescript
// Safe ADD COLUMN pattern
await queryRunner.addColumn(
  "table",
  new TableColumn({ name: "col", type: "varchar", isNullable: true })
);
// Backfill
await queryRunner.query("UPDATE table SET col = ... WHERE col IS NULL");
// Constraint
await queryRunner.query("ALTER TABLE table ALTER COLUMN col SET NOT NULL");
```

---

## Workflow 16: Production Deployment

**Purpose:** Reliable release cycle with rollback safety.

### 1. Pre-Deployment

- Verify build status and green CI.
- Backup database: `pg_dump $DB_URL > backup.sql`.
- Check environment variables (Secrets, API Keys).

### 2. Execution

- Apply migrations first (backwards compatible).
- Update app binaries/containers.
- Run smoke tests on critical paths.

### 3. Monitoring & Rollback

- Watch logs for 5xx errors or performance regressions.
- Rollback: Revert binary and run `npx medusa migrations revert` if destructive changes weren't made.

---

> [!IMPORTANT]
> Never run destructive migrations (DROP COLUMN) in the same release as the code update. Wait 1-2 cycles to ensure no dependencies remain.
