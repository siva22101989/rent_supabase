---
description: Protocol for implementing features across Database, Server Actions, and UI in GrainFlow.
---

# Full-Stack Feature Workflow (GrainFlow)

**Goal:** Ensure every feature has complete implementation from database to UI.

## Phase 1: Database Layer (The "Foundation")

Define the data structure and security.

1. **Identify Data Needs**: Does this need a new table or just extend existing?

   - _Complex Data_ (e.g., Transactions, Customers) → **New Table**
   - _Simple Data_ (e.g., Settings, Flags) → **Extend Existing Table**

2. **Implementation**:

   ```sql
   -- supabase/migrations/YYYYMMDD_feature.sql
   -- NOTE: If this modifies core schema, consider if it should be part of the monolithic
   -- 'supabase/migrations/20260115000013_single_truth.sql' baseline or a new migration.
   -- For most new features, a new migration file is appropriate.

   CREATE TABLE feature_name (...);
   ALTER TABLE feature_name ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "..." ON feature_name FOR SELECT USING (...);
   CREATE INDEX idx_feature_warehouse ON feature_name(warehouse_id);
   ```

## Phase 2: Data Access Layer (The "Bridge")

Create query functions for Server Components.

1. **Location**: `src/lib/queries/feature.ts`
2. **Pattern**:
   ```typescript
   export const getFeatureData = cache(async () => {
     const supabase = await createClient();
     const warehouseId = await getUserWarehouse();
     return await supabase
       .from("feature")
       .select("*")
       .eq("warehouse_id", warehouseId);
   });
   ```

## Phase 3: Server Actions (The "Controller")

Handle mutations and form submissions.

1. **Location**: `src/lib/actions.ts`
2. **Pattern**:
   ```typescript
   "use server";
   export async function addFeature(prevState, formData) {
     const data = FeatureSchema.parse(Object.fromEntries(formData));
     await checkRateLimit(userId, "addFeature");
     // ... insert to database
     revalidatePath("/feature");
   }
   ```

## Phase 4: UI Layer (The "Face")

Display and interact with the data.

1. **Server Component** (`src/app/(dashboard)/feature/page.tsx`):

   - Fetch data using query functions
   - Set `revalidate` for caching
   - Pass data to Client Component

2. **Client Component** (`src/components/feature/`):
   - Use `useActionState` for forms
   - Implement optimistic updates
   - Handle loading/error states

---

## Example: Converting "Expense Tracking" to Full-Stack

1. **Database**: Create `expenses` table with RLS policies
2. **Queries**: Add `getExpenses()` in `src/lib/queries/financials.ts`
3. **Actions**: Add `addExpense()` in `src/lib/actions.ts`
4. **UI**: Create `/expenses` page with form and list

---

## Verification Checklist

- [ ] Database migration applied
- [ ] RLS policies tested
- [ ] Query function returns correct data
- [ ] Server action validates and saves
- [ ] UI displays and updates correctly
- [ ] Build passes (`npm run build`)
- [ ] Types check (`npm run typecheck`)
