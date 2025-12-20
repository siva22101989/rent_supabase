# Security Configuration Guide

## Overview

This guide covers all security configurations needed for production deployment of BagBill WMS.

---

## 1. Supabase Security Settings

### Enable Leaked Password Protection

**Location:** Supabase Dashboard → Authentication → Policies

**Steps:**

1. Log in to Supabase Dashboard
2. Select your project
3. Navigate to Authentication → Policies
4. Find "Password Strength" section
5. Enable "Leaked Password Protection"
6. Set minimum password strength to "Fair" or higher

**What it does:**

- Checks passwords against HaveIBeenPwned database
- Prevents use of compromised passwords
- Enhances account security

---

## 2. Rate Limiting

### API Route Protection

Create middleware for rate limiting:

```typescript
// src/middleware/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
});

export async function rateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(
    identifier
  );

  if (!success) {
    throw new Error("Rate limit exceeded");
  }

  return { limit, reset, remaining };
}
```

**Apply to critical endpoints:**

```typescript
// In server actions
export async function addInflow(data: FormData) {
  const user = await getUser();
  await rateLimit(`inflow_${user.id}`);

  // ... rest of function
}
```

**Recommended Limits:**

- Login attempts: 5 per 15 minutes
- API calls: 100 per minute per user
- File uploads: 10 per hour
- Password reset: 3 per hour

---

## 3. Environment Variables Security

### Production Environment Variables

**Required Variables:**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Sentry
SENTRY_DSN=https://your-sentry-dsn
SENTRY_AUTH_TOKEN=your_auth_token
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project

# Next.js
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

**Security Best Practices:**

- ✅ Never commit .env files to git
- ✅ Use different keys for staging/production
- ✅ Rotate keys every 90 days
- ✅ Use Vercel's encrypted environment variables
- ✅ Limit service role key usage to server-side only

---

## 4. CORS Configuration

### Supabase CORS Settings

**Location:** Supabase Dashboard → Settings → API

**Allowed Origins:**

```
Production: https://your-domain.com
Staging: https://staging.your-domain.com
Development: http://localhost:9002
```

**Do NOT allow:**

- `*` (wildcard)
- `http://` in production
- Untrusted domains

---

## 5. Content Security Policy (CSP)

### Next.js CSP Headers

Add to `next.config.ts`:

```typescript
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

export default {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## 6. Database Security Checklist

### Row Level Security (RLS)

**Verify all tables have RLS enabled:**

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- All should show rowsecurity = true
```

**Critical Tables:**

- ✅ warehouses
- ✅ customers
- ✅ storage_records
- ✅ payments
- ✅ expenses
- ✅ sequences
- ✅ users/profiles

### Function Security

**Verify all functions are secured:**

```sql
-- Check function security
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION';

-- All should have SECURITY DEFINER
```

---

## 7. Authentication Security

### Password Requirements

**Minimum Requirements:**

- Length: 8 characters
- Complexity: Mix of letters, numbers, symbols
- No common passwords
- No leaked passwords (via HaveIBeenPwned)

**Supabase Settings:**

```json
{
  "password_min_length": 8,
  "password_required_characters": "letters,numbers",
  "enable_signup": true,
  "enable_anonymous_sign_ins": false,
  "enable_email_confirmations": true
}
```

### Session Management

**Configure in Supabase:**

- Session timeout: 7 days
- Refresh token rotation: Enabled
- JWT expiry: 1 hour
- Concurrent sessions: Limited to 3

---

## 8. API Security

### Supabase API Keys

**Key Types and Usage:**

1. **Anon Key** (Public)

   - ✅ Use in frontend
   - ✅ Subject to RLS
   - ✅ Safe to expose
   - ❌ Never use for admin operations

2. **Service Role Key** (Secret)
   - ❌ Never expose to frontend
   - ✅ Use only in server actions
   - ✅ Bypasses RLS
   - ✅ Store in environment variables

**Key Rotation Schedule:**

- Anon key: Every 6 months
- Service role key: Every 3 months
- After any suspected breach: Immediately

---

## 9. Input Validation

### Server-Side Validation

**Always validate on server:**

