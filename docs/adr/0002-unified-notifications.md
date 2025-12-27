# ADR 2: Unified Notification and Error Handling Pattern

## Status

Accepted

## Date

2025-12-26

## Context

The application used a mix of direct `useToast` (Shadcn) calls and manual error message rendering in forms. This led to inconsistent UI (different variance of toast colors/titles) and scattered error handling logic.

## Decision

We implemented a standardized notification and error handling pattern consisting of:

1. **`useUnifiedToast` Hook:** A wrapper around Shadcn's toast that provides semantic methods (`success`, `error`, `info`, `warning`) with pre-configured titles and styles.
2. **`FormError` Component:** A shared component for rendering server-side validation or action errors at the top of forms, ensuring consistent placement and styling (destructive theme with icon).
3. **`SubmitButton` Component:** (Already partially in use) Standardizing on a button that automatically tracks `pending` status from `useFormStatus` to show a loading spinner.

## Consequences

### Positive

- **UI Consistency:** All success and error messages now look and behave the same way across the application.
- **Developer Productivity:** Simplified API for sending notifications (`toastSuccess("...", "...")` instead of manual object configuration).
- **Improved UX:** Users always see errors in the same location (top of form) and can identify the status of their action immediately via semantic toasts.

### Negative

- **Component Dependency:** Standardized components must be imported in every new form.
- **Refactoring Effort:** Many existing components required refactoring to adopt the new pattern.
