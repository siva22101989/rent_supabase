---
description: Security auditing, RLS verification, and performance optimization workflows for BagBill.
---

# Security Workflows

## Workflow 1: RLS Policy Verification

**Goal:** Ensure Row Level Security is correctly configured.

### Manual Verification

1. **Check Policy Existence**:

   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE schemaname = 'public';
   ```

2. **Test User Isolation**:
   - Login as User A
   - Verify they only see their warehouse data
   - Attempt to access User B's data (should fail)

### Automated Verification

```bash
npm run security:verify-rls
```

This script (`scripts/verify-rls.ts`) checks:

- All tables have RLS enabled
- Policies exist for SELECT, INSERT, UPDATE, DELETE
- Policies reference `auth.uid()` correctly

---

## Workflow 2: Rate Limiting Audit

**Goal:** Verify rate limiting is applied to all mutations.

### Check Server Actions

```bash
grep -r "checkRateLimit" src/lib/actions.ts
```

Ensure all mutation actions call `checkRateLimit()`.

### Test Rate Limits

```typescript
// Send 11 requests rapidly
for (let i = 0; i < 11; i++) {
  await addInflow(formData);
}
// 11th request should be rate limited
```

---

## Workflow 3: Input Validation Audit

**Goal:** Ensure all inputs are validated with Zod.

### Check Schemas

```bash
grep -r "z.object" src/lib/actions.ts
```

Verify every server action has a Zod schema.

### Test Invalid Inputs

```typescript
const invalidData = { bagsStored: -1 }; // Should fail
const result = await addInflow(invalidData);
expect(result.success).toBe(false);
```

---

## Workflow 4: CSP Header Verification

**Goal:** Verify Content Security Policy headers.

### Check Configuration

Review `next.config.ts` headers:

- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`

### Test Headers

```bash
curl -I https://your-app.vercel.app
```

Verify security headers are present.

---

## Workflow 5: Environment Variable Security

**Goal:** Ensure secrets are not exposed.

### Audit

- Check `.env` is in `.gitignore`
- Verify no secrets in client-side code
- Use `NEXT_PUBLIC_` prefix only for public vars

### Verification

```bash
grep -r "process.env" src/app/
grep -r "process.env" src/components/
```

Client components should only access `NEXT_PUBLIC_*` vars.

---

## Best Practices

- **Never disable RLS** on production tables
- **Always validate** user input with Zod
- **Rate limit** all mutation endpoints
- **Audit regularly** (monthly security review)
- **Log security events** (failed auth, rate limits)
