# Project Rules

## Phase 1: Project Discovery

- Extract Next.js version from `package.json`
- Identify structure: `src/app/` (App Router), `src/components/`, `src/lib/`
- Check database: Supabase (`supabase/` directory, `.env` for `SUPABASE_URL`)
- Verify auth: `src/utils/supabase/` for client/server/middleware

## Phase 2: Architecture Patterns

### Data Layer (Supabase)

- **Single Source of Truth**: Data schema is defined in `supabase/migrations/20260115000013_single_truth.sql`. All other migrations are archived.
- **RLS Policies**: Row Level Security is mandatory on all tables.
- **Queries**: Functions in `src/lib/queries/[domain].ts` (storage, customers, financials, warehouses, analytics).
- **Triggers**: Auto-sync triggers for warehouse stock and subscription status.

### Server Actions (Next.js)

- **Location**: `src/lib/actions.ts` and `src/lib/[domain]-actions.ts`.
- **User Context**: Use `createClient()` (RLS-enabled) for standard user actions.
- **Admin Context**: Use `createAdminClient()` (Service Role) ONLY for system-level tasks (e.g., cron jobs, cross-tenant admin tools, subscription management).
- **Validation**: Zod schemas defined inline or in separate schema files.

### UI Layer (React Server Components)

- **Pages**: `src/app/(dashboard)/[feature]/page.tsx` - Server Components.
- **Client Components**: `src/components/[feature]/` - marked with `'use client'`.
- **Forms**: Use `useActionState` for server action integration.
- **State**: Optimistic updates with `useOptimistic` or `startTransition`.

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

### 2. Subscription Lifecycle

- **Plans Table**: Includes `duration_days` (30 for monthly, 365 for yearly, 0 for free/no-expiry).
- **Expiry Logic**: Automated via Vercel Cron calling `/api/cron/subscription-expiry`.
- **Transitions**: Active -> Grace Period -> Expired -> Active (Downgraded to Free).
- **Notifications**: Automated alerts at 7 days, 3 days, 1 day, and on expiry.

## Phase 4: Performance Optimization

- **Page Caching**: Use `export const revalidate = N` in Server Components.
- **Database Indexes**: Add indexes for frequently queried columns (`warehouse_id`, `status`).
- **Lazy Loading**: Use `dynamic()` for heavy components (charts, PDFs).
- **CDN**: Configure `vercel.json` for static asset caching.

## Phase 5: Security Patterns

- **RLS**: Always enable Row Level Security on tables.
- **Roles**: Use `public.user_roles` to manage permissions (Super Admin, Owner, Manager).
- **Cron Security**: Protect cron endpoints with `CRON_SECRET` bearer token validation.
- **Validation**: Use Zod for all form inputs.
- **Auth**: Check `auth.uid()` in RLS policies.

## Phase 6: Testing Patterns

- **Unit Tests**: Vitest for `src/lib/` utilities.
- **Integration Tests**: Vitest for server actions.
- **E2E Tests**: Playwright for critical user flows.
- **Run All**: `npm run test:all` (typecheck + unit + E2E).

## Common Error Detection

- **Build Errors**: Run `npm run build` after changes.
- **Type Errors**: Run `npm run typecheck`.
- **RLS Errors**: Check Supabase logs if queries return empty.
- **Migration Errors**: Ensure `single_truth.sql` is valid and can be applied cleanly.

## Grain Flow-Specific Patterns

### Inflow/Outflow Pattern

- Form → Server Action → Supabase Insert → Update Warehouse Stock → Revalidate.
- Optimistic updates for immediate UI feedback.
- SMS notifications via `src/lib/sms-event-actions.ts`.

### Multi-Warehouse Support

- RLS filters by `warehouse_id`.
- `getUserWarehouse()` helper in queries.
- Warehouse switcher in layout.

### Billing Calculations

- Server-side calculations in `src/lib/billing.ts`.
- Rent calculation based on storage duration.
- Payment tracking with `total_paid` aggregation.

## Full Stack Consistency

- **Synchronized Updates**: Any database change MUST be reflected in `single_truth.sql` and the frontend codebase.
- **Scope of Update**: Update types, Zod schemas, queries, and UI components together.
- **Validation**: Ensure Zod schemas match database constraints.
- **Soft Deletes**: Use `deleted_at` for critical data; filter these in all SELECT queries.
