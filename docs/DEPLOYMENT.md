# Production Deployment Runbook

## Pre-Deployment Checklist

### Code Quality

- [ ] All TypeScript errors resolved (`npm run typecheck`)
- [ ] Build succeeds without errors (`npm run build`)
- [ ] All E2E tests pass (`npm run test:e2e`)
- [ ] No console.error in production code
- [ ] Sentry integration tested

### Database

- [ ] All migrations applied successfully
- [ ] RLS enabled on all tables
- [ ] Database functions secured
- [ ] Indexes created
- [ ] Backup configured

### Security

- [ ] Environment variables secured
- [ ] API keys rotated
- [ ] Leaked password protection enabled (Supabase Dashboard)
- [ ] Rate limiting configured
- [ ] CORS properly configured

### Monitoring

- [ ] Sentry project configured
- [ ] Error alerts set up
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured

---

## Deployment Steps

### 1. Staging Deployment

#### A. Prepare Staging Environment

```bash
# Set staging environment variables
NEXT_PUBLIC_SUPABASE_URL=<staging_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging_key>
SENTRY_DSN=<sentry_dsn>
NODE_ENV=production
```

#### B. Deploy to Vercel Staging

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy to staging
vercel --prod=false

# Or use Vercel Dashboard:
# 1. Connect GitHub repository
# 2. Set environment variables
# 3. Deploy from main branch
```

#### C. Run Database Migrations on Staging

```bash
# Apply migrations via Supabase Dashboard or CLI
supabase db push --db-url <staging_db_url>

# Or use MCP server:
# Apply each migration file in order
```

#### D. Verify Staging Deployment

- [ ] Application loads correctly
- [ ] Login works
- [ ] Create test inflow record
- [ ] Create test outflow
- [ ] Process test payment
- [ ] Check Sentry for errors
- [ ] Verify RLS isolation between warehouses

### 2. Production Deployment

#### A. Final Pre-Production Checks

```bash
# Run full test suite
npm run test:e2e

# Verify build
npm run build

# Check for any warnings
npm run lint
```

#### B. Database Backup

```bash
# Create production database backup
# Via Supabase Dashboard:
# 1. Go to Database → Backups
# 2. Create manual backup
# 3. Download backup file
# 4. Store securely
```

#### C. Deploy to Production

```bash
# Deploy to Vercel production
vercel --prod

# Or via Vercel Dashboard:
# 1. Merge to production branch
# 2. Automatic deployment triggers
# 3. Monitor deployment logs
```

#### D. Apply Production Migrations

```bash
# CRITICAL: Apply in order
# 1. enable_rls_sequences
# 2. secure_function_search_paths
# 3. add_performance_indexes
# 4. consolidate_rls_policies
```

#### E. Post-Deployment Verification

- [ ] Health check endpoint responds
- [ ] Login works for test user
- [ ] Create real inflow record
- [ ] Verify calculations correct
- [ ] Check Sentry dashboard
- [ ] Monitor error rates
- [ ] Verify performance metrics

---

## Rollback Procedures

### If Deployment Fails

#### Option 1: Revert Vercel Deployment

```bash
# Via Vercel Dashboard:
# 1. Go to Deployments
# 2. Find previous working deployment
# 3. Click "Promote to Production"

# Via CLI:
vercel rollback
```

#### Option 2: Revert Database Migrations

```sql
-- Revert consolidate_rls_policies
-- Restore original policies from backup

-- Revert add_performance_indexes
DROP INDEX IF EXISTS idx_activity_logs_warehouse_id;
DROP INDEX IF EXISTS idx_storage_records_customer_id;
-- ... (drop all created indexes)

-- Revert secure_function_search_paths
-- Functions remain secure, no need to revert

-- Revert enable_rls_sequences
ALTER TABLE sequences DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read sequences for their warehouse" ON sequences;
-- ... (drop all sequence policies)
```

### If Critical Bug Found

1. **Immediate Actions:**

   - Roll back to previous deployment
   - Notify all users via notification system
   - Post status update

2. **Investigation:**

   - Check Sentry for error details
   - Review recent changes
   - Reproduce in staging

3. **Fix and Redeploy:**
   - Fix bug in development
   - Test thoroughly in staging
   - Deploy fix to production
   - Monitor closely

---

## Monitoring Setup

### Sentry Configuration

#### Error Alerts

```javascript
// Configure in Sentry Dashboard
{
  "alerts": [
    {
      "name": "High Error Rate",
      "conditions": "error count > 10 in 5 minutes",
      "actions": ["email", "slack"]
    },
    {
      "name": "Critical Error",
      "conditions": "error level = fatal",
      "actions": ["email", "sms", "slack"]
    }
  ]
}
```

#### Performance Monitoring

- Transaction threshold: 3 seconds
- Database query threshold: 1 second
- API endpoint threshold: 2 seconds

### Uptime Monitoring

Use services like:

- Vercel Analytics (built-in)
- UptimeRobot (external)
- Pingdom (external)

Configure checks:

- Frequency: Every 5 minutes
- Timeout: 30 seconds
- Locations: Multiple regions
- Alert channels: Email, Slack

---

## Backup Configuration

### Automated Backups

#### Supabase Database Backups

```
Schedule: Daily at 2 AM UTC
Retention: 7 days
Storage: Supabase managed
```

#### Manual Backup Process

```bash
# Export database
pg_dump <connection_string> > backup_$(date +%Y%m%d).sql

