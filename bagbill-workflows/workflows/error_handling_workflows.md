---
description: Systematic protocols for diagnosing errors, investigating issues, and debugging performance problems in BagBill.
---

# Error Handling Workflows

## Workflow 1: Build Error Diagnosis

**Goal:** Quickly identify and fix build errors.

### Step 1: Capture Full Error

```bash
npm run build 2>&1 | tee build-error.log
```

### Step 2: Analyze Error Type

- **TypeScript Error**: Run `npm run typecheck` for detailed output
- **Import Error**: Check file paths and exports
- **Syntax Error**: Check for missing brackets, semicolons

### Step 3: Fix and Verify

```bash
npm run build  # Should pass
```

---

## Workflow 2: Runtime Error Investigation

**Goal:** Debug errors in production or development.

### Step 1: Check Sentry

1. Go to Sentry dashboard
2. Find error by timestamp or user
3. Review stack trace and breadcrumbs

### Step 2: Reproduce Locally

```bash
npm run dev
# Navigate to the error path
# Check browser console and network tab
```

### Step 3: Add Logging

```typescript
// Temporary debug logs
console.log("[DEBUG]", { data, error });
```

### Step 4: Fix and Remove Logs

```bash
# Remove debug logs before committing
grep -r "\[DEBUG\]" src/
```

---

## Workflow 3: Database Query Errors

**Goal:** Debug Supabase query failures.

### Step 1: Check Supabase Logs

1. Go to Supabase Dashboard → Logs
2. Filter by timestamp
3. Look for SQL errors or RLS violations

### Step 2: Test Query Directly

```sql
-- Run in Supabase SQL Editor
SELECT * FROM storage_records WHERE warehouse_id = 'xxx';
```

### Step 3: Verify RLS Policies

```sql
-- Check if RLS is blocking the query
SELECT * FROM pg_policies WHERE tablename = 'storage_records';
```

### Step 4: Fix Query or Policy

```typescript
// Add missing filter
.eq('warehouse_id', warehouseId)

// Or update RLS policy in migration
```

---

## Workflow 4: Server Action Errors

**Goal:** Debug form submission failures.

### Step 1: Check Form Data

```typescript
// Add logging in server action
console.log("[FORM-DATA]", Object.fromEntries(formData));
```

### Step 2: Verify Validation

```typescript
const result = FeatureSchema.safeParse(rawData);
if (!result.success) {
  console.log("[VALIDATION-ERROR]", result.error.flatten());
}
```

### Step 3: Check Rate Limiting

```typescript
// Temporarily disable to test
// await checkRateLimit(...);
```

### Step 4: Verify Database Operation

```typescript
const { data, error } = await supabase.from('...').insert(...);
console.log('[DB-RESULT]', { data, error });
```

---

## Workflow 5: Performance Debugging

**Goal:** Identify and fix slow pages.

### Step 1: Measure Performance

```bash
# Run Lighthouse audit
npm run build
npm run start
# Open Chrome DevTools → Lighthouse
```

### Step 2: Identify Bottlenecks

- **Slow Database Query**: Add indexes
- **Large Bundle**: Use `dynamic()` for heavy components
- **No Caching**: Add `revalidate` to pages

### Step 3: Optimize

```typescript
// Add index in migration
CREATE INDEX idx_table_column ON table(column);

// Add caching to page
export const revalidate = 60;

// Lazy load component
const HeavyChart = dynamic(() => import('./heavy-chart'));
```

---

## Common Error Patterns

### "Cannot find module"

- Check import path
- Verify file exists
- Check `tsconfig.json` paths

### "Expected string, received null"

- Zod validation failing
- Check form field names match schema
- Verify data is being sent

### "RLS policy violation"

- User doesn't have access
- Check RLS policies in migrations
- Verify `warehouse_id` filter

### "Rate limit exceeded"

- Too many requests
- Check `checkRateLimit()` configuration
- Increase limit if legitimate use case
