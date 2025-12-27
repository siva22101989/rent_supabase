# Medusa Project Rules

## Phase 1: Medusa Project Discovery

- Extract version from `package.json`
- Identify structure (`src` vs `app`)
- Check database (`postgres` vs `sqlite`)

## Phase 4: Medusa Version-Aware Implementation

### Medusa v2 Pattern

- Models in `app/models/`
- Migrations: `npx medusa migrations generate`
- Services in `app/services/`
- API Routes in `app/api/`

### Medusa v1 Pattern

- Models in `src/models/`
- Migrations in `src/migrations/`
- Services in `src/services/`
- API Routes in `src/api/`

## Phase 11: Medusa Performance Optimization

- **N+1 Query Detection**: Use eager loading (`relations`) instead of loops calling services.
- **Batch Loading**: Prioritize bulk operations.

## Phase 14: Medusa Transaction Management

- Use `MedusaContainer` to resolve managers.
- Wrap multi-operation writes in `manager.transaction`.
- Use `.withTransaction(transactionManager)` for nested service calls.

## Phase 18: Advanced Medusa Patterns

- **Event Bus**: Emit domain events after state changes.
- **Workflows SDK**: Use `createWorkflow` for complex processes with rollback needs.

## Medusa Error Detection

- Common errors: "Migration failed", "Service not found", "Type error" in Medusa types.
- Post-write: `npm run build` or `npm run type-check`.
