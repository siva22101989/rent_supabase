---
description: Best practices for CI/CD pipelines, Vercel deployment, and database migration strategies for BagBill.
---

# CI/CD Workflows

## Workflow 1: Vercel Deployment

**Goal:** Automate deployment to Vercel.

### Automatic Deployment

Vercel automatically deploys on:

- **Push to `main`**: Production deployment
- **Push to other branches**: Preview deployment
- **Pull Requests**: Preview deployment with comment

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Deploy preview
vercel
```

### Environment Variables

Set in Vercel Dashboard → Settings → Environment Variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `TEXTBEE_API_KEY`
- `SENTRY_DSN`

---

## Workflow 2: Database Migration Deployment

**Goal:** Safely deploy database changes.

### Local Development

```bash
# Create migration
# Edit supabase/migrations/YYYYMMDD_name.sql

# Test locally (if using Supabase CLI)
supabase db reset
```

### Production Deployment

**Option 1: Supabase Dashboard**

1. Go to Supabase Dashboard → SQL Editor
2. Paste migration SQL
3. Run migration

**Option 2: Supabase CLI**

```bash
supabase db push
```

### Rollback Strategy

```sql
-- Always include rollback in migration comments
-- Rollback: DROP TABLE feature_name;
```

---

## Workflow 3: GitHub Actions (Optional)

**Goal:** Automate testing on every PR.

### Setup

Create `.github/workflows/test.yml`:

```yaml
name: Test

on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
```

---

## Workflow 4: Pre-Deployment Checklist

**Goal:** Verify everything before deploying.

### Checklist

- [ ] All tests pass (`npm run test:all`)
- [ ] Build succeeds (`npm run build`)
- [ ] Types check (`npm run typecheck`)
- [ ] Environment variables set in Vercel
- [ ] Database migrations applied
- [ ] RLS policies verified
- [ ] Sentry configured
- [ ] Analytics enabled

---

## Workflow 5: Monitoring Post-Deployment

**Goal:** Ensure deployment is healthy.

### Immediate Checks

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Check Vercel logs
vercel logs
```

### Ongoing Monitoring

- **Sentry**: Check for new errors
- **Vercel Analytics**: Monitor Core Web Vitals
- **Supabase**: Check query performance

---

## Best Practices

- **Never deploy on Friday** (unless emergency)
- **Test in preview** before merging to main
- **Monitor for 30 minutes** after deployment
- **Have rollback plan** ready
- **Communicate** deployments to team
