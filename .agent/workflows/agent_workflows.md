---
description: Core workflows for project initialization, feature discovery, dependency analysis, and environment discovery.
---

# Discovery & Context Building Workflows

## Workflow 1: Session Initialization (Discovery)

**Goal:** Establish a baseline understanding of the project.

### 1. Fundamental Discovery

- **Structure:** `list_dir(".")` to find `medusa-config.js`, `package.json`, and source root (`src` or `app`).
- **Version:** Check `package.json` for `@medusajs/medusa`. Note v1 vs v2 structure.
- **Config:** Read `medusa-config` for DB type, Redis status, and active modules/plugins.
- **Git:** `git status` to check for uncommitted changes and active branch.

### 2. Entity & Pattern Inventory

- **Entities:** List files in `[src|app]/models` to identify custom data structures.
- **Services:** List files in `[src|app]/services` to see existing business logic.
- **Conventions:** Read one core service to identify constructor injection and transaction patterns.

---

## Workflow 2: Feature & Dependency Discovery

**Goal:** Align new features with existing architecture.

### 1. Scope Analysis

- Search for keywords (e.g., `grep_search` for "loyalty" or "reward").
- If existing code found: Decide to extend vs. create.
- Find the closest "pattern donor" (e.g., use `ProductService` as a template for a new `PointsService`).

### 2. Dependency Guard

- **Verify:** Check `package.json` before suggesting new imports.
- **Pathing:** Confirm import paths match project version (v1 uses relative, v2 uses utility aliases).
- **Environment:** Check `.env` for required keys (e.g., `DATABASE_URL`, `JWT_SECRET`).

---

## Workflow 3: Impact & Breaking Change Analysis

**Goal:** Safely evolve the codebase.

### 1. Change Triage

- **DB:** Check if migration requires backfilling or nullable toggles.
- **API:** Identify if response shape changes break strict consumers.
- **Logic:** `grep_search` usages of modified methods/classes to identify side effects.

### 2. Safe Exploration

- **Trace:** Start at entry point (Route) -> Service -> Model -> Database.
- **Report:** Document the execution flow before proposing modifications.

---

> [!IMPORTANT]
> Always verify `NODE_ENV` and `DATABASE_URL` before running any destructive commands or migrations.
