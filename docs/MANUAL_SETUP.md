# Manual Configuration Guide

This guide covers the remaining configurations that must be done manually through the Supabase Dashboard and other services.

---

## 1. Enable Leaked Password Protection

**Service:** Supabase  
**Time Required:** 2 minutes  
**Priority:** High

### Steps:

1. **Login to Supabase Dashboard**

   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication Settings**

   - Click "Authentication" in the left sidebar
   - Click "Policies" tab

3. **Enable Password Protection**

   - Scroll to "Password Strength" section
   - Toggle ON "Leaked Password Protection"
   - Set minimum password strength to "Fair" or "Good"

4. **Save Changes**
   - Click "Save" button
   - Verify settings are applied

### What This Does:

- Checks user passwords against HaveIBeenPwned database
- Prevents use of compromised passwords
- Enhances account security

### Verification:

Try to create a user with password "password123" - it should be rejected.

---

## 2. Configure Automated Backups

**Service:** Supabase  
**Time Required:** 5 minutes  
**Priority:** High

### Steps:

1. **Navigate to Database Settings**

   - Supabase Dashboard → Database → Backups

2. **Enable Automated Backups**

   - Toggle ON "Enable automated backups"
   - Set schedule: Daily at 2:00 AM UTC
   - Set retention: 7 days

3. **Configure Backup Storage**

   - Choose storage location (Supabase managed recommended)
   - Enable backup encryption

4. **Test Backup**
   - Click "Create Backup Now"
   - Wait for completion
   - Verify backup appears in list

### Backup Schedule Recommendation:

```
Daily: 2:00 AM UTC
Retention: 7 days
Storage: Supabase managed
Encryption: Enabled
```

### Manual Backup Script:

For additional backups, use the provided script:

```bash
node scripts/backup-database.js
```

---

## 3. Set Up Monitoring Dashboards

**Service:** Sentry  
**Time Required:** 10 minutes  
**Priority:** Medium

### Steps:

1. **Login to Sentry**

   - Go to https://sentry.io
   - Select your project

2. **Configure Alerts**

   - Navigate to Alerts → Create Alert Rule

   **Alert 1: High Error Rate**

   ```
   Name: High Error Rate
   Condition: Error count > 10 in 5 minutes
   Actions: Email + Slack notification
   ```

   **Alert 2: Critical Errors**

   ```
   Name: Critical Errors
   Condition: Error level = fatal
   Actions: Email + SMS + Slack
   ```

   **Alert 3: Performance Degradation**

   ```
   Name: Slow Transactions
   Condition: Transaction duration > 3 seconds
   Actions: Email notification
   ```

3. **Set Up Dashboard**

   - Navigate to Dashboards → Create Dashboard
   - Add widgets:
     - Error rate over time
     - Most common errors
     - Performance metrics
     - User impact

4. **Configure Integrations**
   - Slack: Settings → Integrations → Slack
   - Email: Settings → Notifications
   - SMS (optional): Settings → Integrations → PagerDuty

### Recommended Alert Thresholds:

- Error rate: > 10 errors in 5 minutes
- Critical errors: Any fatal error
- Performance: > 3 second response time
- Database queries: > 1 second query time

---

## 4. Configure Vercel Analytics

**Service:** Vercel  
**Time Required:** 3 minutes  
**Priority:** Medium

### Steps:

1. **Enable Analytics**

   - Vercel Dashboard → Your Project → Analytics
   - Click "Enable Analytics"

2. **Configure Web Vitals**

   - Enable Core Web Vitals tracking
   - Set performance budgets:
     - LCP: < 2.5s
     - FID: < 100ms
     - CLS: < 0.1

3. **Set Up Alerts**
   - Navigate to Settings → Notifications
   - Enable alerts for:
     - Build failures
     - Deployment errors
     - Performance degradation

### Environment Variables (if not set):

```env
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=<your_analytics_id>
```

---

## 5. Set Up Uptime Monitoring

**Service:** UptimeRobot (Free) or Pingdom  
**Time Required:** 5 minutes  
**Priority:** Medium

### Steps:

1. **Create Account**

   - Go to https://uptimerobot.com
   - Sign up for free account

2. **Add Monitor**

   - Click "Add New Monitor"
   - Type: HTTP(s)
   - URL: https://your-domain.com/api/health
   - Name: GrainFlow Production
   - Monitoring Interval: 5 minutes

3. **Configure Alerts**

   - Alert Contacts: Add email/SMS
   - Alert When: Down
   - Alert After: 2 failed checks

4. **Add Status Page** (Optional)
   - Create public status page
   - Share with users

### Recommended Settings:

