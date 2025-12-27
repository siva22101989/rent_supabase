# Storybook Strategy

Given the complexity of the current UI, we recommend a phased approach to implementing Storybook.

## 1. Setup

Install Storybook using the official initializer:

```bash
npx storybook@latest init
```

## 2. Priority Components

Focus on standardizing the following "Atoms" and "Molecules" first:

- **Atoms:**
  - `src/components/ui/button.tsx`
  - `src/components/ui/input.tsx`
  - `src/components/ui/badge.tsx`
  - `src/components/shared/form-error.tsx`
- **Molecules:**
  - `src/components/ui/mobile-card.tsx`
  - `src/components/ui/search-bar.tsx`
  - `src/components/shared/paid-feature.tsx`

## 3. Mocking Dependencies

Many components depend on:

- `next/navigation` (use `storybook-addon-next-router`)
- `next/cache`
- `Sentry`
- Contexts (`CustomerContext`, etc.)

Use Storybook Decorators to provide these mocks globally in `.storybook/preview.tsx`.

## 4. Visual Regression Testing

Once Storybook is set up, integrate **Chromatic** for automated visual regression testing in CI to ensure that layout fixes (like the mobile spacing fixes) do not regress.
