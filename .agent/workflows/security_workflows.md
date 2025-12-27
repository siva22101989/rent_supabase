---
description: Workflows for security auditing, performance optimization, and load testing strategies.
---

# Security & Performance Workflows

## Workflow 11: Security Auditing

**Goal:** Proactively identify and remediate vulnerabilities.

### 1. Secret & Access Control

- **Secrets:** Scan for hardcoded tokens using regex (e.g., `/secret.*=.*['\"]/`). Move to `.env` immediately.
- **Auth:** Ensure `authenticate()` is present on all routes accessing `req.user`.
- **CORS:** Ensure `admin_cors` and `store_cors` are restricted to specific domains in production.

### 2. Logic & Data Integrity

- **Validation:** Every entry point must have a `zod` or `joi` schema. Direct usage of `req.body` is a violation.
- **SQLi:** Use parameterized queries (`$1, $2`) or TypeORM query builder. No string interpolation in raw SQL.
- **Error Handling:** Log detailed errors internally; return generic messages to clients to avoid stack exposure.

---

## Workflow 12: Performance Optimization

**Goal:** Maintain sub-200ms response times and high concurrency.

### 1. Computational Efficiency

- **N+1 Avoidance:** Replace loops containing `service.retrieve()` with batch loads (e.g., `service.list({ id: ids })`).
- **Caching:** Wrap frequent, slow read operations in `redis` caching with appropriate TTL (e.g., 1-5 mins).

### 2. Infrastructure Tuning

- **Indexes:** Ensure indexes on all foreign keys and frequently filtered columns (e.g., `customer_id`, `status`).
- **Connection Pool:** In production, scale `database_extra.max` to correlate with peak concurrent requests.
- **Memory:** Avoid growing arrays in long-lived subscribers. Use streams or clear buffers after processing.

---

## Workflow 13: Load & Stress Testing

**Goal:** Verify system stability under pressure.

### 1. Protocol

- **Baseline:** Run `k6` script with 10-50 VUs to establish performance P95.
- **Stress:** Increase load until error rate > 1% or P95 > 1s to find the breaking point.
- **Remediation:** If thresholds fail, check CPU/Memory spikes and connection pool saturation.

### 2. k6 Template

```javascript
export const options = { stages: [{ duration: "1m", target: 50 }] };
export default function () {
  const res = http.get("http://api/store/products");
  check(res, { "status 200": (r) => r.status === 200 });
}
```

---

> [!TIP]
> Run `npm audit` and `npm test` as the final guard before merging performance-critical changes.
