---
description: Comprehensive testing strategies for BagBill including unit, integration, and E2E tests.
---

# Testing Workflows

## Workflow 1: Unit Testing (Vitest)

**Goal:** Test individual functions and utilities.

### Setup

Tests are in `src/test/` and use Vitest.

### Pattern

```typescript
// src/test/billing.test.ts
import { describe, it, expect } from "vitest";
import { calculateRent } from "@/lib/billing";

describe("calculateRent", () => {
  it("calculates rent for 6-month period", () => {
    const result = calculateRent({ bags: 100, months: 6, ratePerBag: 10 });
    expect(result).toBe(6000);
  });
});
```

### Run Tests

```bash
npm run test          # Run all unit tests
npm run test:watch    # Watch mode
```

---

## Workflow 2: Integration Testing (Server Actions)

**Goal:** Test server actions with mocked Supabase.

### Pattern

```typescript
// src/test/actions.test.ts
import { describe, it, expect, vi } from "vitest";
import { addInflow } from "@/lib/actions";

vi.mock("@/utils/supabase/server");

describe("addInflow", () => {
  it("validates form data", async () => {
    const formData = new FormData();
    formData.set("bagsStored", "invalid");

    const result = await addInflow({}, formData);
    expect(result.success).toBe(false);
  });
});
```

---

## Workflow 3: E2E Testing (Playwright)

**Goal:** Test critical user flows.

### Setup

Tests are in `tests/` directory.

### Pattern

```typescript
// tests/inflow.spec.ts
import { test, expect } from "@playwright/test";

test("create inflow record", async ({ page }) => {
  await page.goto("/inflow");
  await page.fill('[name="customerName"]', "Test Customer");
  await page.fill('[name="bagsStored"]', "100");
  await page.click('button[type="submit"]');

  await expect(page.locator("text=Success")).toBeVisible();
});
```

### Run Tests

```bash
npm run test:e2e              # Run E2E tests
npm run test:e2e -- --ui      # UI mode
```

---

## Workflow 4: Security Testing (RLS)

**Goal:** Verify Row Level Security policies.

### Pattern

```bash
# Run RLS verification script
npm run security:verify-rls
```

This checks that:

- Users can only see their warehouse data
- Unauthorized access is blocked
- Policies are correctly applied

---

## Workflow 5: Test All

**Goal:** Run complete test suite before deployment.

```bash
npm run test:all
```

This runs:

1. TypeScript type checking
2. Unit tests (Vitest)
3. E2E tests (Playwright)

---

## Best Practices

- **Write tests first** for critical features (TDD)
- **Mock external services** (Supabase, SMS)
- **Test edge cases** (empty data, invalid input)
- **Keep tests fast** (< 1s per unit test)
- **Use fixtures** for common test data
