---
description: Best practices for setting up CI/CD pipelines, Docker containerization, and system monitoring for Medusa.
---

# CI/CD & Monitoring Workflows

## Workflow 23: Deployment Pipeline (CI/CD)

**Goal:** Automate the lifecycle from PR to Production.

### 1. Essential CI Stages

- **Quality:** Run `npm run lint` and `npm run type-check`.
- **Security:** `npm audit --audit-level=high` and secret scanning (TruffleHog).
- **Test:** Run Unit (`npm test`) and Integration (`npm run test:integration`).
- **Build:** Verify Docker image build and bundle size.

### 2. Deployment Protocol

- **Staging:** Auto-deploy on `main` merge. Run migrations and health checks.
- **Production:** Manual trigger or tag-based release. Requires DB backup (`pg_dump`) and smoke tests.
- **Rollback:** Always maintain the ability to re-deploy the previous successful image tag.

---

## Workflow 24: Containerization (Docker)

**Goal:** Consistent environment execution.

### 1. Dockerfile Pattern

- **Multi-Stage:** `Stage 1 (Build)`: Install all deps -> Build. `Stage 2 (Prod)`: Copy `dist` and `node_modules` (prod-only) -> Run.
- **Base:** Use `node:18-alpine` for minimal surface area.
- **Security:** Run as `node` user, not `root`.

### 2. Orchestration (Compose)

- Define `postgres:14-alpine` and `redis:7-alpine`.
- Inject `DATABASE_URL` and `REDIS_URL` via environment variables.

---

## Workflow 25: Monitoring & Reliability

**Goal:** Real-time visibility into system health.

### 1. Observability Stack

- **Error Tracking:** Initialize Sentry in production; capture exceptions with context.
- **Metrics:** Expose `/metrics` for Prometheus (counters for orders, histograms for response times).
- **Health:** `/health` endpoint must check DB and Redis connectivity.

### 2. Alerting Logic

- **High Error Rate:** Alert if >5% of requests return 5xx status.
- **Latency:** Alert if P95 response time > 1s for 5 consecutive minutes.
- **Saturation:** Alert if DB connection pool or Memory exceeds 90% utilization.

---

> [!CAUTION]
> Never run migrations in production without a verified, recent database backup.