```typescript
import { z } from "zod";

const InflowSchema = z.object({
  customerId: z.string().uuid(),
  bagsStored: z.number().positive().int(),
  commodityDescription: z.string().min(1).max(200),
  storageStartDate: z.date(),
  hamaliRate: z.number().nonnegative(),
});

export async function addInflow(data: FormData) {
  // Validate input
  const parsed = InflowSchema.safeParse({
    customerId: data.get("customerId"),
    bagsStored: Number(data.get("bagsStored")),
    // ... etc
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.errors };
  }

  // Process validated data
}
```

**Validation Rules:**

- ✅ Validate all user input
- ✅ Sanitize strings
- ✅ Check number ranges
- ✅ Verify UUIDs
- ✅ Validate dates
- ✅ Check file types/sizes

---

## 10. Error Handling Security

### Don't Leak Sensitive Information

**Bad:**

```typescript
catch (error) {
  return { error: error.message }; // May expose DB structure
}
```

**Good:**

```typescript
catch (error) {
  logError(error, { operation: 'add_inflow' });
  return { error: 'Failed to create record' }; // Generic message
}
```

**Error Response Guidelines:**

- ❌ Don't expose stack traces
- ❌ Don't reveal database structure
- ❌ Don't show internal paths
- ✅ Log detailed errors to Sentry
- ✅ Return generic messages to users

---

## 11. File Upload Security

### Secure File Handling

**If implementing file uploads:**

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export async function uploadFile(file: File) {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File too large");
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Invalid file type");
  }

  // Scan for malware (if using third-party service)
  await scanFile(file);

  // Upload to secure storage
  const { data, error } = await supabase.storage
    .from("documents")
    .upload(`${userId}/${uuid()}.${ext}`, file);
}
```

---

## 12. Audit Logging

### Track Security Events

**Log these events:**

- Login attempts (success/failure)
- Password changes
- Role changes
- Data exports
- Admin actions
- Failed authorization attempts

**Implementation:**

```typescript
export async function logSecurityEvent(
  event: string,
  userId: string,
  metadata?: any
) {
  await supabase.from("security_audit_log").insert({
    event,
    user_id: userId,
    ip_address: getClientIP(),
    user_agent: getUserAgent(),
    metadata,
    timestamp: new Date(),
  });
}
```

---

## 13. Dependency Security

### Regular Security Audits

**Run regularly:**

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Check for outdated packages
npm outdated

# Update dependencies
npm update
```

**Automated Scanning:**

- Enable Dependabot on GitHub
- Use Snyk for continuous monitoring
- Set up automated PR for security updates

---

## 14. Monitoring & Alerts

### Security Monitoring

**Set up alerts for:**

- Multiple failed login attempts
- Unusual API usage patterns
- Database errors
- RLS policy violations
- Unauthorized access attempts

**Sentry Alert Configuration:**

```javascript
{
  "security_alerts": [
    {
      "name": "Multiple Failed Logins",
      "filter": "error.type:AuthError AND error.value:*failed*",
      "threshold": "5 in 10 minutes",
      "action": "email + slack"
    },
    {
      "name": "RLS Violation",
      "filter": "error.type:PostgresError AND error.value:*policy*",
      "threshold": "1",
      "action": "email + sms"
    }
  ]
}
```

---

## 15. Incident Response Plan

### Security Breach Response

**Immediate Actions (< 1 hour):**

1. Identify affected systems
2. Isolate compromised components
3. Rotate all API keys
4. Force logout all users
5. Notify security team

**Short-term Actions (< 24 hours):**

1. Analyze breach extent
2. Patch vulnerabilities
3. Restore from clean backup
4. Document incident
5. Notify affected users

**Long-term Actions (< 1 week):**

1. Conduct security audit
2. Implement additional safeguards
3. Update security policies
4. Train team on prevention
5. Report to authorities if required

---

## Security Checklist

### Pre-Production

- [ ] All RLS policies enabled
- [ ] Database functions secured
- [ ] Leaked password protection enabled
- [ ] Rate limiting implemented
- [ ] CORS configured
- [ ] CSP headers added
- [ ] Input validation on all endpoints
- [ ] Error messages sanitized
- [ ] Audit logging enabled
- [ ] Security monitoring configured

### Post-Production

- [ ] Monitor security alerts daily
- [ ] Review audit logs weekly
- [ ] Run security scans monthly
- [ ] Rotate keys quarterly
- [ ] Conduct penetration testing annually

---

**Last Updated:** December 20, 2025  
**Version:** 1.0  
**Owner:** Security Team