# Backup to cloud storage
aws s3 cp backup_*.sql s3://your-bucket/backups/

# Or use Supabase CLI
supabase db dump -f backup.sql
```

### Backup Verification

- [ ] Test restore monthly
- [ ] Verify data integrity
- [ ] Document restore time
- [ ] Update runbook with findings

---

## Performance Optimization

### Database Query Optimization

Monitor slow queries:

```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

Add indexes as needed:

```sql
-- Example: Add index for slow query
CREATE INDEX idx_custom_query ON table_name(column1, column2);
```

### Frontend Optimization

- Enable Vercel Edge Caching
- Use Next.js Image Optimization
- Implement code splitting
- Monitor bundle size

---

## Troubleshooting Guide

### Common Issues

#### 1. Users Can't Login

**Symptoms:** Login fails, redirect loop
**Causes:**

- Supabase URL/Key mismatch
- RLS policies too restrictive
- Session cookie issues

**Solutions:**

```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Verify RLS policies
# Check Supabase Dashboard → Authentication → Policies

# Clear cookies and retry
```

#### 2. Slow Page Load

**Symptoms:** Pages take >5 seconds to load
**Causes:**

- Missing database indexes
- N+1 query problem
- Large data fetches

**Solutions:**

```sql
-- Check for missing indexes
SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;

-- Add composite indexes for common queries
CREATE INDEX idx_composite ON table(col1, col2);
```

#### 3. Calculation Errors

**Symptoms:** Incorrect rent/payment amounts
**Causes:**

- Billing cycle logic error
- Floating point precision
- Timezone issues

**Solutions:**

- Check calculation logic in actions.ts
- Use Decimal type for currency
- Ensure consistent timezone (UTC)

#### 4. RLS Blocking Legitimate Access

**Symptoms:** Users can't see their own data
**Causes:**

- Policy too restrictive
- warehouse_assignments not updated
- User role incorrect

**Solutions:**

```sql
-- Check user's warehouse assignments
SELECT * FROM warehouse_assignments WHERE user_id = '<user_id>';

-- Check user's role
SELECT role FROM profiles WHERE id = '<user_id>';

-- Temporarily disable RLS for debugging (STAGING ONLY)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

---

## Emergency Contacts

### On-Call Rotation

- **Primary:** [Name] - [Phone] - [Email]
- **Secondary:** [Name] - [Phone] - [Email]
- **Escalation:** [Name] - [Phone] - [Email]

### Service Providers

- **Hosting:** Vercel Support - support@vercel.com
- **Database:** Supabase Support - support@supabase.io
- **Monitoring:** Sentry Support - support@sentry.io

---

## Post-Deployment Tasks

### First 24 Hours

- [ ] Monitor error rates every hour
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Verify all critical flows work
- [ ] Document any issues found

### First Week

- [ ] Analyze usage patterns
- [ ] Optimize slow queries
- [ ] Review Sentry errors
- [ ] Gather user feedback
- [ ] Plan next iteration

### First Month

- [ ] Performance review
- [ ] Security audit
- [ ] Backup verification
- [ ] Capacity planning
- [ ] Feature prioritization

---

## Maintenance Windows

### Scheduled Maintenance

- **Frequency:** Monthly
- **Duration:** 2 hours
- **Time:** Sunday 2-4 AM UTC
- **Notification:** 7 days advance notice

### Maintenance Checklist

- [ ] Notify users
- [ ] Create database backup
- [ ] Apply updates
- [ ] Run migrations
- [ ] Test critical flows
- [ ] Monitor for issues
- [ ] Send completion notice

---

## Success Criteria

### Deployment Success

- ✅ Zero downtime during deployment
- ✅ All health checks pass
- ✅ Error rate < 0.1%
- ✅ Page load time < 3 seconds
- ✅ All critical flows tested

### Production Health

- ✅ Uptime > 99.9%
- ✅ Response time < 2 seconds
- ✅ Error rate < 0.5%
- ✅ User satisfaction > 90%
- ✅ Data integrity maintained

---

**Last Updated:** December 20, 2025  
**Version:** 1.0  
**Owner:** DevOps Team
