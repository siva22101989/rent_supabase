# BagBill Custom Workflows

This folder contains customized workflows and rules for the BagBill project, tailored to Next.js 16 + Supabase architecture.

## 📁 Contents

### Rules

- `rules/rules.md` - Core project rules and patterns

### Workflows

- `workflows/agent_workflows.md` - Discovery and context building
- `workflows/implementation_workflows.md` - Feature creation guides
- `workflows/full_stack_feature.md` - Full-stack implementation protocol
- `workflows/testing_workflows.md` - Testing strategies
- `workflows/security_workflows.md` - Security auditing
- `workflows/error_handling_workflows.md` - Error diagnosis
- `workflows/cicd_workflows.md` - Deployment workflows
- `workflows/advanced_workflows.md` - Advanced patterns
- `workflows/full_stack_audit.md` - Feature completeness checklist

## 🚀 How to Use

### Option 1: Copy to .agent (Recommended)

```powershell
# Copy all files to .agent directory
Copy-Item -Path "bagbill-workflows\*" -Destination ".agent\" -Recurse -Force
```

### Option 2: Manual Copy

1. Open `bagbill-workflows/rules/rules.md`
2. Copy content to `.agent/rules/rules.md`
3. Repeat for each workflow file

### Option 3: Replace .agent

```powershell
# Backup existing .agent (if needed)
Rename-Item -Path ".agent" -NewName ".agent-backup"

# Rename bagbill-workflows to .agent
Rename-Item -Path "bagbill-workflows" -NewName ".agent"
```

## ✅ Verification

After copying, verify the files are in place:

```powershell
ls .agent\rules\
ls .agent\workflows\
```

You should see:

- `.agent/rules/rules.md`
- `.agent/workflows/` (9 workflow files)

## 🧹 Cleanup

After copying, you can delete this folder:

```powershell
Remove-Item -Path "bagbill-workflows" -Recurse -Force
```

## 📝 What Changed

These workflows replace the original Medusa e-commerce patterns with BagBill-specific patterns:

**Before (Medusa):**

- Medusa modules and services
- Medusa Admin UI
- Medusa SDK

**After (BagBill):**

- Next.js Server Components and Server Actions
- Supabase database and RLS
- React hooks and optimistic updates

## 🎯 Key Patterns

All workflows now follow BagBill's architecture:

1. **Database**: Supabase migrations with RLS
2. **Data Access**: Query functions in `src/lib/queries/`
3. **Server Actions**: Form handlers in `src/lib/actions.ts`
4. **UI**: Server Components + Client Components
5. **Security**: RLS policies, rate limiting, Zod validation
