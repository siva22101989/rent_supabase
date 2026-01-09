# Contributing to GrainFlow

Welcome! This guide will help you get up to speed with our development workflow, coding standards, and contribution process.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Standards](#code-standards)
4. [Testing Requirements](#testing-requirements)
5. [Git Workflow](#git-workflow)
6. [Pull Request Process](#pull-request-process)
7. [Deployment](#deployment)

---

## Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: Latest version
- **Supabase Account**: For database access
- **Code Editor**: VS Code recommended

### Initial Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/rent_supabase.git
cd rent_supabase

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Run development server
npm run dev
```

### Project Structure Quick Reference

```
src/
├── app/              # Next.js pages (App Router)
├── components/       # React components
├── lib/              # Business logic
│   ├── actions/      # Server actions (mutations)
│   ├── queries/      # Data fetching
│   └── billing.ts    # Core billing logic
├── contexts/         # React contexts
└── hooks/            # Custom hooks
```

---

## Development Workflow

### 1. Pick a Task

- Check GitHub Issues or Project Board
- Assign yourself to the issue
- Move card to "In Progress"

### 2. Create Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

**Branch Naming Convention:**

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code improvements
- `docs/` - Documentation updates

### 3. Make Changes

- Write code following our [Code Standards](#code-standards)
- Write/update tests
- Update documentation if needed

### 4. Test Locally

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

### 5. Commit Changes

```bash
git add .
git commit -m "feat: add customer search functionality"
```

**Commit Message Format:**

```
type(scope): short description

[optional body]

[optional footer]
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code change that neither fixes bug nor adds feature
- `docs` - Documentation only
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

**Examples:**

```
feat(customers): add pagination to customer list
fix(billing): correct rent calculation for leap years
refactor(auth): simplify user session handling
docs(api): update server actions documentation
```

### 6. Push and Create PR

```bash
git push origin your-branch-name
# Then create Pull Request on GitHub
```

---

## Code Standards

### TypeScript

**Always use TypeScript, never `any`:**

```typescript
// ❌ Bad
function processData(data: any) { ... }

// ✅ Good
interface CustomerData {
  name: string;
  phone: string;
}
function processData(data: CustomerData) { ... }
```

**Use type inference when obvious:**

```typescript
// ✅ Good - type inferred
const count = customers.length;

// ❌ Unnecessary annotation
const count: number = customers.length;
```

### React Components

**Server Components by default:**

```typescript
// ✅ Default to Server Component
export default async function CustomersPage() {
  const customers = await getCustomers();
  return <CustomerList customers={customers} />;
}

// Only use 'use client' when you need interactivity
("use client");
export function CustomerForm() {
  const [name, setName] = useState("");
  // ...
}
```

**Component naming:**

- PascalCase for component files: `CustomerCard.tsx`
- Match export name to filename

**Props interface naming:**

```typescript
interface CustomerCardProps {
  customer: Customer;
  onSelect?: (id: string) => void;
}

export function CustomerCard({ customer, onSelect }: CustomerCardProps) {
  // ...
}
```

### Server Actions

**Always include validation:**

```typescript
"use server";

export async function addCustomer(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // 1. Validate input
  const validated = CustomerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
  });

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  // 2. Check auth
  const user = await getUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // 3. Perform mutation
  try {
    const { error } = await supabase.from("customers").insert(validated.data);

    if (error) throw error;

    // 4. Revalidate cache
    revalidatePath("/customers");

    return { success: true };
  } catch (error) {
    Sentry.captureException(error);
    return { success: false, error: "Failed to create customer" };
  }
}
```

### Styling

**Use Tailwind utility classes:**

```tsx
// ✅ Good
<div className="flex items-center gap-2 p-4 border rounded-lg">
  <span className="text-sm text-muted-foreground">Label</span>
</div>

// ❌ Avoid inline styles
<div style={{ display: 'flex', padding: '16px' }}>
```

**Use cn() for conditional classes:**

```typescript
import { cn } from '@/lib/utils';

<button className={cn(
  "px-4 py-2 rounded",
  isActive && "bg-primary text-white",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
```

### Database Queries

**Always use RLS-protected queries:**

```typescript
// ✅ Good - RLS enforced
const { data } = await supabase
  .from("customers")
  .select("*")
  .eq("warehouse_id", warehouseId);

// ❌ Bad - Bypassing RLS (only in server actions with explicit permission check)
const { data } = await getServiceClient().from("customers").select("*");
```

**Use type-safe queries:**

```typescript
const { data: customers } = await supabase
  .from("customers")
  .select("id, name, phone, storage_records(count)")
  .returns<CustomerWithCount[]>();
```

---

## Testing Requirements

### Unit Tests (Vitest)

**Test business logic in isolation:**

```typescript
// lib/billing.test.ts
import { describe, it, expect } from "vitest";
import { calculateFinalRent } from "./billing";

describe("calculateFinalRent", () => {
  it("calculates 6-month storage correctly", () => {
    const record = createMockRecord({ months: 6 });
    const result = calculateFinalRent(record, endDate, 100);

    expect(result.finalRent).toBe(6000);
    expect(result.rentPerBag).toBe(60);
  });

  it("handles leap year correctly", () => {
    // ...
  });
});
```

**Run tests:**

```bash
npm run test
npm run test:watch  # Watch mode
```

### E2E Tests (Playwright)

**Test critical user flows:**

```typescript
// tests/customer-flow.spec.ts
import { test, expect } from "@playwright/test";

test("complete customer creation flow", async ({ page }) => {
  await page.goto("/login");
  await login(page, "test@example.com", "password");

  await page.goto("/customers");
  await page.click("text=Add Customer");

  await page.fill('[name="name"]', "Test Customer");
  await page.fill('[name="phone"]', "1234567890");
  await page.click('button:has-text("Save")');

  await expect(page.locator("text=Successfully created")).toBeVisible();
});
```

**Run E2E tests:**

```bash
npm run test:e2e
npm run test:e2e:ui  # With UI
```

### Test Coverage Requirements

- ✅ All new server actions must have tests
- ✅ Critical business logic (billing, calculations) must be tested
- ✅ New features should include E2E test
- ✅ Bug fixes should include regression test

---

## Git Workflow

### Branch Strategy

```
main (production)
  ├── staging (pre-production)
  └── feature branches
```

**Rules:**

1. **Never commit directly to `main`**
2. **Always create PR for review**
3. **Squash commits when merging**
4. **Delete branch after merge**

### Commit Guidelines

**Keep commits atomic:**

```bash
# ✅ Good - Single responsibility
git commit -m "feat(customers): add search functionality"
git commit -m "test(customers): add search tests"

# ❌ Bad - Multiple unrelated changes
git commit -m "add search, fix bug, update docs"
```

**Write descriptive commit messages:**

```
feat(payments): implement payment reminder system

- Add SMS notification trigger
- Create payment reminder job
- Update payment status tracking

Closes #123
```

---

## Pull Request Process

### Before Creating PR

- [ ] Code passes all lint checks (`npm run lint`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] All tests pass (`npm run test`)
- [ ] E2E tests pass if applicable
- [ ] Documentation updated
- [ ] Self-review completed

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Screenshots (if UI changes)

[Add screenshots]

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console.log statements
```

### Review Process

1. **Create PR** - Fill out template completely
2. **Automated Checks** - Wait for CI to pass
3. **Code Review** - At least 1 approval required
4. **Address Feedback** - Make requested changes
5. **Final Approval** - Reviewer approves
6. **Merge** - Squash and merge to main

### Code Review Checklist

**As a Reviewer:**

- [ ] Code follows project standards
- [ ] No security vulnerabilities
- [ ] Business logic is sound
- [ ] Tests are comprehensive
- [ ] Documentation is clear
- [ ] No unnecessary complexity

---

## Database Changes

### Creating Migrations

**Migration file naming:**

```
YYYYMMDD_description.sql

Example:
20260105_add_customer_notes.sql
```

**Migration template:**

```sql
-- Migration: Add customer notes field
-- Created: 2026-01-05
-- Author: Developer Name

-- Forward migration
ALTER TABLE customers
ADD COLUMN notes TEXT;

CREATE INDEX idx_customers_notes ON customers(notes)
WHERE notes IS NOT NULL;

-- Rollback (in comments)
-- ALTER TABLE customers DROP COLUMN notes;
-- DROP INDEX idx_customers_notes;
```

**Testing migrations:**

```bash
# 1. Apply locally
supabase db push

# 2. Verify changes
# Check tables, indexes, RLS policies

# 3. Test rollback (if needed)
# Run rollback SQL from comments
```

---

## Deployment

### Environments

1. **Development** - Local machine (npm run dev)
2. **Staging** - Vercel preview deployments
3. **Production** - Vercel production

### Deployment Checklist

- [ ] All tests passing
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Sentry configured
- [ ] Performance tested
- [ ] Security reviewed

### Deployment Process

**Automatic (Recommended):**

1. Merge PR to `main`
2. Vercel automatically deploys
3. Monitor Sentry for errors

**Manual (Emergency):**

```bash
vercel --prod
```

---

## Troubleshooting

### Common Issues

**Build Fails:**

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

**Type Errors:**

```bash
# Regenerate types from Supabase
npx supabase gen types typescript --project-id <project-id> > src/types/database.types.ts
```

**RLS Blocks Query:**

```sql
-- Check user's warehouse assignments
SELECT * FROM user_warehouses WHERE user_id = auth.uid();

-- Verify policy exists
SELECT * FROM pg_policies WHERE tablename = 'table_name';
```

---

## Resources

### Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md)
- [Database Schema](./docs/DATABASE.md)
- [Security Guide](./docs/SECURITY.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

### External Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs) -[Shadcn/UI](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## Getting Help

**Stuck on something?**

1. Check existing documentation
2. Search closed GitHub issues
3. Ask in team chat
4. Create GitHub discussion

**Found a bug?**

1. Check if issue already exists
2. Create new issue with reproduction steps
3. Add to project board

---

**Last Updated:** January 5, 2026  
**Version:** 1.0  
**Maintainer:** Development Team