```
Monitor Type: HTTP(s)
URL: https://your-domain.com/api/health
Interval: 5 minutes
Timeout: 30 seconds
Alert After: 2 failures
Locations: Multiple regions
```

---

## 6. Configure Rate Limiting (Optional)

**Service:** Upstash  
**Time Required:** 15 minutes  
**Priority:** Low (can be added post-launch)

### Steps:

1. **Create Upstash Account**

   - Go to https://upstash.com
   - Sign up for free account

2. **Create Redis Database**

   - Click "Create Database"
   - Choose region closest to your users
   - Select free tier

3. **Get Connection Details**

   - Copy REST URL
   - Copy REST Token

4. **Add to Environment Variables**

   ```env
   UPSTASH_REDIS_REST_URL=<your_url>
   UPSTASH_REDIS_REST_TOKEN=<your_token>
   ```

5. **Install Dependencies**

   ```bash
   npm install @upstash/ratelimit @upstash/redis
   ```

6. **Implementation**
   - The rate limiting code is already in `src/lib/validation.ts`
   - Uncomment and configure as needed

### Recommended Rate Limits:

- Login: 5 attempts per 15 minutes
- API calls: 100 per minute per user
- File uploads: 10 per hour
- Password reset: 3 per hour

---

## 7. Set Up Error Boundaries

**Status:** ✅ Already Implemented  
**File:** `src/components/error-boundary.tsx`

### Usage in Your App:

Wrap critical routes with error boundaries:

```typescript
// In layout.tsx or page.tsx
import { ErrorBoundary } from "@/components/error-boundary";

export default function Layout({ children }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
```

---

## 8. Configure CORS (If Using External APIs)

**Service:** Supabase  
**Time Required:** 2 minutes  
**Priority:** Medium

### Steps:

1. **Navigate to API Settings**

   - Supabase Dashboard → Settings → API

2. **Configure CORS**

   - Add allowed origins:
     ```
     https://your-domain.com
     https://staging.your-domain.com
     ```
   - Do NOT add `*` or `http://` in production

3. **Save Settings**

---

## 9. Set Up SSL/TLS Certificate

**Service:** Vercel (Automatic)  
**Time Required:** Automatic  
**Priority:** High

### Verification:

1. **Check Certificate**

   - Visit https://your-domain.com
   - Click padlock icon in browser
   - Verify certificate is valid

2. **Force HTTPS**
   - Vercel automatically redirects HTTP to HTTPS
   - Verify by visiting http://your-domain.com

### If Using Custom Domain:

1. Add domain in Vercel Dashboard
2. Update DNS records as instructed
3. Wait for SSL provisioning (automatic)

---

## 10. Configure Email Service (If Needed)

**Service:** Supabase Auth  
**Time Required:** 10 minutes  
**Priority:** Medium

### Steps:

1. **Navigate to Auth Settings**

   - Supabase Dashboard → Authentication → Email Templates

2. **Customize Email Templates**

   - Confirmation email
   - Password reset email
   - Magic link email

3. **Configure SMTP** (Optional for custom domain)
   - Settings → Auth → SMTP Settings
   - Add your SMTP credentials

---

## Verification Checklist

After completing manual configurations:

### Security

- [ ] Leaked password protection enabled
- [ ] Automated backups configured
- [ ] SSL certificate active
- [ ] CORS properly configured

### Monitoring

- [ ] Sentry alerts configured
- [ ] Uptime monitoring active
- [ ] Vercel analytics enabled
- [ ] Health check endpoint working

### Optional

- [ ] Rate limiting configured
- [ ] Custom email templates set
- [ ] Status page created
- [ ] Error boundaries tested

---

## Testing Your Configuration

### 1. Test Health Check

```bash
curl https://your-domain.com/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2025-12-20T...",
  "checks": {
    "database": { "status": "healthy", "responseTime": "50ms" },
    "authentication": { "status": "healthy", "responseTime": "30ms" }
  }
}
```

### 2. Test Leaked Password Protection

1. Try to sign up with password "password123"
2. Should be rejected

### 3. Test Backup

```bash
node scripts/backup-database.js --list
```

### 4. Test Monitoring

1. Trigger a test error in Sentry
2. Verify alert received

---

## Support Resources

### Documentation

- Supabase: https://supabase.com/docs
- Sentry: https://docs.sentry.io
- Vercel: https://vercel.com/docs
- Upstash: https://docs.upstash.com

### Support Contacts

- Supabase: support@supabase.io
- Sentry: support@sentry.io
- Vercel: support@vercel.com

---

**Last Updated:** December 20, 2025  
**Estimated Total Time:** 45-60 minutes  
**Priority:** Complete within first week of production
