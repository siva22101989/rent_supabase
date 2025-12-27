---
description: Advanced Medusa patterns including event-driven architecture, transaction management, and plugin development.
---

# Advanced Medusa Patterns & Workflows

## Workflow 20: Event-Driven Architecture (EDA)

**Purpose:** Implement loosely coupled features via events.

### 1. Planning

- Identify trigger (e.g., `loyalty.points_added`).
- Define listener (e.g., `LoyaltyMilestoneSubscriber`).
- Determine side effect (e.g., `EmailService.send`).

### 2. Implementation

- **Emit:** In Service, inject `eventBusService` and call `this.eventBus_.emit(EVENT_NAME, data)`.
- **Subscribe:** In `src/subscribers/`, create handler and call `this.eventBus_.subscribe(EVENT_NAME, this.handleEvent)`.
- **Idempotency:** Use keys or state checks to prevent duplicate processing.

### 3. Verification

- Use `npm test` with mocks for `eventBusService` and `emailService`.
- Verify event capture and side-effect counts.

---

## Workflow 21: Transaction Management

**Purpose:** Ensure atomic updates across multiple services/repositories.

### 1. Analysis

- Identify atomic boundaries (e.g., "Deduct points + Update Order").
- Risk: Inconsistent state on partial failure.
- Solution: `atomicPhase_` wrapper.

### 2. Implementation Pattern

```typescript
async transactionalMethod(...) {
  return await this.atomicPhase_(async (manager) => {
    // Inject manager into other services
    const orderService = this.orderService_.withTransaction(manager)
    await this.withTransaction(manager).deductPoints(...)
    await orderService.update(...)
    return result
  })
}
```

### 3. Best Practices

- **Short Transactions:** Minimize lock duration.
- **No External APIs:** Avoid network calls inside DB transactions.
- **Error Handling:** Catch and log, but ensure re-throw to trigger rollback.

---

## Workflow 22: Plugin Development

**Purpose:** Create reusable modules for the Medusa ecosystem.

### 1. Structure

- `src/models/`, `src/services/`, `src/api/`, `src/subscribers/`
- `package.json`: Peer-depend on `@medusajs/medusa`.
- `index.ts`: Export `services`, `models`, `migrations`, `subscribers`.

### 2. Configuration

- Define `Options` type.
- Provide `defaultOptions`.
- Inject via constructor: `constructor(container, options)`.

### 3. Distribution

- `npm link` for local testing.
- `medusa-config.js`: Add to `plugins` array with options.
- Run migrations: `npx medusa migrations run`.

---

> [!TIP]
> Use EDA for non-critical side effects (notifications) and Transactions for critical data integrity (financials).
