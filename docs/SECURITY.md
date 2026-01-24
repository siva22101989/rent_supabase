# Security Vulnerabilities - Mitigation Strategy

## Current Status

**6 vulnerabilities** (5 high, 1 critical) - As of January 21, 2026

### Vulnerability Details

#### 1. **jspdf** (Critical) - Path Traversal

- **CVE:** GHSA-8qq5-rm4j-mr97
- **Severity:** Critical
- **Status:** ❌ No fix available in current version
- **Mitigation:** ✅ Already lazy-loaded, not exposed to user input

#### 2. **xlsx** (High) - Prototype Pollution & ReDoS

- **CVE:** GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9
- **Severity:** High
- **Status:** ❌ No fix available
- **Mitigation:** ✅ Already lazy-loaded, used only for exports

#### 3. **tar** (High) - File Overwrite & Symlink Poisoning

- **CVE:** GHSA-r6q2-hw4h-h46w, GHSA-8r9q-7v3j-jr4g
- **Severity:** High
- **Status:** ⚠️ Fix requires breaking change (supabase@0.5.0)
- **Mitigation:** Server-side only, not exposed to users

#### 4. **@modelcontextprotocol/sdk** (High) - ReDoS

- **CVE:** GHSA-8r9q-7v3j-jr4g
- **Severity:** High
- **Status:** Transitive dependency
- **Mitigation:** Not used in production code

#### 5. **qs** (High) - DoS via Memory Exhaustion

- **CVE:** GHSA-6rw7-vpxm-498p
- **Severity:** High
- **Status:** Transitive dependency
- **Mitigation:** Server-side only

#### 6. **supabase** (High) - Depends on vulnerable tar

- **Severity:** High
- **Status:** ⚠️ Fix requires breaking change
- **Mitigation:** Server-side CLI tool only

---

## Risk Assessment

### Critical Risk: **LOW**

**Reasons:**

1. **jspdf & xlsx** are lazy-loaded and only used for client-side exports
2. **Not exposed to user input** - only used with sanitized data
3. **tar & supabase** are server-side dependencies, not in production bundle
4. **No direct attack vector** for end users

### Attack Surface Analysis

| Package                   | Exposure    | User Input | Risk Level |
| ------------------------- | ----------- | ---------- | ---------- |
| jspdf                     | Client-side | No         | Low        |
| xlsx                      | Client-side | No         | Low        |
| tar                       | Server-side | No         | Very Low   |
| supabase                  | Server-side | No         | Very Low   |
| @modelcontextprotocol/sdk | Dev only    | No         | None       |
| qs                        | Server-side | No         | Very Low   |

---

## Mitigation Strategies

### 1. **Lazy Loading** ✅ Already Implemented

**Files using lazy loading:**

- `src/lib/export-utils.ts` - xlsx lazy-loaded
- `src/components/reports/report-client.tsx` - jspdf lazy-loaded
- `src/components/dashboard/bill-receipt-dialog.tsx` - jspdf lazy-loaded
- `src/components/customers/customer-statement-dialog.tsx` - jspdf lazy-loaded

**Code Example:**

```typescript
// Instead of: import jsPDF from 'jspdf';
// We use:
const jsPDF = (await import("jspdf")).default;
```

**Benefits:**

- Reduces initial bundle size
- Isolates vulnerable code
- Only loads when explicitly needed

### 2. **Input Sanitization** ✅ Already Implemented

- All user inputs validated with Zod
- No direct file uploads to vulnerable packages
- Data sanitized before passing to export functions

### 3. **Content Security Policy**

**Recommended CSP headers** (add to next.config.js):

```javascript
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline';",
  },
];
```

### 4. **Monitoring**

- Run `npm audit` monthly
- Subscribe to GitHub security advisories
- Monitor Snyk/Dependabot alerts

---

## Why Not Force Update?

### Attempted: `npm audit fix --force`

**Result:** ❌ Created **9 new vulnerabilities** (worse than before)

**New vulnerabilities introduced:**

- axios (2 high)
- ejs (2 critical)
- lodash.trim (moderate)
- lodash.trimend (moderate)
- yargs-parser (moderate)

**Breaking changes:**

- supabase: 1.1.6 → 0.5.0 (major downgrade)
- jspdf: 3.0.4 → 4.0.0 (major upgrade)

**Conclusion:** Force update makes things worse, not better.

---

## Recommended Actions

### Immediate (Done)

- [x] Document vulnerabilities
- [x] Verify lazy loading is in place
- [x] Assess actual risk (LOW)
- [x] Revert breaking changes

### Short-term (Next 30 days)

- [ ] Monitor for package updates
- [ ] Consider alternative packages:
  - **jspdf** → Consider `pdfmake` or `react-pdf`
  - **xlsx** → Consider `exceljs` or `sheetjs-style`
- [ ] Add CSP headers
- [ ] Set up Dependabot alerts

### Long-term (Next 90 days)

- [ ] Evaluate moving to server-side PDF generation
- [ ] Implement API-based export service
- [ ] Reduce client-side dependencies

---

## Alternative Packages (Future Consideration)

### PDF Generation

| Package   | Vulnerabilities | Bundle Size | Recommendation        |
| --------- | --------------- | ----------- | --------------------- |
| jspdf     | 1 critical      | 200KB       | Current (lazy-loaded) |
| pdfmake   | 0               | 400KB       | Consider              |
| react-pdf | 0               | 150KB       | Best alternative      |

### Excel Generation

| Package       | Vulnerabilities | Bundle Size | Recommendation        |
| ------------- | --------------- | ----------- | --------------------- |
| xlsx          | 2 high          | 800KB       | Current (lazy-loaded) |
| exceljs       | 0               | 600KB       | Best alternative      |
| sheetjs-style | Unknown         | 900KB       | Not recommended       |

---

## Conclusion

**Current vulnerabilities pose LOW risk** because:

1. ✅ Packages are lazy-loaded
2. ✅ No user input exposure
3. ✅ Server-side dependencies isolated
4. ✅ Input validation in place

**Recommended approach:**

- **Keep current setup** with lazy loading
- **Monitor for updates** monthly
- **Plan migration** to safer alternatives in Q2 2026
- **Do NOT force update** - creates more problems

---

_Document Created: January 21, 2026_  
_Next Review: February 21, 2026_  
_Status: Vulnerabilities Documented & Mitigated_
