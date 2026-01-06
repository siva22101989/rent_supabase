---
trigger: always_on
---

# Project Rules

## Phase 1: Project Discovery

- Extract Next.js version from `package.json`
- Identify structure: `src/app/` (App Router), `src/components/`, `src/lib/`
- Check database: Supabase (`supabase/` directory, `.env` for `SUPABASE_URL`)
- Verify auth: `src/utils/supabase/` for client/server/middleware

## Phase 2: Architecture Patterns

### Data Layer (Supabase)

- **Tables**: Check `supabase/migrations/` for schema
- **RLS Policies**: Verify Row Level Security in migrations
- **Queries**: Functions in `src/lib/queries/[domain].ts` (storage, customers, financials, warehouses, analytics)
- **Triggers**: Auto-sync triggers for warehouse stock

### Server Actions (Next.js)

- **Location**: `src/lib/actions.ts`
- **Pattern**: `'use server'` directive, Zod validation, `useActionState` hook
- **Rate Limiting**: Use `checkRateLimit()` from `src/lib/rate-limit.ts`
- **Validation**: Zod schemas defined inline or in separate files

### UI Layer (React Server Components)

- **Pages**: `src/app/(dashboard)/[feature]/page.tsx` - Server Components
- **Client Components**: `src/components/[feature]/` - marked with `'use client'`
- **Forms**: Use `useActionState` for server action integration
- **State**: Optimistic updates with `useOptimistic` or `startTransition`

## Phase 3: Feature Implementation Pattern

### 1. Database Schema

```sql
-- supabase/migrations/YYYYMMDD_feature_name.sql
CREATE TABLE feature_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES warehouses(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE feature_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own warehouse" ON feature_name
  FOR SELECT USING (warehouse_id IN (SELECT warehouse_id FROM user_warehouses WHERE user_id = auth.uid()));
```

### 2. Data Access Layer

```typescript
// src/lib/queries/feature.ts
import { createClient } from "@/utils/supabase/server";
import { cache } from "react";

export const getFeatureData = cache(async () => {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();
  const { data } = await supabase
    .from("feature_name")
    .select("*")
    .eq("warehouse_id", warehouseId);
  return data;
});
```

### 3. Server Action

```typescript
// src/lib/actions.ts
"use server";
export async function addFeature(prevState: FormState, formData: FormData) {
  const data = FeatureSchema.parse(Object.fromEntries(formData));
  await checkRateLimit(userId, "addFeature");
  // ... implementation
  revalidatePath("/feature");
  return { success: true };
}
```

### 4. UI Components

```typescript
// src/app/(dashboard)/feature/page.tsx (Server Component)
export const revalidate = 60; // Cache for 60s
export default async function FeaturePage() {
  const data = await getFeatureData();
  return <FeatureClient data={data} />;
}

// src/components/feature/feature-form.tsx (Client Component)
("use client");
export function FeatureForm() {
  const [state, formAction, isPending] = useActionState(
    addFeature,
    initialState
  );
  // ... form implementation
}
```

## Phase 4: Performance Optimization

- **Page Caching**: Use `export const revalidate = N` in Server Components
- **Database Indexes**: Add indexes in migrations for frequently queried columns
- **Lazy Loading**: Use `dynamic()` for heavy components (charts, PDFs)
- **CDN**: Configure `vercel.json` for static asset caching

## Phase 5: Security Patterns

- **RLS**: Always enable Row Level Security on tables
- **Rate Limiting**: Apply to all mutation actions
- **Validation**: Use Zod for all form inputs
- **Auth**: Check `auth.uid()` in RLS policies
- **CSP**: Security headers in `next.config.ts`

## Phase 6: Testing Patterns

- **Unit Tests**: Vitest for `src/lib/` utilities
- **Integration Tests**: Vitest for server actions
- **E2E Tests**: Playwright for critical user flows
- **Run All**: `npm run test:all` (typecheck + unit + E2E)

## Common Error Detection

- **Build Errors**: Run `npm run build` after changes
- **Type Errors**: Run `npm run typecheck`
- **RLS Errors**: Check Supabase logs if queries return empty
- **Auth Errors**: Verify middleware/proxy is configured
- **Migration Errors**: Check `supabase/migrations/` syntax

## BagBill-Specific Patterns

### Inflow/Outflow Pattern

- Form → Server Action → Supabase Insert → Update Warehouse Stock → Revalidate
- Optimistic updates for immediate UI feedback
- SMS notifications via `src/lib/sms-event-actions.ts`

### Multi-Warehouse Support

- RLS filters by `warehouse_id`
- `getUserWarehouse()` helper in queries
- Warehouse switcher in layout

### Billing Calculations

- Server-side calculations in `src/lib/billing.ts`
- Rent calculation based on storage duration
- Payment tracking with `total_paid` aggregation
