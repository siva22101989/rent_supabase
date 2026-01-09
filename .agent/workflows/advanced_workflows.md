---
description: Advanced patterns including optimistic updates, real-time subscriptions, and batch operations in GrainFlow.
---

# Advanced Workflows

## Workflow 1: Optimistic Updates

**Goal:** Provide instant UI feedback before server confirmation.

### Pattern

```typescript
"use client";
import { useOptimistic, startTransition } from "react";

export function FeatureList({ initialData }) {
  const [optimisticData, addOptimistic] = useOptimistic(
    initialData,
    (state, newItem) => [newItem, ...state]
  );

  const handleSubmit = async (formData) => {
    // Optimistically add item
    startTransition(() => {
      addOptimistic({ id: "temp", ...formData, pending: true });
    });

    // Submit to server
    await addFeature(formData);
  };

  return (
    <ul>
      {optimisticData.map((item) => (
        <li key={item.id} className={item.pending ? "opacity-50" : ""}>
          {item.name}
        </li>
      ))}
    </ul>
  );
}
```

---

## Workflow 2: Real-Time Subscriptions

**Goal:** Update UI when database changes (e.g., multi-user scenarios).

### Pattern

```typescript
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function RealtimeFeatureList({ initialData }) {
  const [data, setData] = useState(initialData);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("feature_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "feature_name",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setData((prev) => [payload.new, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return <FeatureList data={data} />;
}
```

---

## Workflow 3: Batch Operations

**Goal:** Efficiently process multiple items.

### Pattern

```typescript
"use server";
export async function batchUpdateStatus(ids: string[], status: string) {
  const supabase = await createClient();

  // Single query instead of loop
  const { error } = await supabase
    .from("feature_name")
    .update({ status })
    .in("id", ids);

  if (error) throw error;

  revalidatePath("/feature");
}
```

---

## Workflow 4: Infinite Scroll / Pagination

**Goal:** Load data incrementally.

### Server Action

```typescript
"use server";
export async function getFeaturePage(page: number, limit = 20) {
  const supabase = await createClient();
  const offset = page * limit;

  const { data } = await supabase
    .from("feature_name")
    .select("*")
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  return data;
}
```

### Client Component

```typescript
"use client";
import { useState } from "react";

export function InfiniteList({ initialData }) {
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    setLoading(true);
    const nextPage = await getFeaturePage(page + 1);
    setData((prev) => [...prev, ...nextPage]);
    setPage((p) => p + 1);
    setLoading(false);
  };

  return (
    <>
      <List data={data} />
      <Button onClick={loadMore} disabled={loading}>
        Load More
      </Button>
    </>
  );
}
```

---

## Workflow 5: File Upload (Storage)

**Goal:** Upload files to Supabase Storage.

### Pattern

```typescript
"use server";
export async function uploadFile(formData: FormData) {
  const file = formData.get("file") as File;
  const supabase = await createClient();

  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from("documents")
    .upload(fileName, file);

  if (error) throw error;

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("documents").getPublicUrl(fileName);

  return publicUrl;
}
```

---

## Workflow 6: Background Jobs (Cron)

**Goal:** Run scheduled tasks.

### Vercel Cron

Create `app/api/cron/daily/route.ts`:

```typescript
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Run daily task
  await sendDailyReport();

  return Response.json({ success: true });
}
```

Configure in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 0 * * *"
    }
  ]
}
```

---

## Best Practices

- **Use optimistic updates** for better UX
- **Batch operations** when possible
- **Paginate large datasets** (don't load 1000+ items)
- **Unsubscribe** from real-time channels on unmount
- **Validate files** before upload (size, type)
