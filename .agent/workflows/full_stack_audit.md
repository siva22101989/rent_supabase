---
description: Checklist for verifying feature completeness across Database, Server Actions, and UI in BagBill.
---

# Full-Stack Audit Workflow

**Goal:** Verify that features are fully implemented across all layers.

## Audit Checklist

### ✅ Database Layer

- [ ] Table exists in `supabase/migrations/`
- [ ] RLS is enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] Policies exist for SELECT, INSERT, UPDATE, DELETE
- [ ] Policies reference `auth.uid()` correctly
- [ ] Indexes exist for frequently queried columns
- [ ] Foreign keys are properly defined
- [ ] Triggers are working (if applicable)

**Verification:**

```sql
-- Check RLS
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Check indexes
SELECT * FROM pg_indexes WHERE tablename = 'your_table';
```

---

### ✅ Data Access Layer

- [ ] Query functions exist in `src/lib/queries/[domain].ts`
- [ ] Functions use `cache()` for Server Components
- [ ] Functions filter by `warehouse_id`
- [ ] Error handling with `logError()`
- [ ] Return types are properly typed

**Verification:**

```bash
grep -r "export const get" src/lib/queries/
```

---

### ✅ Server Actions Layer

- [ ] Actions exist in `src/lib/actions.ts`
- [ ] Actions have `'use server'` directive
- [ ] Zod schema validates all inputs
- [ ] Rate limiting is applied
- [ ] Error handling returns proper FormState
- [ ] `revalidatePath()` is called after mutations
- [ ] Audit logging for sensitive operations

**Verification:**

```bash
grep -r "export async function" src/lib/actions.ts
grep -r "checkRateLimit" src/lib/actions.ts
```

---

### ✅ UI Layer - Server Components

- [ ] Page exists in `src/app/(dashboard)/[feature]/page.tsx`
- [ ] Page uses query functions to fetch data
- [ ] Page has `revalidate` export for caching
- [ ] Page passes data to Client Component
- [ ] Breadcrumbs and PageHeader configured

**Verification:**

```bash
ls src/app/\(dashboard\)/*/page.tsx
grep -r "export const revalidate" src/app/
```

---

### ✅ UI Layer - Client Components

- [ ] Form component exists in `src/components/[feature]/`
- [ ] Form uses `useActionState` hook
- [ ] Form has `'use client'` directive
- [ ] Loading state with `isPending`
- [ ] Error display with `FormError`
- [ ] Success feedback (toast or redirect)
- [ ] Optimistic updates (if applicable)

**Verification:**

```bash
grep -r "useActionState" src/components/
grep -r "'use client'" src/components/
```

---

### ✅ Testing

- [ ] Unit tests for utilities
- [ ] Integration tests for server actions
- [ ] E2E tests for critical flows
- [ ] All tests pass (`npm run test:all`)

**Verification:**

```bash
npm run test:all
```

---

### ✅ Security

- [ ] RLS policies tested
- [ ] Rate limiting verified
- [ ] Input validation with Zod
- [ ] No secrets in client code
- [ ] CSP headers configured

**Verification:**

```bash
npm run security:verify-rls
```

---

### ✅ Performance

- [ ] Database indexes for common queries
- [ ] Page-level caching configured
- [ ] Heavy components lazy loaded
- [ ] Build size is reasonable

**Verification:**

```bash
npm run build
# Check bundle sizes in output
```

---

## Example Audit: Inflow Feature

### Database ✅

- Table: `storage_records`
- RLS: Enabled with warehouse-based policies
- Indexes: `warehouse_id`, `created_at`

### Data Access ✅

- Query: `getActiveStorageRecords()` in `src/lib/queries/storage.ts`
- Caching: Uses `cache()`

### Server Actions ✅

- Action: `addInflow()` in `src/lib/actions.ts`
- Validation: `InflowSchema` with Zod
- Rate Limit: 10 requests per user

### UI ✅

- Page: `src/app/(dashboard)/inflow/page.tsx`
- Form: `src/components/inflow/inflow-form.tsx`
- Optimistic: Uses `startTransition`

### Testing ✅

- E2E: `tests/inflow.spec.ts`
- All tests passing

**Result:** ✅ Feature is fully implemented

---

## Compliance Report Template

```markdown
# Feature: [Name]

## Database Layer

- [x] Table created
- [x] RLS enabled
- [x] Policies configured
- [x] Indexes added

## Data Access Layer

- [x] Query functions created
- [x] Caching implemented

## Server Actions

- [x] Actions created
- [x] Validation added
- [x] Rate limiting applied

## UI Layer

- [x] Page created
- [x] Form implemented
- [x] Loading states
- [x] Error handling

## Testing

- [x] Unit tests
- [x] E2E tests

## Status: ✅ COMPLIANT
```
