---
description: Systematic protocols for diagnosing errors, investigating production issues, and debugging performance bottlenecks.
---

# Error Handling & Debugging Workflows

## Workflow 17: Systematic Error Diagnosis

**Goal:** Methodically eliminate bugs through logical elimination.

### 1. Capture & Classify

- **Input:** Full error message, stack trace, and trigger action.
- **Class:** Runtime (Undefined/Null), Syntax, DB (Constraint/Connection), or Auth (401/403).
- **Hypothesis:** Based on error type, identify most likely failure points (e.g., missing middleware, bad relation).

### 2. Investigation Protocol

- **Trace:** Locate error line via `read_file`. Trace data flow backwards to its source.
- **Pivot:** Check calling routes/services to see if required data/context (e.g., `req.user`) is missing.
- **Confirm:** Use `grep_search` to see if the bug pattern exists elsewhere (systemic issue).

### 3. Resolution & Prevention

- **Fix:** Smallest possible change to resolve root cause.
- **Verify:** Manual `curl` or `npm run dev` check.
- **Lock-in:** Add regression test case in relevant `.spec.ts` file.

---

## Workflow 18: Production Incident Management

**Goal:** Minimize downtime and revenue loss during outages.

### 1. Triage & Impact

- **Detect:** Use Sentry/Logs to find frequency and affected users.
- **Isolate:** Check Health Endpoints (`/health`). Determine if Internal vs. External (e.g., Stripe/SendGrid down).

### 2. Mitigation (Hotfix Strategy)

- **Workaround:** If external service is down, implement "Safe Mode" or "Queuing" (e.g., cache data, queue orders).
- **Deploy:** Fast-track hotfix branch through CI.
- **Communicate:** Update status pages or internal teams.

### 3. Post-Mortem

- Analyze "What went well" vs. "What failed".
- **Action Items:** Add circuit breakers, secondary providers, or improved monitoring.

---

## Workflow 19: Performance Optimization

**Goal:** Identify and resolve latency bottlenecks.

### 1. Measurement

- **Trace:** Add `performance.now()` logs around DB calls vs. Serialization.
- **Identify:** Determine the slowest phase (DB query, JS processing, Network).

### 2. Optimization Patterns

- **Database:** `EXPLAIN ANALYZE` the query. Add missing indexes on foreign keys/filters.
- **API:** Implement pagination (`skip/take`) to avoid loading large datasets.
- **Caching:** Use `cacheService` to store expensive query results (e.g., for 5 mins).

---

> [!CAUTION]
> Never apply a production hotfix without at least one automated regression test passed locally.
