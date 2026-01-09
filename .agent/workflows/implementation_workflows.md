---
description: Step-by-step guides for creating new features, modifying server actions, and implementing database changes in GrainFlow.
---

# Implementation Workflows

## Workflow 1: New Feature Creation

**Goal:** Add a new feature with database, logic, and UI.

### 1. Database Migration

Create migration file in `supabase/migrations/YYYYMMDD_feature_name.sql`:

```sql
-- Create table
CREATE TABLE feature_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES warehouses(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE feature_name ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users see own warehouse data" ON feature_name
  FOR SELECT USING (
    warehouse_id IN (
      SELECT warehouse_id FROM user_warehouses
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own warehouse data" ON feature_name
  FOR INSERT WITH CHECK (
    warehouse_id IN (
      SELECT warehouse_id FROM user_warehouses
      WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_feature_warehouse ON feature_name(warehouse_id);
CREATE INDEX idx_feature_created ON feature_name(created_at DESC);
```

### 2. Data Access Layer

Create query functions in `src/lib/queries/feature.ts`:

```typescript
import { createClient } from "@/utils/supabase/server";
import { cache } from "react";
import { getUserWarehouse } from "./warehouses";

export const getFeatureData = cache(async () => {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();

  if (!warehouseId) return [];

  const { data, error } = await supabase
    .from("feature_name")
    .select("*")
    .eq("warehouse_id", warehouseId)
    .order("created_at", { ascending: false });

  if (error) {
    logError(error, { operation: "get_feature_data" });
    return [];
  }

  return data;
});
```

### 3. Server Action

Add server action to `src/lib/actions.ts`:

```typescript
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const FeatureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  // ... other fields
});

export async function addFeature(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const rawData = Object.fromEntries(formData);

  // Rate limiting
  await checkRateLimit(userId, "addFeature", { limit: 10 });

  // Validation
  const validatedFields = FeatureSchema.safeParse(rawData);
  if (!validatedFields.success) {
    return {
      message: "Invalid data",
      success: false,
      data: rawData,
    };
  }

  // Database operation
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();

  const { error } = await supabase.from("feature_name").insert({
    ...validatedFields.data,
    warehouse_id: warehouseId,
  });

  if (error) {
    logError(error, { operation: "add_feature" });
    return { message: error.message, success: false };
  }

  // Revalidate and return
  revalidatePath("/feature");
  return { message: "Feature added successfully!", success: true };
}
```

### 4. UI Implementation

**Server Component** (`src/app/(dashboard)/feature/page.tsx`):

```typescript
import { getFeatureData } from "@/lib/queries/feature";
import { FeatureClient } from "./page-client";

export const revalidate = 60; // Cache for 60 seconds

export default async function FeaturePage() {
  const data = await getFeatureData();
  return <FeatureClient initialData={data} />;
}
```

**Client Component** (`src/app/(dashboard)/feature/page-client.tsx`):

```typescript
"use client";
import { useState, useOptimistic } from "react";
import { FeatureForm } from "@/components/feature/feature-form";

export function FeatureClient({ initialData }) {
  const [optimisticData, addOptimistic] = useOptimistic(
    initialData,
    (state, newItem) => [newItem, ...state]
  );

  return (
    <>
      <PageHeader title="Feature" />
      <FeatureForm onSuccess={(item) => addOptimistic(item)} />
      <FeatureList data={optimisticData} />
    </>
  );
}
```

**Form Component** (`src/components/feature/feature-form.tsx`):

```typescript
"use client";
import { useActionState } from "react";
import { addFeature } from "@/lib/actions";

export function FeatureForm({ onSuccess }) {
  const [state, formAction, isPending] = useActionState(addFeature, {
    message: "",
    success: false,
  });

  return (
    <form action={formAction}>
      <Input name="name" label="Name" required />
      <Textarea name="description" label="Description" />
      <SubmitButton isLoading={isPending}>Submit</SubmitButton>
      {state.message && <FormError message={state.message} />}
    </form>
  );
}
```

### 5. Verification

- Run `npm run build` to check for errors
- Run `npm run typecheck` for TypeScript validation
- Test the feature manually in dev mode (`npm run dev`)
- Run E2E tests if applicable

---

## Workflow 2: Modifying Existing Features

**Goal:** Enhance existing features safely.

### 1. Discovery

- Read existing server action: `view_file("src/lib/actions.ts")`
- Identify dependencies and side effects
- Check RLS policies in migrations

### 2. Implementation

- Apply targeted code changes
- Update Zod schema if adding fields
- Add database migration if schema changes

### 3. Verification

- Run `npm run build`
- Test manually
- Update E2E tests if behavior changed

---

## Workflow 3: Documentation

**Goal:** Maintain accurate system documentation.

Update `docs/` with:

- **API Endpoints**: Server action signatures
- **Database Schema**: Table structure and RLS policies
- **Component Usage**: Props and examples
