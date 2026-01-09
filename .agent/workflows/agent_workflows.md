---
description: Core workflows for GrainFlow project initialization, feature discovery, and dependency analysis.
---

# Discovery & Context Building Workflows

## Workflow 1: Session Initialization (Discovery)

**Goal:** Establish a baseline understanding of the GrainFlow project.

### 1. Fundamental Discovery

- **Structure:** `list_dir(".")` to find `package.json`, `next.config.ts`, `supabase/`
- **Version:** Check `package.json` for Next.js version (should be 16.x)
- **Database:** Check `supabase/migrations/` for schema files
- **Auth:** Verify `src/utils/supabase/` exists with client/server/middleware

### 2. Pattern Inventory

- **Routes:** List `src/app/(dashboard)/` to see all features (inflow, outflow, customers, etc.)
- **Queries:** Check `src/lib/queries/` for data access patterns (storage.ts, customers.ts, financials.ts)
- **Actions:** Review `src/lib/actions.ts` for server actions
- **Components:** List `src/components/` for reusable UI (forms, tables, dialogs)

---

## Workflow 2: Feature & Dependency Discovery

**Goal:** Align new features with existing architecture.

### 1. Scope Analysis

- Search for keywords (e.g., `grep_search` for "inflow" or "payment")
- If existing code found: Decide to extend vs. create new
- Find the closest "pattern donor" (e.g., use Inflow as template for new transaction type)

### 2. Dependency Guard

- **Verify:** Check `package.json` before suggesting new imports
- **Environment:** Check `.env` for required keys (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `TEXTBEE_API_KEY`)
- **Database:** Verify table exists in `supabase/migrations/`

---

## Workflow 3: Impact & Breaking Change Analysis

**Goal:** Safely evolve the codebase.

### 1. Change Triage

- **DB:** Check if migration requires backfilling or nullable toggles
- **RLS:** Verify policies allow the operation
- **UI:** `grep_search` usages of modified components to identify side effects

### 2. Safe Exploration

- **Trace:** Start at entry point (Page) → Server Action → Query → Database
- **Report:** Document the execution flow before proposing modifications

---

> [!IMPORTANT]
> Always verify `SUPABASE_URL` and database connection before running any destructive commands or migrations.
