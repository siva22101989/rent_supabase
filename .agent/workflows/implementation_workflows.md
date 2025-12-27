---
description: Step-by-step guides for custom entity creation, service modifications, and API endpoint implementation.
---

# Implementation Workflows

## Workflow 8: Custom Entity Creation (Medusa v2)

**Goal:** Add a new feature with persistent data, logic, and API access.

### 1. Data Modeling

- **File:** `app/models/[entity-name].ts`
- **Pattern:** Use `model.define()` from `@medusajs/utils`. Define primary keys, indexes, and relations.

### 2. Schema Evolution

- **Generate:** `npx medusa db:generate [name]`
- **Review:** Check `migrations/` for correct types and constraints.
- **Apply:** `npx medusa db:migrate`
- **Verify:** `npx medusa db:show [table_name]`

### 3. Business Logic

- **File:** `app/services/[name].ts`
- **Pattern:** Class extends `MedusaService({ EntityName })`. Inject dependencies (repositories, loggers) in constructor.
- **Methods:** Implement atomic operations (Add, Remove, Retrieve, Update).

### 4. API & Integration

- **Routes:** Create `app/api/[store|admin]/[path]/route.ts`. Use `req.scope.resolve("[serviceName]")`.
- **Validation:** Use `zod` for request body parsing.
- **Tests:** Create `app/services/__tests__/[name].spec.ts`. Mock repositories and verify calls via `jest`.

---

## Workflow 9: Service & API Modifications

**Goal:** Enhance existing features safely.

### 1. Discovery

- Read existing service/route: `read_file("app/services/...")`.
- Identify entry points and dependency injections.

### 2. Implementation

- Apply targeted code changes.
- Verify build: `npm run build`.

### 3. Verification & Testing

- Add test cases to existing `.spec.ts` files.
- Run tests: `npm test -- [filename]`.
- (Optional) Verify via `curl` against local dev server: `npm run dev`.

---

## Workflow 10: Documentation

**Goal:** Maintain an accurate system manifest.

- Update `docs/[feature].md` with:
  - **API Endpoints:** Method, Path, Auth, Request/Response samples.
  - **Service Methods:** Signature and purpose.
  - **Database Schema:** Table name and field descriptions.

---

> [!NOTE] > **Compliance Audit (Full-Stack Feature):**
>
> - **Protocol:** Full-Stack Feature (`full_stack_feature.md`)
> - **Status:** ✅ Compliant.
> - **Steps Verified:**
>   1.  Backend Module (`wishlist`) & Models linked (`Customer`, `ProductVariant`).
>   2.  Admin/API Layer (`store/wishlist`) exposed.
>   3.  Storefront (`WishlistPage`) consuming API as Server Component.
>   4.  Build Verified (`npm run build` passed).
